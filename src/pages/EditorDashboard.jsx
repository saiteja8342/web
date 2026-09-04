import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  Tv2,
  History,
  LogOut,
  User,
  Bell,
  Clock,
  Download,
  FileText,
  FolderArchive,
  Cloud,
  Box,
  Send,
  RefreshCw,
  Star,
  Check,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  ExternalLink,
  Clapperboard,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CheckCircle2
} from 'lucide-react';
import CustomCursor from '../components/CustomCursor';
import { supabase } from '../supabaseClient';
import { checkRouteAuth } from '../lib/middleware/authGuard';
import { getEditorActiveProject, getEditorProjectHistory, getEditorStats, updateOrderStatus, updateOrder, formatOrderCode, STATUS_MAP } from '../lib/db/orders';
import { getProfile } from '../lib/db/profiles';
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendNotification, formatNotificationTime } from '../lib/db/notifications';
import { getEditorRatingStats } from '../lib/db/ratings';
import { subscribeToOrders, subscribeToUserNotifications, unsubscribeChannel } from '../lib/supabase/realtime';
import './editor.css';

const isGoogleDriveLink = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com');
};

export default function EditorDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editorProfile, setEditorProfile] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const { authorized, profile } = await checkRouteAuth({
        requiredRole: 'editor',
        redirectOnFail: '/login',
      });

      if (authorized && profile) {
        setIsAuthenticated(true);
        setEditorProfile(profile);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const [activeNav, setActiveNav] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [projectStatus, setProjectStatus] = useState('Editing in Process');
  const [deliverableLink, setDeliverableLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  // ─── Live Data State ──────────────────────────────────────────────
  const [activeProject, setActiveProject] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [stats, setStats] = useState({ totalProjects: 0, onTime: 0, delayed: 0, rating: 0, ratingCount: 0 });
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!editorProfile) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await markAllNotificationsAsRead(editorProfile.id);
    showToast('All notifications marked as read.');
  };

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

  // ─── Data Fetching ────────────────────────────────────────────────
  const fetchEditorData = useCallback(async () => {
    let editorId = editorProfile?.id;
    if (!editorId) {
      const { data: { session } } = await supabase.auth.getSession();
      editorId = session?.user?.id;
    }
    if (!editorId) return;

    const [activeRes, historyRes, statsRes, ratingRes, notifRes] = await Promise.all([
      getEditorActiveProject(editorId),
      getEditorProjectHistory(editorId),
      getEditorStats(editorId),
      getEditorRatingStats(editorId),
      getUserNotifications(editorId),
    ]);

    if (!activeRes.error && activeRes.data) {
      setActiveProject(activeRes.data);
      setProjectStatus('Editing in Process');
    } else {
      setActiveProject(null);
    }

    if (!historyRes.error && historyRes.data) {
      setHistoryData(historyRes.data.map(item => {
        const isDelayed = item.editor_deadline && item.updated_at
          ? new Date(item.updated_at) > new Date(item.editor_deadline)
          : false;

        const ratingVal = item.ratings && item.ratings.length > 0
          ? item.ratings[0].rating
          : '5.0';

        return {
          id: item.id,
          code: formatOrderCode(item),
          name: item.order_name,
          client: item.client?.company_name || item.client?.full_name || 'Client',
          type: item.video_type || 'Video',
          assigned: item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
          submitted: item.updated_at ? new Date(item.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
          status: isDelayed ? 'Delayed' : 'Delivered On Time',
          isDelayed,
          rating: String(ratingVal),
        };
      }));
    }

    setStats({
      totalProjects: statsRes.totalProjects || 0,
      onTime: statsRes.onTime || 0,
      delayed: statsRes.delayed || 0,
      rating: ratingRes.average || 5.0,
      ratingCount: ratingRes.count || 0,
    });

    if (!notifRes.error && notifRes.data) {
      setNotifications(notifRes.data);
    }
  }, [editorProfile]);

  useEffect(() => {
    if (editorProfile) {
      fetchEditorData();
    }
  }, [editorProfile, fetchEditorData]);

  // ─── Realtime Subscriptions ───────────────────────────────────────
  useEffect(() => {
    if (!editorProfile) return;

    const ordersChannel = subscribeToOrders({
      filter: `editor_id=eq.${editorProfile.id}`,
      onInsert: () => fetchEditorData(),
      onUpdate: () => fetchEditorData(),
      onDelete: () => fetchEditorData(),
    });

    const notifChannel = subscribeToUserNotifications(
      editorProfile.id,
      (newNotif) => setNotifications(prev => [newNotif, ...prev]),
      (updatedNotif) => setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n))
    );

    return () => {
      unsubscribeChannel(ordersChannel);
      unsubscribeChannel(notifChannel);
    };
  }, [editorProfile, fetchEditorData]);

  const filteredHistory = historyData.filter(item => {
    if (historyFilter === 'ontime') return !item.isDelayed;
    if (historyFilter === 'delayed') return item.isDelayed;
    return true;
  });

  const handleSubmitDeliverables = async (e) => {
    if (e) e.preventDefault();
    const trimmedLink = deliverableLink ? deliverableLink.trim() : '';

    if (!trimmedLink) {
      showToast('Please paste a Google Drive link.');
      return;
    }

    if (!isGoogleDriveLink(trimmedLink)) {
      showToast('Only Google Drive links are accepted (must contain drive.google.com).');
      return;
    }

    if (!activeProject) {
      showToast('No active project to submit deliverables for.');
      return;
    }

    let { error } = await updateOrder(activeProject.id, {
      additional_link: trimmedLink,
      status: 'in_review',
    });

    // Fallback if additional_link column is not recognized
    if (error && error.message && error.message.toLowerCase().includes('column')) {
      const fallbackRes = await updateOrder(activeProject.id, {
        drive_link: trimmedLink,
        status: 'in_review',
      });
      error = fallbackRes.error;
    }

    if (error) {
      showToast('Error submitting: ' + (error.message || 'Check database permissions.'));
      return;
    }

    // Notify admin
    if (activeProject.admin_id) {
      try {
        await sendNotification(
          activeProject.admin_id,
          `Deliverables submitted: ${activeProject.order_name || activeProject.title}`,
          `${editorProfile?.full_name || 'Editor'} submitted deliverables for "${activeProject.order_name || activeProject.title}". Ready for review.`
        );
      } catch (notifErr) {
        console.warn('[Editor] Could not notify admin:', notifErr);
      }
    }

    showToast('Deliverables submitted successfully! Admin notified for review.');
    setDeliverableLink('');
    await fetchEditorData();
  };

  // Status lock: once updated to 'in_editing' or beyond, editor cannot undo the status
  const isStatusLocked = Boolean(
    activeProject &&
    (activeProject.status === 'in_editing' ||
     activeProject.status === 'in_review' ||
     activeProject.status === 'delivered')
  );

  const handleUpdateStatus = async () => {
    if (!activeProject) {
      showToast('No active project to update status for.');
      return;
    }

    if (isStatusLocked) {
      showToast('Status is already set to Editing in Process and cannot be undone.');
      return;
    }

    const { error } = await updateOrderStatus(
      activeProject.id,
      'in_editing',
      editorProfile?.id,
      activeProject.status,
      'Status updated by editor: Editing in Process'
    );

    if (error) {
      showToast('Error updating status: ' + (error.message || 'Permission denied'));
      return;
    }

    showToast('Project status updated to "Editing in Process". Status is now locked.');
    await fetchEditorData();
  };

  // Calculate days left for active project
  const calculateDaysLeft = () => {
    if (!activeProject?.editor_deadline) return '3 Days Left';
    try {
      const deadline = new Date(activeProject.editor_deadline);
      if (isNaN(deadline.getTime())) return '3 Days Left';
      const now = new Date();
      const diffMs = deadline - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'Overdue';
      if (diffDays === 0) return 'Due Today';
      return `${diffDays} Day${diffDays === 1 ? '' : 's'} Left`;
    } catch {
      return '3 Days Left';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="ed-layout">
      <CustomCursor />
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="ed-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="ed-toast">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR NAVIGATION                                                 */}
      {/* ------------------------------------------------------------------ */}
      <aside className={`ed-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          {/* Brand Header */}
          <div
            className="ed-brand-header"
            style={{ cursor: 'pointer' }}
            onClick={() => handleNavClick('home')}
          >
            <img
              src="/image/mne_logo.png"
              alt="MotionNodeEdits"
              className="ed-brand-logo-img"
            />
            <div>
              <div className="ed-brand-title">MotionNodeEdits</div>
              <div className="ed-brand-sub">Editor Workspace</div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="ed-nav-list">
            <button
              className={`ed-nav-item ${activeNav === 'home' ? 'active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Home</span>
            </button>

            <button
              className={`ed-nav-item ${activeNav === 'present' ? 'active' : ''}`}
              onClick={() => handleNavClick('present')}
            >
              <Tv2 className="h-4 w-4 shrink-0" />
              <span>Present Project</span>
            </button>

            <button
              className={`ed-nav-item ${activeNav === 'history' ? 'active' : ''}`}
              onClick={() => handleNavClick('history')}
            >
              <History className="h-4 w-4 shrink-0" />
              <span>Project History</span>
            </button>
          </nav>
        </div>

        {/* User / Sign Out Footer */}
        <div className="ed-sidebar-footer">
          <div className="ed-user-row" onClick={() => showToast(`Signed in as ${editorProfile?.full_name || 'Editor'} (${editorProfile?.editor_title || 'Editor'})`)}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#262633', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {editorProfile?.avatar_url ? (
                <img src={editorProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User className="h-3.5 w-3.5 text-white/80" />
              )}
            </div>
            <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{editorProfile?.full_name || 'Editor'}</span>
          </div>

          <a href="/login" onClick={handleLogout} className="ed-user-row">
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </a>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN VIEWPORT                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="ed-main">
        {/* Topbar */}
        <header className="ed-topbar">
          <div className="ed-topbar-left">
            <button
              className="ed-hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="ed-topbar-title">Dashboard</span>
          </div>

          <div className="ed-topbar-actions">
            <div className="notif-wrapper">
              <button
                className={`ed-icon-btn ${notifOpen ? 'active' : ''}`}
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
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ed-text-secondary)', fontSize: '0.8rem' }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`notif-item ${!item.is_read ? 'unread' : ''}`}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
                            try {
                              await markNotificationAsRead(item.id);
                            } catch (err) {
                              console.warn('Could not mark notification as read:', err);
                            }
                            setNotifOpen(false);
                            await fetchEditorData();
                            handleNavClick('present');
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
                      type="button"
                      className="notif-footer-btn"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setNotifOpen(false);
                        await fetchEditorData();
                        handleNavClick('present');
                      }}
                    >
                      View Active Project Brief →
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div
              style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1E1E28', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => showToast(`Editor Profile: ${editorProfile?.full_name || 'Editor'} (${editorProfile?.editor_title || 'Senior Video Editor'})`)}
            >
              {editorProfile?.avatar_url ? (
                <img src={editorProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User className="h-4 w-4 text-white/80" />
              )}
            </div>
          </div>
        </header>

        {/* Content Area with Shimmer Skeletons */}
        <main className="ed-content">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="ed-skeleton" style={{ height: '32px', width: '240px' }} />
              <div className="ed-skeleton" style={{ height: '18px', width: '360px' }} />
              <div className="ed-overview-grid" style={{ marginTop: '10px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="ed-skeleton" style={{ height: '200px' }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* ============================================================== */}
              {/* VIEW 1: EDITOR OVERVIEW (Reference Image 1)                    */}
              {/* ============================================================== */}
              {activeNav === 'home' && (
                <>
                  <div className="ed-header-block">
                    <h1 className="ed-title-h1">Editor Overview</h1>
                    <p className="ed-subtext">Welcome back, {editorProfile?.full_name || 'Editor'}. Here's your production status.</p>
                  </div>

                  <div className="ed-overview-grid">
                    {/* 1. Current Assignment Card */}
                    <div className="ed-metric-card">
                      <div>
                        <span className="ed-badge-category">CURRENT ASSIGNMENT</span>
                        <h3 className="ed-card-project-title">
                          {activeProject ? activeProject.order_name : 'No Active Project'}
                        </h3>
                        <p className="ed-card-project-sub">
                          {activeProject
                            ? `Client: ${activeProject.client?.company_name || activeProject.client?.full_name || 'Direct'} • ${activeProject.video_type}`
                            : 'Awaiting project assignment from admin'}
                        </p>
                        <div className="ed-days-left-val">
                          {activeProject ? calculateDaysLeft() : 'Standby'}
                        </div>
                        <div className="ed-progress-bar-bg">
                          <div className="ed-progress-bar-fill" style={{ width: activeProject ? '65%' : '0%' }} />
                        </div>
                      </div>

                      <button
                        className="ed-btn-goto"
                        onClick={() => handleNavClick('present')}
                      >
                        <span>Go to Project</span>
                        <span>→</span>
                      </button>
                    </div>

                    {/* 2. Total Projects Card */}
                    <div className="ed-metric-card">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className="ed-badge-category">TOTAL PROJECTS</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#FFFFFF', background: '#181822', padding: '3px 8px', borderRadius: '9999px', border: '1px solid var(--ed-border)' }}>
                            🏆 Top Editor
                          </span>
                        </div>

                        <div style={{ fontSize: '3.2rem', fontWeight: 800, color: '#FFFFFF', marginTop: '16px', letterSpacing: '-0.02em', lineHeight: 1 }}>
                          {stats.totalProjects}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--ed-text-secondary)', marginTop: '4px' }}>
                          Videos Edited
                        </p>
                      </div>

                      <div className="ed-ring-visual" />
                    </div>

                    {/* 3. Completion Rate Card */}
                    <div className="ed-metric-card">
                      <div>
                        <span className="ed-badge-category">COMPLETION RATE</span>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '20px' }}>
                          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF' }}>{stats.onTime} On Time</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ed-text-secondary)' }}>{stats.delayed} Delayed</span>
                        </div>

                        {(() => {
                          const total = stats.onTime + stats.delayed;
                          const successRate = total > 0 ? Math.round((stats.onTime / total) * 100) : 100;
                          const riskRate = 100 - successRate;
                          return (
                            <>
                              <div className="ed-split-bar">
                                <div className="ed-split-success" style={{ width: `${successRate}%` }} />
                                <div className="ed-split-risk" style={{ width: `${riskRate}%` }} />
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--ed-text-secondary)', marginTop: '8px' }}>
                                <span>{successRate}% Success</span>
                                <span>{riskRate}% Risk</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 4. Editor Rating Card */}
                    <div className="ed-metric-card">
                      <div>
                        <span className="ed-badge-category">EDITOR RATING</span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                          <Star className="h-6 w-6 text-white fill-white" />
                          <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                            {stats.rating} <span style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--ed-text-secondary)' }}>/ 5</span>
                          </span>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'var(--ed-text-secondary)', marginTop: '6px' }}>
                          Based on {stats.ratingCount || stats.totalProjects} projects
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--ed-text-secondary)' }}>
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>High Client Satisfaction</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 2: PRESENT PROJECT (Reference Image 2)                    */}
              {/* ============================================================== */}
              {activeNav === 'present' && (
                <>
                  {activeProject ? (
                    <>
                      {/* Urgent Deadline Alert Banner */}
                      <div className="ed-deadline-ribbon">
                        <div className="ed-deadline-left">
                          <Clock className="h-4 w-4" />
                          <span>Editor Deadline</span>
                        </div>
                        <div className="ed-deadline-badge">
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
                          <span>{calculateDaysLeft().toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Project Title Hero Card */}
                      <div className="ed-project-hero-card">
                        <div>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span className="ed-tag-pill" style={{ fontFamily: 'monospace', color: '#60A5FA' }}>{formatOrderCode(activeProject)}</span>
                            <span className="ed-tag-pill">EDIT</span>
                            <span className="ed-tag-pill">{activeProject.client?.company_name || activeProject.client?.full_name || 'Client'}</span>
                          </div>
                          <h1 className="ed-project-h1">{activeProject.order_name}</h1>
                          <div className="ed-project-assigned">
                            <span>📅 Assigned: {activeProject.created_at ? new Date(activeProject.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
                          </div>
                        </div>

                        {activeProject.drive_link && (
                          <button
                            className="ed-btn-outline"
                            onClick={() => window.open(activeProject.drive_link, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                            <span>Download Assets</span>
                          </button>
                        )}
                      </div>

                      {/* 2-Column Split: Brief & Assets */}
                      <div className="ed-detail-grid-2">
                        {/* Left: Client Brief */}
                        <div className="ed-card">
                          <div className="ed-card-header-line">
                            <div className="ed-card-title-main">
                              <FileText className="h-4 w-4" />
                              <span>Creative Brief</span>
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <span className="ed-hash-tag">#{activeProject.video_type}</span>
                            </div>
                          </div>

                          <p className="ed-brief-paragraph">
                            {activeProject.brief || 'No detailed brief provided for this project.'}
                          </p>

                          {(() => {
                            const cleanNotes = (activeProject.admin_notes || '')
                              .replace(/\s*\[ORDER_CODE:[^\]]+\]/g, '')
                              .replace(/\s*\[CLIENT_DELIVERABLE_VISIBLE:[^\]]+\]/g, '')
                              .trim();

                            return cleanNotes ? (
                              <div style={{ marginTop: '12px', padding: '12px', background: '#121218', borderRadius: '8px', border: '1px solid var(--ed-border)' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F59E0B', display: 'block', marginBottom: '4px' }}>
                                  Admin Instructions:
                                </span>
                                <p style={{ fontSize: '0.8rem', color: 'var(--ed-text-secondary)', margin: 0 }}>
                                  {cleanNotes}
                                </p>
                              </div>
                            ) : null;
                          })()}
                        </div>

                        {/* Right: Client Assets */}
                        <div className="ed-card">
                          <div className="ed-card-title-main">
                            <FolderArchive className="h-4 w-4" />
                            <span>Project Assets & Cloud Storage</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {activeProject.drive_link ? (
                              <div className="ed-asset-box">
                                <div className="ed-asset-top">
                                  <div className="ed-asset-icon-wrap">
                                    <Cloud className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="ed-asset-name">Raw Footage Link</div>
                                    <div className="ed-asset-meta">Google Drive Storage</div>
                                  </div>
                                </div>

                                <button
                                  className="ed-btn-open-link"
                                  onClick={() => window.open(activeProject.drive_link, '_blank')}
                                >
                                  <span>Open Link</span>
                                  <span>→</span>
                                </button>
                              </div>
                            ) : (
                              <div style={{ padding: '14px', background: '#121218', borderRadius: '8px', border: '1px dashed var(--ed-border)', textAlign: 'center', color: 'var(--ed-text-secondary)', fontSize: '0.8rem' }}>
                                No raw footage link provided
                              </div>
                            )}

                            {activeProject.dropbox_link && (
                              <div className="ed-asset-box">
                                <div className="ed-asset-top">
                                  <div className="ed-asset-icon-wrap">
                                    <Box className="h-5 w-5 text-indigo-400" />
                                  </div>
                                  <div>
                                    <div className="ed-asset-name">Brand Assets & Audio</div>
                                    <div className="ed-asset-meta">Dropbox Storage</div>
                                  </div>
                                </div>

                                <button
                                  className="ed-btn-open-link"
                                  onClick={() => window.open(activeProject.dropbox_link, '_blank')}
                                >
                                  <span>Open Link</span>
                                  <span>→</span>
                                </button>
                              </div>
                            )}

                            {activeProject.additional_link && (
                              <div className="ed-asset-box">
                                <div className="ed-asset-top">
                                  <div className="ed-asset-icon-wrap">
                                    <ExternalLink className="h-5 w-5 text-emerald-400" />
                                  </div>
                                  <div>
                                    <div className="ed-asset-name">Latest Submitted Deliverable</div>
                                    <div className="ed-asset-meta">Cloud Storage Link</div>
                                  </div>
                                </div>

                                <button
                                  className="ed-btn-open-link"
                                  onClick={() => window.open(activeProject.additional_link, '_blank')}
                                >
                                  <span>Open Link</span>
                                  <span>→</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Submit Final Deliverables Box */}
                      <div className="ed-submit-box">
                        <div className="ed-card-title-main">
                          <Cloud className="h-4 w-4 text-blue-400" />
                          <span>Submit Deliverables for Review</span>
                        </div>

                        <form onSubmit={handleSubmitDeliverables} className="ed-submit-input-row">
                          <input
                            type="text"
                            placeholder="Paste Google Drive link (https://drive.google.com/...)"
                            className="ed-input-deliverable"
                            value={deliverableLink}
                            onChange={(e) => setDeliverableLink(e.target.value)}
                          />
                          <button type="submit" className="ed-btn-submit-main">
                            <Send className="h-4 w-4" />
                            <span>Submit Project</span>
                          </button>
                        </form>

                        <p style={{ fontSize: '0.75rem', color: 'var(--ed-text-tertiary)' }}>
                          Only Google Drive links are accepted (e.g. drive.google.com/...). Ensure permissions are set to &quot;Anyone with the link&quot;.
                        </p>
                      </div>

                      {/* Bottom Status Update Bar */}
                      <div className="ed-status-bar">
                        <div className="ed-status-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--ed-text-secondary)', fontWeight: 600 }}>Current Status:</span>
                          <select
                            className="ed-status-select"
                            value="Editing in Process"
                            onChange={(e) => setProjectStatus(e.target.value)}
                            disabled={isStatusLocked}
                            style={isStatusLocked ? { opacity: 0.8, cursor: 'not-allowed', background: '#161622', borderColor: 'rgba(255, 255, 255, 0.08)' } : {}}
                          >
                            <option value="Editing in Process">Editing in Process</option>
                          </select>

                          {isStatusLocked && (
                            <span style={{ fontSize: '0.75rem', color: '#4ADE80', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <Check className="h-3.5 w-3.5" />
                              <span>Status Locked (Cannot Undo)</span>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="ed-btn-update-status"
                          onClick={handleUpdateStatus}
                          disabled={isStatusLocked}
                          style={isStatusLocked ? { opacity: 0.5, cursor: 'not-allowed', background: '#22222E', borderColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--ed-text-secondary)' } : {}}
                        >
                          {isStatusLocked ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-400" />
                              <span>Updated (Locked)</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              <span>Update Status</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="ed-card" style={{ padding: '60px 20px', textAlign: 'center', alignItems: 'center', gap: '14px' }}>
                      <Tv2 className="h-10 w-10 text-white/30" />
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Active Project</h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--ed-text-secondary)', maxWidth: '420px' }}>
                        You currently have no project in active editing. When the admin assigns you a new editing task, it will appear here instantly.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 3: PROJECT HISTORY (Reference Image 3)                    */}
              {/* ============================================================== */}
              {activeNav === 'history' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <h1 className="ed-title-h1">Project History</h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', background: '#14141B', padding: '3px', borderRadius: '8px', border: '1px solid var(--ed-border)' }}>
                        <button
                          onClick={() => setHistoryFilter('all')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            background: historyFilter === 'all' ? '#262633' : 'transparent',
                            color: historyFilter === 'all' ? '#FFFFFF' : 'var(--ed-text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setHistoryFilter('ontime')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            background: historyFilter === 'ontime' ? '#262633' : 'transparent',
                            color: historyFilter === 'ontime' ? '#FFFFFF' : 'var(--ed-text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          On Time
                        </button>
                        <button
                          onClick={() => setHistoryFilter('delayed')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            background: historyFilter === 'delayed' ? '#262633' : 'transparent',
                            color: historyFilter === 'delayed' ? '#FFFFFF' : 'var(--ed-text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Delayed
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="ed-card" style={{ padding: '0', overflow: 'hidden' }}>
                    {filteredHistory.length === 0 ? (
                      <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ed-text-secondary)' }}>
                        <History className="h-8 w-8 text-white/30" style={{ margin: '0 auto 12px' }} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>No Completed Projects Yet</h3>
                        <p style={{ fontSize: '0.8rem', margin: 0 }}>Delivered videos will be logged in this ledger automatically.</p>
                      </div>
                    ) : (
                      <>
                        <table className="ed-history-table">
                          <thead>
                            <tr>
                              <th>PROJECT NAME</th>
                              <th>VIDEO TYPE</th>
                              <th>DATE ASSIGNED</th>
                              <th>DATE SUBMITTED</th>
                              <th>STATUS</th>
                              <th>RATING</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredHistory.map((row) => (
                              <tr key={row.id}>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontWeight: 700 }}>{row.name}</span>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.68rem', color: '#60A5FA', fontFamily: 'monospace' }}>{row.code}</span>
                                      <span style={{ fontSize: '0.68rem', color: 'var(--ed-text-tertiary)' }}>•</span>
                                      <span style={{ fontSize: '0.72rem', color: 'var(--ed-text-secondary)' }}>{row.client}</span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ color: 'var(--ed-text-secondary)' }}>{row.type}</td>
                                <td style={{ color: 'var(--ed-text-secondary)' }}>{row.assigned}</td>
                                <td style={{ color: 'var(--ed-text-secondary)' }}>{row.submitted}</td>
                                <td>
                                  <span className={row.isDelayed ? 'ed-status-pill-amber' : 'ed-status-pill-green'}>
                                    <span style={{ color: row.isDelayed ? '#F59E0B' : '#FFFFFF' }}>•</span>
                                    <span>{row.status}</span>
                                  </span>
                                </td>
                                <td>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#EAB308' }}>
                                    <span>★</span>
                                    <span>{row.rating}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="ed-pagination-bar">
                          <span>Showing {filteredHistory.length} project{filteredHistory.length === 1 ? '' : 's'}</span>
                        </div>
                      </>
                    )}
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
