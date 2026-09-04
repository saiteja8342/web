import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  X,
  Calendar,
  Clock,
  Star,
  Award,
  MessageSquare
} from 'lucide-react';
import CustomCursor from '../components/CustomCursor';
import { supabase } from '../supabaseClient';
import { getClientOrders, formatOrderCode, STATUS_MAP, VIDEO_TYPE_MAP } from '../lib/db/orders';
import { getProfile } from '../lib/db/profiles';
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendNotification, formatNotificationTime } from '../lib/db/notifications';
import { submitRevisionRequest, getOrderRevisions } from '../lib/db/revisions';
import { submitOrderRating, stripTestimonialTag, parseIsTestimonial } from '../lib/db/ratings';
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
  const [selectedActiveOrderId, setSelectedActiveOrderId] = useState(null);
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
  const [statusHistory, setStatusHistory] = useState([]);

  // Rating and Testimonial state for Project History
  const [ratingsMap, setRatingsMap] = useState({});
  const [ratingStars, setRatingStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isTestimonialConsent, setIsTestimonialConsent] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

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
      const [ordersRes, notifRes, profileRes] = await Promise.all([
        getClientOrders(userId),
        getUserNotifications(userId),
        getProfile(userId),
      ]);

      if (profileRes.data) {
        setClientProfile(profileRes.data);
      }

      if (!ordersRes.error && ordersRes.data) {
        setOrders(ordersRes.data);
        if (ordersRes.data.length > 0 && !selectedHistoryId) {
          const firstDelivered = ordersRes.data.find(o => o.status === 'delivered');
          if (firstDelivered) setSelectedHistoryId(firstDelivered.id);
        }
      }

      // Fetch client ratings with local storage fallback
      try {
        const localKey = `mne_ratings_${userId}`;
        const localRatings = JSON.parse(localStorage.getItem(localKey) || '{}');

        const { data: ratingsData } = await supabase
          .from('ratings')
          .select('*')
          .eq('client_id', userId);

        const map = { ...localRatings };
        if (ratingsData) {
          ratingsData.forEach((r) => {
            map[r.order_id] = {
              ...r,
              cleanFeedback: stripTestimonialTag(r.feedback_note),
              isTestimonial: parseIsTestimonial(r.feedback_note, r.is_testimonial),
            };
          });
        }
        setRatingsMap(map);
      } catch (rateErr) {
        console.warn('Ratings load error:', rateErr);
      }

      if (!notifRes.error && notifRes.data) {
        setNotifications(notifRes.data);
      }
    } catch (err) {
      console.error('Error fetching client data:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [selectedHistoryId]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        window.location.href = '/login';
        return;
      }

      // Verify approval status before granting dashboard access
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', session.user.id)
        .maybeSingle();

      const role = (profile?.role || '').toLowerCase().trim();
      const status = (profile?.status || '').toLowerCase().trim();

      if (role !== 'admin' && status === 'pending') {
        await supabase.auth.signOut();
        window.location.href = '/login?status=pending';
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

  // Instant Cross-Tab Sync & Live Polling
  useEffect(() => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;

    // Cross-tab broadcast listener (updates across tabs in <10ms)
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('mne-order-updates');
        bc.onmessage = () => {
          fetchClientData(userId);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    // Periodic sync every 4 seconds
    const pollInterval = setInterval(() => {
      fetchClientData(userId);
    }, 4000);

    return () => {
      if (bc) bc.close();
      clearInterval(pollInterval);
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

  // Reset rating form inputs ONLY when switching to a different project (NOT on polling intervals)
  const prevSelectedHistoryIdRef = useRef(null);
  useEffect(() => {
    if (selectedHistoryId && selectedHistoryId !== prevSelectedHistoryIdRef.current) {
      prevSelectedHistoryIdRef.current = selectedHistoryId;
      setRatingStars(5);
      setHoverStars(0);
      setFeedbackText('');
      setIsTestimonialConsent(false);
    }
  }, [selectedHistoryId]);

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    const targetProject = historyProjects.find(p => p.id === selectedHistoryId) || selectedProject || historyProjects[0];
    if (!targetProject || !currentUser) {
      showToast('Please select a project to review.');
      return;
    }
    if (!ratingStars || ratingStars < 1) {
      showToast('Please select a star rating (1 to 5).');
      return;
    }

    setIsSubmittingRating(true);
    try {
      const shouldBeTestimonial = ratingStars === 5 && Boolean(isTestimonialConsent) && feedbackText.trim().length > 0;
      const cleanFeedback = feedbackText.trim();

      // 1. Immediate optimistic update and persistent local backup
      const ratingRecord = {
        order_id: targetProject.id,
        client_id: currentUser.id,
        rating: ratingStars,
        feedback_note: shouldBeTestimonial ? `${cleanFeedback} [TESTIMONIAL:true]`.trim() : cleanFeedback,
        cleanFeedback,
        isTestimonial: shouldBeTestimonial,
        created_at: new Date().toISOString(),
      };

      setRatingsMap(prev => ({
        ...prev,
        [targetProject.id]: ratingRecord,
      }));

      try {
        const localKey = `mne_ratings_${currentUser.id}`;
        const existingLocal = JSON.parse(localStorage.getItem(localKey) || '{}');
        existingLocal[targetProject.id] = ratingRecord;
        localStorage.setItem(localKey, JSON.stringify(existingLocal));
      } catch {}

      // 2. Submit to Supabase
      const { error } = await submitOrderRating({
        orderId: targetProject.id,
        clientId: currentUser.id,
        editorId: targetProject.editorId || currentUser.id,
        rating: ratingStars,
        feedbackNote: cleanFeedback || null,
        isTestimonial: shouldBeTestimonial,
      });

      if (error) {
        console.warn('Supabase rating save note (saved locally):', error);
      }

      if (shouldBeTestimonial) {
        showToast('Thank you! Your feedback will be featured as our official testimonial.');
      } else {
        showToast('Thank you for rating your project experience!');
      }

      // Broadcast cross-tab update for admin panel
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('mne-order-updates');
          bc.postMessage({ type: 'RATING_SUBMITTED', orderId: targetProject.id });
          bc.close();
        }
      } catch {}
    } catch (err) {
      console.error('Rating submission error:', err);
      showToast('Feedback submitted successfully!');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Deliverable permission check: visible whenever admin grants access (even before delivery)
  const isOrderDeliverablePermitted = (order) => {
    if (!order) return false;

    // 1. Check explicit admin notes tag
    if (typeof order.admin_notes === 'string') {
      if (order.admin_notes.includes('[CLIENT_DELIVERABLE_VISIBLE:true]')) return true;
      if (order.admin_notes.includes('[CLIENT_DELIVERABLE_VISIBLE:false]')) return false;
    }

    // 2. Check client_link_visible column
    if (order.client_link_visible === true) return true;
    if (order.client_link_visible === false) return false;

    // 3. Fallback: by default before admin gives access, keep hidden
    return false;
  };

  // 10-Day Deliverable Link Expiration Logic
  const DELIVERY_EXPIRATION_DAYS = 10;

  const getDeliverableExpiration = (order, history = []) => {
    if (!order) {
      return { isExpired: false, daysRemaining: DELIVERY_EXPIRATION_DAYS, expiryDate: null, deliveryDate: null };
    }

    const isDelivered = order.status === 'delivered' || (order.deliveredDate && order.deliveredDate !== '—');
    if (!isDelivered) {
      return { isExpired: false, daysRemaining: DELIVERY_EXPIRATION_DAYS, expiryDate: null, deliveryDate: null };
    }

    let deliveryTimestamp = null;
    const historyMatch = (history || []).find(h => h.new_status === 'delivered');
    if (historyMatch && historyMatch.changed_at) {
      deliveryTimestamp = historyMatch.changed_at;
    } else if (order.updated_at) {
      deliveryTimestamp = order.updated_at;
    } else if (order.rawUpdatedAt) {
      deliveryTimestamp = order.rawUpdatedAt;
    } else if (order.created_at) {
      deliveryTimestamp = order.created_at;
    } else if (order.deliveredDate && order.deliveredDate !== '—') {
      deliveryTimestamp = order.deliveredDate;
    }

    if (!deliveryTimestamp) {
      return { isExpired: false, daysRemaining: DELIVERY_EXPIRATION_DAYS, expiryDate: null, deliveryDate: null };
    }

    const delivered = new Date(deliveryTimestamp);
    if (isNaN(delivered.getTime())) {
      return { isExpired: false, daysRemaining: DELIVERY_EXPIRATION_DAYS, expiryDate: null, deliveryDate: null };
    }

    const expiry = new Date(delivered.getTime() + DELIVERY_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    const isExpired = diffMs <= 0;

    return {
      isExpired,
      daysRemaining: Math.max(0, daysRemaining),
      deliveryDate: delivered.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      expiryDate: expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  };

  // Completed history projects and Running active projects
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const runningOrders = orders.filter(o => o.status !== 'delivered');
  const activeOrder = (selectedActiveOrderId && runningOrders.find(o => o.id === selectedActiveOrderId)) || runningOrders[0] || null;

  // Fetch status history and revisions whenever the selected activeOrder changes
  useEffect(() => {
    if (!activeOrder?.id) {
      setStatusHistory([]);
      setEditorNotes([]);
      return;
    }

    let isMounted = true;

    async function loadActiveOrderDetails() {
      try {
        const { data: hist } = await supabase
          .from('order_status_history')
          .select('*')
          .eq('order_id', activeOrder.id)
          .order('changed_at', { ascending: true });
        if (isMounted && hist) setStatusHistory(hist);
      } catch (hErr) {
        console.warn('[Client] Could not fetch status history:', hErr);
      }

      try {
        const { data: revs } = await getOrderRevisions(activeOrder.id);
        if (isMounted && revs) {
          setEditorNotes(revs.map(r => ({
            id: r.id,
            badge: r.status === 'completed' ? 'RESOLVED' : 'REVISION REQUEST',
            time: formatNotificationTime(r.created_at),
            highlight: r.status === 'pending',
            text: r.request_note,
          })));
        }
      } catch (rErr) {
        console.warn('[Client] Could not fetch revisions:', rErr);
      }
    }

    loadActiveOrderDetails();

    return () => {
      isMounted = false;
    };
  }, [activeOrder?.id]);

  const historyProjects = completedOrders.length > 0 ? completedOrders.map(o => {
    const exp = getDeliverableExpiration(o, statusHistory);
    return {
      id: o.id,
      orderCode: formatOrderCode(o),
      title: o.order_name,
      type: VIDEO_TYPE_MAP[o.video_type] || o.video_type,
      editorId: o.editor_id,
      clientId: o.client_id,
      deliveredDate: o.updated_at ? new Date(o.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
      submissionDate: o.created_at ? new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
      rawUpdatedAt: o.updated_at,
      notes: o.admin_notes ? o.admin_notes.replace(/\[CLIENT_DELIVERABLE_VISIBLE:(true|false)\]/g, '').trim() : (o.brief || 'Final cut delivered according to specifications.'),
      downloadLink: isOrderDeliverablePermitted(o) && !exp.isExpired ? (o.additional_link || o.drive_link || o.dropbox_link || '#') : '#',
      isDownloadPermitted: isOrderDeliverablePermitted(o) && !exp.isExpired,
      isExpired: exp.isExpired,
      daysRemaining: exp.daysRemaining,
      expiryDate: exp.expiryDate,
    };
  }) : [];

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
  const isDeliverablePermitted = isOrderDeliverablePermitted(activeOrder);
  const activeOrderExp = getDeliverableExpiration(activeOrder, statusHistory);

  const formatMilestoneDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const getExpectedDeliveryDate = (order) => {
    if (!order) return 'Pending';
    if (order.client_deadline) return formatMilestoneDate(order.client_deadline);
    if (order.editor_deadline) return formatMilestoneDate(order.editor_deadline);
    if (order.created_at) {
      try {
        const created = new Date(order.created_at);
        if (!isNaN(created.getTime())) {
          // Default turnaround is 3 days from creation
          const exp = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
          return formatMilestoneDate(exp);
        }
      } catch {}
    }
    return 'Pending';
  };

  const getStageDate = (statusKey, stepIndex) => {
    if (!activeOrder) return 'Pending';

    // If delivered stage is not yet completed, show expected delivery date
    if (statusKey === 'delivered' && activeStepIdx < 4) {
      const expDate = getExpectedDeliveryDate(activeOrder);
      return `Exp: ${expDate}`;
    }

    // If order hasn't reached this step yet
    if (activeStepIdx < stepIndex) {
      return 'Pending';
    }

    // Step 0: Received is always when order was created
    if (stepIndex === 0) {
      return formatMilestoneDate(activeOrder.created_at) || 'Received';
    }

    // Check status history for this specific status
    if (statusHistory && statusHistory.length > 0) {
      const entry = statusHistory.find(h => h.new_status === statusKey);
      if (entry && entry.changed_at) {
        return formatMilestoneDate(entry.changed_at);
      }
    }

    // If active step, use activeOrder.updated_at
    if (activeStepIdx === stepIndex && activeOrder.updated_at) {
      return formatMilestoneDate(activeOrder.updated_at);
    }

    // If already completed in past, fallback to updated_at or created_at
    if (activeStepIdx > stepIndex) {
      return formatMilestoneDate(activeOrder.updated_at || activeOrder.created_at);
    }

    return 'Pending';
  };

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
          <div
            className="cp-brand-header"
            style={{ cursor: 'pointer' }}
            onClick={() => handleNavClick('home')}
          >
            <img
              src="/image/mne_logo.png"
              alt="MotionNodeEdits"
              className="cp-brand-logo-img"
            />
            <div>
              <div className="cp-brand-title">MotionNodeEdits</div>
              <div className="cp-brand-sub">Client Portal</div>
            </div>
          </div>

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
              <span>{runningOrders.length > 1 ? `Current Projects (${runningOrders.length})` : 'Current Project'}</span>
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
                            onClick={() => {
                              if (order.status === 'delivered') {
                                setSelectedHistoryId(order.id);
                                handleNavClick('history');
                              } else {
                                handleNavClick('current');
                              }
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                                <div>
                                  <span style={{ fontSize: '0.68rem', color: '#93C5FD', fontFamily: 'monospace', letterSpacing: '0.03em', display: 'block', marginBottom: '4px' }}>
                                    {formatOrderCode(order)}
                                  </span>
                                  <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
                                    {order.order_name || order.title || 'Untitled Project'}
                                  </h3>
                                </div>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>Current Project Status</h3>
                              {runningOrders.length > 1 && (
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                  {runningOrders.length} Running
                                </span>
                              )}
                            </div>
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

                        {/* Project Switcher Pills when multiple projects are running */}
                        {runningOrders.length > 1 && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                            {runningOrders.map((ord) => {
                              const isSelected = ord.id === activeOrder?.id;
                              const ordCode = formatOrderCode(ord);
                              return (
                                <button
                                  key={ord.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedActiveOrderId(ord.id);
                                  }}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    background: isSelected ? '#3B82F6' : 'rgba(255, 255, 255, 0.05)',
                                    color: isSelected ? '#FFFFFF' : 'var(--cp-text-secondary)',
                                    border: isSelected ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.1)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <span>{ord.order_name}</span>
                                  <span style={{ opacity: 0.75, fontFamily: 'monospace', fontSize: '0.65rem' }}>({ordCode})</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Milestone Stepper */}
                        <div className="cp-stepper-wrap" style={{ marginTop: '20px' }}>
                          <div className="cp-stepper-line" />
                          {[
                            { key: 'received', label: 'RECEIVED', step: 0 },
                            { key: 'accepted', label: 'ACCEPTED', step: 1 },
                            { key: 'in_editing', label: 'IN EDITING', step: 2 },
                            { key: 'in_review', label: 'IN REVIEW', step: 3 },
                            { key: 'delivered', label: 'DELIVERED', step: 4 },
                          ].map((s, idx) => {
                            const isDone = activeStepIdx > s.step;
                            const isActive = activeStepIdx === s.step;
                            const stageDate = getStageDate(s.key, s.step);
                            return (
                              <div key={idx} className={`cp-step-item ${isActive ? 'active' : ''}`}>
                                <div className={`cp-step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                                  {isDone ? <Check className="h-2.5 w-2.5" /> : isActive ? '◉' : ''}
                                </div>
                                <span className="cp-step-name">{s.label}</span>
                                <span style={{ fontSize: '0.62rem', color: isDone || isActive ? '#9CA3AF' : 'var(--cp-text-tertiary)', marginTop: '2px' }}>
                                  {stageDate}
                                </span>
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
              {/* VIEW 2: CURRENT PROJECT / ACTIVE PIPELINE                      */}
              {/* ============================================================== */}
              {activeNav === 'current' && (
                <>
                  {/* Top Bar when multiple orders are running */}
                  {runningOrders.length > 1 && (
                    <div style={{
                      marginBottom: '24px',
                      padding: '16px 20px',
                      background: 'linear-gradient(180deg, rgba(22, 22, 28, 0.9) 0%, rgba(15, 15, 20, 0.98) 100%)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Film className="h-4 w-4 text-blue-400" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FFFFFF' }}>
                            Your Active Projects in Production ({runningOrders.length})
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--cp-text-secondary)' }}>
                          Click a project below to switch its milestone view & files
                        </span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '12px'
                      }}>
                        {runningOrders.map((ord) => {
                          const isSelected = ord.id === activeOrder?.id;
                          const sm = STATUS_MAP[ord.status] || STATUS_MAP.received;
                          const ordCode = formatOrderCode(ord);

                          return (
                            <div
                              key={ord.id}
                              onClick={() => setSelectedActiveOrderId(ord.id)}
                              style={{
                                padding: '12px 14px',
                                borderRadius: '8px',
                                background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                border: isSelected ? '1.5px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.07)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                boxShadow: isSelected ? '0 0 16px rgba(59, 130, 246, 0.2)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isSelected ? '#93C5FD' : 'var(--cp-text-secondary)', fontFamily: 'monospace' }}>
                                  {ordCode}
                                </span>
                                <span className="cp-badge-pill" style={{
                                  fontSize: '0.62rem',
                                  padding: '2px 8px',
                                  background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                                  color: isSelected ? '#93C5FD' : '#9CA3AF'
                                }}>
                                  {sm.label}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ord.order_name}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--cp-text-secondary)', marginTop: '2px' }}>
                                <span>{VIDEO_TYPE_MAP[ord.video_type] || ord.video_type}</span>
                                <span style={{ color: isSelected ? '#FCD34D' : 'inherit', fontWeight: isSelected ? 600 : 400 }}>
                                  {ord.client_deadline ? `Due ${new Date(ord.client_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'In Queue'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeOrder ? (
                    <>
                      {/* Header Badges & Project Title */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#93C5FD', fontFamily: 'monospace', letterSpacing: '0.04em', background: 'rgba(59, 130, 246, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                            {formatOrderCode(activeOrder)}
                          </span>
                          <span className="cp-badge-pill" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem', fontWeight: 700 }}>
                            {VIDEO_TYPE_MAP[activeOrder.video_type] || activeOrder.video_type}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--cp-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ color: '#FFFFFF' }}>•</span>
                            <span>{STATUS_MAP[activeOrder.status]?.label || activeOrder.status}</span>
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#FCD34D', display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '6px', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.25)', fontWeight: 600 }}>
                            <Calendar className="h-3 w-3" />
                            <span>Expected Delivery: {getExpectedDeliveryDate(activeOrder)}</span>
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                          <div>
                            <h1 className="cp-project-serif-title">{activeOrder.order_name}</h1>
                            <p style={{ fontSize: '0.86rem', color: 'var(--cp-text-secondary)', maxWidth: '640px', lineHeight: 1.5 }}>
                              {activeOrder.brief || 'No description provided.'}
                            </p>
                          </div>

                          {isDeliverablePermitted && activeOrder.additional_link && (
                            activeOrderExp.isExpired ? (
                              <span style={{ fontSize: '0.74rem', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <Clock className="h-3.5 w-3.5" />
                                <span>Link Expired</span>
                              </span>
                            ) : (
                              <button
                                className="cp-btn-outline"
                                onClick={() => window.open(activeOrder.additional_link, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                                <span>Preview Export ({activeOrderExp.daysRemaining}d left)</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Milestone Stepper Card */}
                      <div className="cp-card" style={{ padding: '24px 30px' }}>
                        <div className="cp-stepper-wrap" style={{ padding: '10px 0' }}>
                          <div className="cp-stepper-line" style={{ top: '22px' }} />
                          {[
                            { key: 'received', label: 'RECEIVED', step: 0 },
                            { key: 'accepted', label: 'ACCEPTED', step: 1 },
                            { key: 'in_editing', label: 'IN EDITING', step: 2 },
                            { key: 'in_review', label: 'IN REVIEW', step: 3, icon: Eye },
                            { key: 'delivered', label: 'DELIVERED', step: 4, icon: Send },
                          ].map((s, idx) => {
                            const isDone = activeStepIdx > s.step;
                            const isActive = activeStepIdx === s.step;
                            const stageDate = getStageDate(s.key, s.step);
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
                                <span style={{
                                  fontSize: '0.65rem',
                                  color: isDone || isActive ? '#9CA3AF' : 'var(--cp-text-tertiary)',
                                  letterSpacing: '0.02em',
                                  marginTop: '3px',
                                  fontWeight: isDone || isActive ? 500 : 400
                                }}>
                                  {stageDate}
                                </span>
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

                          {isDeliverablePermitted && activeOrder.additional_link ? (
                            activeOrderExp.isExpired ? (
                              <div style={{ padding: '16px 18px', background: '#111118', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Clock className="h-4 w-4 text-red-400" />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>Deliverable Link Expired</div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)', marginTop: '2px' }}>
                                      This link expired after 10 days of delivery ({activeOrderExp.expiryDate}). Contact admin if you need files re-uploaded.
                                    </div>
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600 }}>
                                  EXPIRED (10 DAYS)
                                </span>
                              </div>
                            ) : (
                              <div className="cp-link-card" onClick={() => window.open(activeOrder.additional_link, '_blank')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#181822', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ExternalLink className="h-4 w-4 text-white/80" />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Final Master Export</div>
                                    <div style={{ fontSize: '0.74rem', color: '#4ADE80' }}>
                                      Delivered • {activeOrderExp.daysRemaining} days remaining (Expires {activeOrderExp.expiryDate})
                                    </div>
                                  </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-white/40" />
                              </div>
                            )
                          ) : activeOrder.additional_link ? (
                            <div style={{ padding: '14px 16px', background: '#111118', borderRadius: '10px', border: '1px dashed rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Clock className="h-4 w-4 text-amber-400" />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>Deliverable in Production Review</div>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)', marginTop: '2px' }}>
                                    Your access link will be available after final review
                                  </div>
                                </div>
                              </div>
                              <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 600 }}>
                                ADMIN REVIEW
                              </span>
                            </div>
                          ) : (
                            <div style={{ padding: '14px 16px', background: '#111118', borderRadius: '10px', border: '1px dashed var(--cp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#181824', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Calendar className="h-4 w-4 text-amber-400" />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>Final Deliverable</div>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)', marginTop: '2px' }}>
                                    Expected Delivery: <strong style={{ color: '#FCD34D' }}>{getExpectedDeliveryDate(activeOrder)}</strong>
                                  </div>
                                </div>
                              </div>
                              <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 600 }}>
                                IN PROGRESS
                              </span>
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
                    completedOrders.length > 0 ? (
                      <div className="cp-card" style={{ padding: '40px 24px', textAlign: 'center', alignItems: 'center', gap: '16px', background: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                            {completedOrders[0].order_name || 'Project'} Delivered!
                          </h2>
                          <p style={{ fontSize: '0.85rem', color: 'var(--cp-text-secondary)', maxWidth: '440px', margin: '6px auto 0 auto', lineHeight: 1.5 }}>
                            Your video project has been completed and delivered. You can access your deliverable links and leave your rating & feedback in Project History.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="cp-btn-solid"
                          style={{ padding: '10px 20px', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
                          onClick={() => {
                            setSelectedHistoryId(completedOrders[0].id);
                            handleNavClick('history');
                          }}
                        >
                          <Star className="h-4 w-4 text-amber-400" fill="#F59E0B" />
                          <span>Leave Feedback & View Deliverable →</span>
                        </button>
                      </div>
                    ) : (
                      <div className="cp-card" style={{ padding: '60px 20px', textAlign: 'center', alignItems: 'center', gap: '14px' }}>
                        <Film className="h-10 w-10 text-white/30" />
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Active Project</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--cp-text-secondary)', maxWidth: '420px' }}>
                          You currently have no project in active production. Contact the admin team to commission your next video.
                        </p>
                      </div>
                    )
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.68rem', color: '#60A5FA', fontFamily: 'monospace' }}>
                                  {proj.orderCode}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--cp-text-tertiary)' }}>•</span>
                                <span style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)' }}>
                                  Delivered: {proj.deliveredDate}
                                </span>
                              </div>
                            </div>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          </div>
                        ))}
                      </div>

                      {/* Right: Selected Project Status & Notes */}
                      {selectedProject && (
                        <div className="cp-card" style={{ gap: '22px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Delivery Status</h3>
                              <span style={{ fontSize: '0.74rem', color: '#93C5FD', fontFamily: 'monospace', fontWeight: 700, background: 'rgba(59, 130, 246, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                                {selectedProject.orderCode}
                              </span>
                            </div>

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

                          {/* 4 Metadata Boxes */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                            <div style={{ background: '#101015', padding: '14px', borderRadius: '8px', border: '1px solid var(--cp-border)' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--cp-text-secondary)', display: 'block' }}>Project Type</span>
                              <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{selectedProject.type}</strong>
                            </div>

                            <div style={{ background: '#101015', padding: '14px', borderRadius: '8px', border: '1px solid var(--cp-border)' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--cp-text-secondary)', display: 'block' }}>Project Created</span>
                              <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{selectedProject.submissionDate}</strong>
                            </div>

                            <div style={{ background: '#101015', padding: '14px', borderRadius: '8px', border: '1px solid var(--cp-border)' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--cp-text-secondary)', display: 'block' }}>Delivery Date</span>
                              <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{selectedProject.deliveredDate}</strong>
                            </div>

                            <div style={{ background: '#101015', padding: '14px', borderRadius: '8px', border: selectedProject.isExpired ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--cp-border)' }}>
                              <span style={{ fontSize: '0.68rem', color: selectedProject.isExpired ? '#EF4444' : 'var(--cp-text-secondary)', display: 'block' }}>Link Validity</span>
                              <strong style={{ fontSize: '0.82rem', color: selectedProject.isExpired ? '#EF4444' : '#4ADE80' }}>
                                {selectedProject.isExpired ? 'Expired (10 days)' : `${selectedProject.daysRemaining} days left`}
                              </strong>
                            </div>
                          </div>

                          {/* Notes Box */}
                          <div>
                            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px' }}>Project Notes</h4>
                            <div style={{ padding: '16px', background: '#101015', borderRadius: '8px', border: '1px solid var(--cp-border)', fontSize: '0.82rem', color: 'var(--cp-text-secondary)', lineHeight: 1.55 }}>
                              {selectedProject.notes}
                            </div>
                          </div>

                          {/* Client Rating & Feedback Section */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Star className="h-4 w-4 text-amber-400" fill="#F59E0B" />
                                <span>Order Rating & Feedback</span>
                              </h4>
                              {ratingsMap[selectedProject.id]?.isTestimonial && (
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#FCD34D', border: '1px solid rgba(234, 179, 8, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Award className="h-3 w-3" />
                                  <span>Featured Testimonial</span>
                                </span>
                              )}
                            </div>

                            {ratingsMap[selectedProject.id] ? (
                              /* Already Rated Card */
                              <div style={{ padding: '16px 18px', background: '#101015', borderRadius: '8px', border: '1px solid var(--cp-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className="h-4 w-4"
                                      fill={star <= ratingsMap[selectedProject.id].rating ? '#F59E0B' : 'transparent'}
                                      color={star <= ratingsMap[selectedProject.id].rating ? '#F59E0B' : '#4B5563'}
                                    />
                                  ))}
                                  <span style={{ fontSize: '0.78rem', color: '#9CA3AF', marginLeft: '6px', fontWeight: 600 }}>
                                    {ratingsMap[selectedProject.id].rating} / 5 Stars
                                  </span>
                                </div>

                                {ratingsMap[selectedProject.id].cleanFeedback ? (
                                  <p style={{ fontSize: '0.82rem', color: '#E5E7EB', margin: 0, lineHeight: 1.55, fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '6px' }}>
                                    "{ratingsMap[selectedProject.id].cleanFeedback}"
                                  </p>
                                ) : (
                                  <span style={{ fontSize: '0.74rem', color: 'var(--cp-text-tertiary)' }}>No written feedback provided.</span>
                                )}
                              </div>
                            ) : (
                              /* Unrated Form */
                              <form onSubmit={handleSubmitRating} style={{ padding: '16px', background: '#101015', borderRadius: '8px', border: '1px solid var(--cp-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--cp-text-secondary)', display: 'block', marginBottom: '6px' }}>
                                    Rate the final delivery quality:
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => {
                                      const activeStar = hoverStars ? star <= hoverStars : star <= ratingStars;
                                      return (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setRatingStars(star)}
                                          onMouseEnter={() => setHoverStars(star)}
                                          onMouseLeave={() => setHoverStars(0)}
                                          style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer' }}
                                        >
                                          <Star
                                            className="h-5 w-5 transition-colors"
                                            fill={activeStar ? '#F59E0B' : 'transparent'}
                                            color={activeStar ? '#F59E0B' : '#6B7280'}
                                          />
                                        </button>
                                      );
                                    })}
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FCD34D', marginLeft: '6px' }}>
                                      {ratingStars} / 5
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <textarea
                                    className="cp-input"
                                    rows={3}
                                    placeholder="Write your review or feedback about the editing quality, pacing, and communication..."
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    style={{ width: '100%', resize: 'vertical', fontSize: '0.8rem', padding: '10px 12px', background: '#181822', borderRadius: '6px', border: '1px solid var(--cp-border)', color: '#FFFFFF' }}
                                  />
                                </div>

                                {/* Testimonial Checkbox: STRICTLY VISIBLE ONLY when rating === 5 AND feedbackText is entered */}
                                {ratingStars === 5 && feedbackText.trim().length > 0 && (
                                  <div style={{
                                    padding: '12px 14px',
                                    background: 'rgba(234, 179, 8, 0.08)',
                                    border: '1px solid rgba(234, 179, 8, 0.3)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px'
                                  }}>
                                    <input
                                      type="checkbox"
                                      id="testimonialConsentCheckbox"
                                      checked={isTestimonialConsent}
                                      onChange={(e) => setIsTestimonialConsent(e.target.checked)}
                                      style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#F59E0B', width: '16px', height: '16px' }}
                                    />
                                    <label htmlFor="testimonialConsentCheckbox" style={{ fontSize: '0.78rem', color: '#E5E7EB', cursor: 'pointer', lineHeight: 1.45 }}>
                                      <strong style={{ color: '#FCD34D', display: 'block' }}>We can use this feedback as our testimonial</strong>
                                      I grant permission to feature this 5-star review as an official client testimonial on your studio showcase.
                                    </label>
                                  </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <button
                                    type="submit"
                                    disabled={isSubmittingRating}
                                    className="cp-btn-solid"
                                    style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    <Star className="h-3.5 w-3.5" fill="#000000" color="#000000" />
                                    <span>{isSubmittingRating ? 'Submitting...' : 'Submit Rating & Feedback'}</span>
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--cp-border)', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {selectedProject.isExpired ? (
                                <span style={{ fontSize: '0.74rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>Download link expired on {selectedProject.expiryDate} (10-day retention).</span>
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.74rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                                  <span>Link expires on {selectedProject.expiryDate} ({selectedProject.daysRemaining} days remaining)</span>
                                </span>
                              )}
                            </div>

                            {selectedProject.isExpired ? (
                              <button
                                className="cp-btn-outline"
                                disabled
                                style={{ opacity: 0.5, cursor: 'not-allowed', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Clock className="h-4 w-4" />
                                <span>Link Expired</span>
                              </button>
                            ) : selectedProject.downloadLink !== '#' ? (
                              <button
                                className="cp-btn-solid"
                                onClick={() => window.open(selectedProject.downloadLink, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                                <span>Download Final Cut</span>
                              </button>
                            ) : null}
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
