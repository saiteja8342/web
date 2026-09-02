import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  Film,
  History,
  User,
  Settings,
  LogOut,
  Bell,
  Download,
  ExternalLink,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  Check,
  Clapperboard,
  Eye,
  Send,
  StickyNote,
  Menu,
  X
} from 'lucide-react';
import CustomCursor from '../components/CustomCursor';
import { supabase } from '../supabaseClient';
import { getClientOrders, getClientActiveOrder, STATUS_MAP, VIDEO_TYPE_MAP } from '../lib/db/orders';
import { getProfile } from '../lib/db/profiles';
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendNotification, formatNotificationTime } from '../lib/db/notifications';
import { submitRevisionRequest, getOrderRevisions } from '../lib/db/revisions';
import { subscribeToOrders, subscribeToUserNotifications, unsubscribeChannel } from '../lib/supabase/realtime';
import './client.css';

const getStatusColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('completed') || s.includes('delivered')) return '#4ade80';
  if (s.includes('editing') || s.includes('progress') || s.includes('review') || s.includes('accepted')) return '#60a5fa';
  if (s.includes('cancelled') || s.includes('rejected')) return '#f87171';
  return '#fbbf24';
};

const getStatusBadgeBg = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('completed') || s.includes('delivered')) return 'rgba(34, 197, 94, 0.12)';
  if (s.includes('editing') || s.includes('progress') || s.includes('review') || s.includes('accepted')) return 'rgba(59, 130, 246, 0.12)';
  if (s.includes('cancelled') || s.includes('rejected')) return 'rgba(239, 68, 68, 0.12)';
  return 'rgba(245, 158, 11, 0.12)';
};

const getStatusBorder = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('completed') || s.includes('delivered')) return 'rgba(34, 197, 94, 0.25)';
  if (s.includes('editing') || s.includes('progress') || s.includes('review') || s.includes('accepted')) return 'rgba(59, 130, 246, 0.25)';
  if (s.includes('cancelled') || s.includes('rejected')) return 'rgba(239, 68, 68, 0.25)';
  return 'rgba(245, 158, 11, 0.25)';
};

export default function ClientDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [activeNav, setActiveNav] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [editorNotes, setEditorNotes] = useState([]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleNavClick = (nav) => {
    if (nav !== activeNav) {
      setIsLoading(true);
      setActiveNav(nav);
      setTimeout(() => setIsLoading(false), 300);
    }
    setSidebarOpen(false);
  };

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // ─── Data Fetching ────────────────────────────────────────────────
  const fetchClientData = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const [ordersRes, activeRes, notifRes, profileRes] = await Promise.all([
        getClientOrders(userId),
        getClientActiveOrder(userId),
        getUserNotifications(userId),
        getProfile(userId),
      ]);

      if (profileRes.data) {
        setClientProfile(profileRes.data);
      }

      if (!ordersRes.error && ordersRes.data) {
        setOrders(ordersRes.data);
      }

      if (!activeRes.error && activeRes.data) {
        setActiveOrder(activeRes.data);
        // Fetch revisions/notes for this active order
        const { data: revs } = await getOrderRevisions(activeRes.data.id);
        if (revs) {
          setEditorNotes(revs.map(r => ({
            id: r.id,
            badge: r.status === 'completed' ? 'RESOLVED' : 'REVISION REQUEST',
            time: formatNotificationTime(r.created_at),
            highlight: r.status === 'pending',
            text: r.request_note,
          })));
        }
      } else {
        setActiveOrder(null);
      }

      if (!notifRes.error && notifRes.data) {
        setNotifications(notifRes.data);
      }
    } catch (err) {
      console.error('Error fetching client data:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        window.location.href = '/login';
        return;
      }
      setIsAuthenticated(true);
      setCurrentUser(session.user);
      await fetchClientData(session.user.id);
    }
    checkAuth();
  }, [fetchClientData]);

  // ─── Realtime Subscriptions ───────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id;

    const ordersChannel = subscribeToOrders({
      filter: `client_id=eq.${userId}`,
      onInsert: () => fetchClientData(userId),
      onUpdate: () => fetchClientData(userId),
      onDelete: () => fetchClientData(userId),
    });

    const notifChannel = subscribeToUserNotifications(
      userId,
      (newNotif) => setNotifications(prev => [newNotif, ...prev]),
      (updatedNotif) => setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n))
    );

    return () => {
      unsubscribeChannel(ordersChannel);
      unsubscribeChannel(notifChannel);
    };
  }, [currentUser, fetchClientData]);

  const markAllRead = async () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await markAllNotificationsAsRead(currentUser.id);
    showToast('All notifications marked as read.');
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    if (!activeOrder) {
      showToast('No active project to send note for.');
      return;
    }

    const { error } = await submitRevisionRequest(activeOrder.id, currentUser.id, newNote);
    if (error) {
      showToast('Error sending revision note: ' + error.message);
      return;
    }

    // Notify admin
    if (activeOrder.admin_id) {
      await sendNotification(
        activeOrder.admin_id,
        `Revision Requested: ${activeOrder.order_name}`,
        `${clientProfile?.full_name || 'Client'} requested revision on "${activeOrder.order_name}": "${newNote.slice(0, 60)}..."`
      );
    }

    setEditorNotes(prev => [
      {
        id: Date.now(),
        badge: 'REVISION REQUEST',
        time: 'Just now',
        highlight: true,
        text: newNote,
      },
      ...prev,
    ]);

    showToast('Revision request sent to studio admin & editor.');
    setNewNote('');
  };

  // Completed history projects
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const historyProjects = completedOrders.length > 0 ? completedOrders.map(o => ({
    id: o.id,
    title: o.order_name,
    type: VIDEO_TYPE_MAP[o.video_type] || o.video_type,
    deliveredDate: o.updated_at ? new Date(o.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    submissionDate: o.created_at ? new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    notes: o.admin_notes || o.brief || 'Final cut delivered according to specifications.',
    downloadLink: o.additional_link || o.drive_link || o.dropbox_link || '#',
  })) : [];

  const selectedProject = historyProjects.find(p => p.id === selectedHistoryId) || historyProjects[0] || null;

  // Active order milestone step calculation
  const getStepIndex = (status) => {
    switch (status) {
      case 'received': return 0;
      case 'accepted': return 1;
      case 'in_editing': return 2;
      case 'in_review': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const activeStepIdx = activeOrder ? getStepIndex(activeOrder.status) : -1;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="cp-layout">
      <CustomCursor />
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="cp-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="cp-toast">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR NAVIGATION                                                 */}
      {/* ------------------------------------------------------------------ */}
      <aside className={`cp-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          {/* Brand Header */}
          <a href="/" className="cp-brand-header">
            <img
              src="/image/mne_logo.png"
              alt="MotionNodeEdits"
              className="cp-brand-logo-img"
            />
            <div>
              <div className="cp-brand-title">MotionNodeEdits</div>
              <div className="cp-brand-sub">Client Portal</div>
            </div>
          </a>

          {/* Primary Nav Links */}
          <nav className="cp-nav-list">
            <button
              className={`cp-nav-item ${activeNav === 'home' ? 'active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Home</span>
            </button>

            <button
              className={`cp-nav-item ${activeNav === 'current' ? 'active' : ''}`}
              onClick={() => handleNavClick('current')}
            >
              <Film className="h-4 w-4 shrink-0" />
              <span>Current Project</span>
            </button>

            <button
              className={`cp-nav-item ${activeNav === 'history' ? 'active' : ''}`}
              onClick={() => handleNavClick('history')}
            >
              <History className="h-4 w-4 shrink-0" />
              <span>Project History</span>
            </button>

            <button
              className={`cp-nav-item ${activeNav === 'profile' ? 'active' : ''}`}
              onClick={() => handleNavClick('profile')}
            >
              <User className="h-4 w-4 shrink-0" />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Footer Links */}
        <div className="cp-sidebar-footer">
          <button
            className={`cp-nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
            style={{ padding: '8px 0' }}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </button>

          <a href="/login" onClick={handleLogout} className="cp-nav-item" style={{ padding: '8px 0', textDecoration: 'none' }}>
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN VIEWPORT                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="cp-main">
        {/* Topbar */}
        <header className="cp-topbar">
          <div className="cp-topbar-left">
            <button
              className="cp-hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="cp-topbar-title">Client Portal</span>
          </div>

          <div className="cp-topbar-actions">
            <div className="notif-wrapper">
              <button
                className={`cp-icon-btn ${notifOpen ? 'active' : ''}`}
                aria-label="Notifications"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
                )}
              </button>

              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <div className="notif-title-wrap">
                      <span className="notif-title">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="notif-count-badge">{unreadCount} New</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button className="notif-mark-read-btn" onClick={markAllRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--cp-text-secondary)', fontSize: '0.8rem' }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`notif-item ${!item.is_read ? 'unread' : ''}`}
                          onClick={async () => {
                            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
                            await markNotificationAsRead(item.id);
                            setNotifOpen(false);
                            handleNavClick('current');
                          }}
                        >
                          <div className="notif-icon-circle">
                            <Bell className="h-3.5 w-3.5 text-blue-400" />
                          </div>
                          <div className="notif-content-wrap">
                            <span className="notif-item-title">{item.title}</span>
                            <span className="notif-item-time">{formatNotificationTime(item.created_at)}</span>
                          </div>
                          {!item.is_read && <span className="notif-unread-dot" />}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="notif-footer">
                    <button
                      className="notif-footer-btn"
                      onClick={() => {
                        setNotifOpen(false);
                        handleNavClick('current');
                      }}
                    >
                      View Current Production Status →
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div
              style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1E1E28', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => handleNavClick('profile')}
            >
              {clientProfile?.avatar_url ? (
                <img src={clientProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User className="h-4 w-4 text-white/80" />
              )}
            </div>
          </div>
        </header>

        {/* Content Body with Skeleton Shimmer Support */}
        <main className="cp-content">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="cp-skeleton" style={{ height: '32px', width: '220px' }} />
              <div className="cp-skeleton" style={{ height: '18px', width: '340px' }} />
              <div className="cp-home-grid" style={{ marginTop: '10px' }}>
                <div className="cp-skeleton" style={{ height: '220px' }} />
                <div className="cp-skeleton" style={{ height: '220px' }} />
              </div>
            </div>
          ) : (
            <>
              {/* ============================================================== */}
              {/* VIEW 1: HOME (Reference Image 1)                               */}
              {/* ============================================================== */}
              {activeNav === 'home' && (
                <>
                  <div className="cp-header-block">
                    <h1 className="cp-title-h1">
                      Welcome Back{clientProfile?.full_name ? `, ${clientProfile.full_name}` : ''}
                    </h1>
                    <p className="cp-subtext">Here is the latest overview of your video productions & orders.</p>
                  </div>

                  {/* Supabase Orders Section */}
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h2 style={{ fontSize: '1.12rem', fontWeight: 700, color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Film className="h-4 w-4 text-pink-400" />
                        <span>Your Orders</span>
                      </h2>
                      {!ordersLoading && orders.length > 0 && (
                        <span className="cp-badge-pill" style={{ fontSize: '0.75rem' }}>
                          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                        </span>
                      )}
                    </div>

                    {ordersLoading ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        <div className="cp-skeleton" style={{ height: '140px', borderRadius: '12px' }} />
                        <div className="cp-skeleton" style={{ height: '140px', borderRadius: '12px' }} />
                      </div>
                    ) : orders.length === 0 ? (
                      <div
                        className="cp-card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          padding: '48px 24px',
                          border: '1px dashed var(--cp-border)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '12px'
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '14px'
                          }}
                        >
                          <Film className="h-6 w-6 text-white/40" />
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                          Welcome! You have no orders yet.
                        </h3>
                        <p style={{ fontSize: '0.84rem', color: 'var(--cp-text-secondary)', maxWidth: '420px', lineHeight: 1.5, margin: 0 }}>
                          When a video production or editing brief is placed, your project milestones and status will appear here in real-time.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {orders.map((order) => (
                          <div
                            key={order.id}
                            className="cp-card"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              padding: '20px',
                              borderRadius: '12px',
                              border: '1px solid var(--cp-border)',
                              background: 'var(--cp-bg-card)',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleNavClick('current')}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
                                  {order.order_name || order.title || 'Untitled Project'}
                                </h3>
                                <span
                                  className="cp-badge-pill"
                                  style={{
                                    padding: '3px 10px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    borderRadius: '20px',
                                    background: getStatusBadgeBg(order.status),
                                    color: getStatusColor(order.status),
                                    border: `1px solid ${getStatusBorder(order.status)}`,
                                    flexShrink: 0
                                  }}
                                >
                                  {STATUS_MAP[order.status]?.label || order.status}
                                </span>
                              </div>

                              {order.brief && (
                                <p style={{ fontSize: '0.82rem', color: 'var(--cp-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                                  {order.brief.slice(0, 90)}{order.brief.length > 90 ? '...' : ''}
                                </p>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', marginTop: '8px' }}>
                              <span style={{ fontSize: '0.76rem', color: 'var(--cp-text-secondary)' }}>Delivery Deadline</span>
                              <span style={{ fontSize: '0.8rem', color: '#FFFFFF', fontWeight: 500 }}>
                                {order.client_deadline ? new Date(order.client_deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Flexible'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="cp-home-grid">
                    {/* 1. Current Project Status Card */}
                    <div className="cp-card" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('current')}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>Current Project Status</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--cp-text-secondary)', marginTop: '2px' }}>
                              {activeOrder ? activeOrder.order_name : 'No active project in editing'}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="cp-badge-pill">
                              {activeOrder?.client_deadline ? `Due ${new Date(activeOrder.client_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'In Queue'}
                            </span>
                            {activeOrder?.editor && (
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--cp-text-secondary)', marginTop: '4px' }}>
                                Editor: <strong style={{ color: '#FFFFFF' }}>{activeOrder.editor.full_name}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Milestone Stepper */}
                        <div className="cp-stepper-wrap" style={{ marginTop: '20px' }}>
                          <div className="cp-stepper-line" />
                          {[
                            { label: 'RECEIVED', step: 0 },
                            { label: 'ACCEPTED', step: 1 },
                            { label: 'IN EDITING', step: 2 },
                            { label: 'IN REVIEW', step: 3 },
                            { label: 'DELIVERED', step: 4 },
                          ].map((s, idx) => {
                            const isDone = activeStepIdx > s.step;
                            const isActive = activeStepIdx === s.step;
                            return (
                              <div key={idx} className={`cp-step-item ${isActive ? 'active' : ''}`}>
                                <div className={`cp-step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                                  {isDone ? <Check className="h-2.5 w-2.5" /> : isActive ? '◉' : ''}
                                </div>
                                <span className="cp-step-name">{s.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 2. Projects Done With Us Card */}
                    <div className="cp-card" style={{ alignItems: 'center', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleNavClick('history')}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', alignSelf: 'flex-start' }}>
                        Projects Done With Us
                      </h3>

                      <div className="cp-ring-container">
                        <div className="cp-ring-outer">
                          <span className="cp-ring-inner-num">{completedOrders.length}</span>
                        </div>
                      </div>

                      <span className="cp-badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <span>🏆</span>
                        <span>{completedOrders.length >= 5 ? 'VIP Client' : 'Valued Client'}</span>
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 2: CURRENT PROJECT (Reference Image 2)                    */}
              {/* ============================================================== */}
              {activeNav === 'current' && (
                <>
                  {activeOrder ? (
                    <>
                      {/* Header Badges & Project Title */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span className="cp-badge-pill" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem', fontWeight: 700 }}>
                            {VIDEO_TYPE_MAP[activeOrder.video_type] || activeOrder.video_type}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--cp-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ color: '#FFFFFF' }}>•</span>
                            <span>{STATUS_MAP[activeOrder.status]?.label || activeOrder.status}</span>
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                          <div>
                            <h1 className="cp-project-serif-title">{activeOrder.order_name}</h1>
                            <p style={{ fontSize: '0.86rem', color: 'var(--cp-text-secondary)', maxWidth: '640px', lineHeight: 1.5 }}>
                              {activeOrder.brief || 'No description provided.'}
                            </p>
                          </div>

                          {activeOrder.additional_link && (
                            <button
                              className="cp-btn-outline"
                              onClick={() => window.open(activeOrder.additional_link, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                              <span>Preview Export</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Milestone Stepper Card */}
                      <div className="cp-card" style={{ padding: '24px 30px' }}>
                        <div className="cp-stepper-wrap" style={{ padding: '10px 0' }}>
                          <div className="cp-stepper-line" style={{ top: '22px' }} />
                          {[
                            { label: 'RECEIVED', sub: 'STAGE 1', step: 0 },
                            { label: 'ACCEPTED', sub: 'STAGE 2', step: 1 },
                            { label: 'IN EDITING', sub: 'STAGE 3', step: 2 },
                            { label: 'IN REVIEW', sub: 'STAGE 4', step: 3, icon: Eye },
                            { label: 'DELIVERED', sub: 'FINAL', step: 4, icon: Send },
                          ].map((s, idx) => {
                            const isDone = activeStepIdx > s.step;
                            const isActive = activeStepIdx === s.step;
                            return (
                              <div key={idx} className={`cp-step-item ${isActive ? 'active' : ''}`}>
                                <div className={`cp-step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                                  {isDone ? (
                                    <Check className="h-2.5 w-2.5" />
                                  ) : isActive ? (
                                    '◉'
                                  ) : s.icon ? (
                                    <s.icon className="h-2.5 w-2.5 text-white/40" />
                                  ) : (
                                    ''
                                  )}
                                </div>
                                <span className="cp-step-name">{s.label}</span>
                                <span style={{ fontSize: '0.58rem', color: 'var(--cp-text-tertiary)', letterSpacing: '0.05em' }}>{s.sub}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2-Column Split: Links & Editor Notes */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Left: Source Assets & Final Link */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {activeOrder.drive_link && (
                            <div className="cp-link-card" onClick={() => window.open(activeOrder.drive_link, '_blank')}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#181822', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Film className="h-4 w-4 text-white/80" />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Raw Footage Source</div>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)' }}>Google Drive Cloud Assets</div>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-white/40" />
                            </div>
                          )}

                          {activeOrder.additional_link && (
                            <div className="cp-link-card" onClick={() => window.open(activeOrder.additional_link, '_blank')}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#181822', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ExternalLink className="h-4 w-4 text-white/80" />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Final Master Export</div>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)' }}>Delivered Video Link</div>
                                </div>
                              </div>
                              <ExternalLink className="h-4 w-4 text-white/40" />
                            </div>
                          )}
                        </div>

                        {/* Right: Editor Notes & Revision Feedback */}
                        <div className="cp-card" style={{ gap: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StickyNote className="h-4 w-4 text-white/60" />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>Revisions & Project Notes</h3>
                          </div>

                          <div className="cp-notes-feed">
                            {editorNotes.length === 0 ? (
                              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--cp-text-secondary)', fontSize: '0.8rem' }}>
                                No revision notes yet. Use the form below to request a change.
                              </div>
                            ) : (
                              editorNotes.map((note) => (
                                <div key={note.id} className={`cp-note-bubble ${note.highlight ? 'highlight' : ''}`}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.06em' }}>{note.badge}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--cp-text-tertiary)' }}>{note.time}</span>
                                  </div>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--cp-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                    {note.text}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>

                          <form onSubmit={handleAddNote} className="cp-note-input-row" style={{ marginTop: 'auto' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#262633', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User className="h-3 w-3 text-white/80" />
                            </div>
                            <input
                              type="text"
                              placeholder="Request a revision or add notes..."
                              className="cp-note-input"
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                            />
                            <button type="submit" style={{ background: 'transparent', border: 'none', color: '#60A5FA', cursor: 'pointer' }}>
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="cp-card" style={{ padding: '60px 20px', textAlign: 'center', alignItems: 'center', gap: '14px' }}>
                      <Film className="h-10 w-10 text-white/30" />
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Active Project</h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--cp-text-secondary)', maxWidth: '420px' }}>
                        You currently have no project in active production. Contact the admin team to commission your next video.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 3: PROJECT HISTORY (Reference Image 4)                    */}
              {/* ============================================================== */}
              {activeNav === 'history' && (
                <>
                  <div className="cp-header-block">
                    <h1 className="cp-title-h1">Project History</h1>
                  </div>

                  {historyProjects.length === 0 ? (
                    <div className="cp-card" style={{ padding: '60px 20px', textAlign: 'center', alignItems: 'center', gap: '14px' }}>
                      <History className="h-10 w-10 text-white/30" />
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Delivered Projects Yet</h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--cp-text-secondary)', maxWidth: '420px' }}>
                        Your completed video deliverables will be archived here with direct download access.
                      </p>
                    </div>
                  ) : (
                    <div className="cp-history-split">
                      {/* Left: Previous Projects List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Previous Projects ({historyProjects.length})</h3>
                        </div>

                        {historyProjects.map((proj) => (
                          <div
                            key={proj.id}
                            className={`cp-history-item ${selectedProject?.id === proj.id ? 'selected' : ''}`}
                            onClick={() => setSelectedHistoryId(proj.id)}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>{proj.title}</span>
                                <span className="cp-badge-pill" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>{proj.type}</span>
                              </div>
                              <span style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)', marginTop: '4px', display: 'block' }}>
                                Delivered: {proj.deliveredDate}
                              </span>
                            </div>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          </div>
                        ))}
                      </div>

                      {/* Right: Selected Project Status & Notes */}
                      {selectedProject && (
                        <div className="cp-card" style={{ gap: '22px' }}>
                          <div>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>Delivery Status</h3>

                            {/* All 5 Steps Completed */}
                            <div className="cp-stepper-wrap" style={{ padding: '0 0 10px' }}>
                              <div className="cp-stepper-line" style={{ top: '10px' }} />
                              {['Received', 'Accepted', 'In Editing', 'In Review', 'Delivered'].map((label, idx) => (
                                <div key={idx} className="cp-step-item">
                                  <div className="cp-step-circle done">
                                    <Check className="h-2.5 w-2.5" />
                                  </div>
                                  <span className="cp-step-name" style={{ fontSize: '0.65rem' }}>{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 3 Metadata Boxes */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div style={{ background: '#101015', padding: '14px', borderRadius: '8px', border: '1px solid var(--cp-border)' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--cp-text-secondary)', display: 'block' }}>Project Type</span>
                              <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{selectedProject.type}</strong>
                            </div>

                            <div style={{ background: '#101015', padding: '14px', borderRadius: '8px', border: '1px solid var(--cp-border)' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--cp-text-secondary)', display: 'block' }}>Submission Date</span>
                              <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{selectedProject.submissionDate}</strong>
                            </div>

                            <div style={{ background: '#101015', padding: '14px', borderRadius: '8px', border: '1px solid var(--cp-border)' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--cp-text-secondary)', display: 'block' }}>Delivery Date</span>
                              <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{selectedProject.deliveredDate}</strong>
                            </div>
                          </div>

                          {/* Notes Box */}
                          <div>
                            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px' }}>Project Notes</h4>
                            <div style={{ padding: '16px', background: '#101015', borderRadius: '8px', border: '1px solid var(--cp-border)', fontSize: '0.82rem', color: 'var(--cp-text-secondary)', lineHeight: 1.55 }}>
                              {selectedProject.notes}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                            {selectedProject.downloadLink !== '#' && (
                              <button
                                className="cp-btn-solid"
                                onClick={() => window.open(selectedProject.downloadLink, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                                <span>Download Final Cut</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 4: PROFILE / ACCOUNT SETTINGS (Reference Image 3)         */}
              {/* ============================================================== */}
              {activeNav === 'profile' && (
                <>
                  <div className="cp-header-block">
                    <h1 className="cp-title-h1">Account Settings</h1>
                    <p className="cp-subtext">Manage your profile, preferences, and company details.</p>
                  </div>

                  <div className="cp-profile-card">
                    <div className="cp-avatar-wrap">
                      <img
                        src={clientProfile?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'}
                        alt={clientProfile?.full_name || 'Client'}
                        className="cp-avatar-img"
                      />
                      <span className="cp-status-dot-avatar" />
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                        {clientProfile?.full_name || currentUser?.email}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--cp-text-secondary)', marginTop: '2px' }}>
                        {clientProfile?.email || currentUser?.email}
                      </p>
                      {clientProfile?.company_name && (
                        <p style={{ fontSize: '0.78rem', color: '#60A5FA', marginTop: '2px', fontWeight: 600 }}>
                          Company: {clientProfile.company_name}
                        </p>
                      )}
                    </div>

                    <span className="cp-badge-pill" style={{ fontSize: '0.65rem', letterSpacing: '0.06em', fontWeight: 700 }}>
                      ● CLIENT ACCOUNT
                    </span>
                  </div>
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 5: SETTINGS                                               */}
              {/* ============================================================== */}
              {activeNav === 'settings' && (
                <>
                  <div className="cp-header-block">
                    <h1 className="cp-title-h1">Preferences & Notification Settings</h1>
                    <p className="cp-subtext">Configure automated notifications and cloud storage defaults.</p>
                  </div>

                  <div className="cp-card" style={{ maxWidth: '560px', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--cp-text-secondary)', fontWeight: 600 }}>Company / Brand</label>
                      <input
                        type="text"
                        defaultValue={clientProfile?.company_name || ''}
                        placeholder="Your Company Name"
                        style={{ background: '#15151C', border: '1px solid var(--cp-border)', borderRadius: '8px', padding: '10px 14px', color: '#FFFFFF', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--cp-text-secondary)', fontWeight: 600 }}>Default Storage Provider</label>
                      <select style={{ background: '#15151C', border: '1px solid var(--cp-border)', borderRadius: '8px', padding: '10px 14px', color: '#FFFFFF', outline: 'none' }}>
                        <option>Google Drive</option>
                        <option>Dropbox</option>
                      </select>
                    </div>

                    <button className="cp-btn-solid" style={{ alignSelf: 'flex-start' }} onClick={() => showToast('Client preferences saved.')}>
                      Save Settings
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
