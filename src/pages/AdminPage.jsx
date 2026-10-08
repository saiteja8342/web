import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  Inbox,
  UserCheck,
  PlusSquare,
  Users,
  Handshake,
  Settings,
  LogOut,
  Search,
  Bell,
  TrendingUp,
  CheckSquare,
  AlertTriangle,
  Send,
  Calendar,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  FileText,
  Paperclip,
  Check,
  Plus,
  Save,
  MessageSquare,
  Mail,
  Clapperboard,
  Menu,
  X,
  CheckCircle2,
  Sparkles,
  Cloud,
  ExternalLink,
  Clock,
  Lock,
  Eye,
  EyeOff,
  Archive,
  Star,
  Award,
  Quote,
  ShieldCheck,
  Phone,
  Trash2,
  RefreshCw,
  Ban,
  Globe,
  Copy,
  MessageSquareQuote
} from 'lucide-react';
import CustomCursor from '../components/CustomCursor';
import AdminOverview from '../components/Admin/AdminOverview';
import AdminOrdersTable from '../components/Admin/AdminOrdersTable';
import AdminClientManager from '../components/Admin/AdminClientManager';
import AdminEditorManager from '../components/Admin/AdminEditorManager';
import AdminSettings from '../components/Admin/AdminSettings';

import { supabase } from '../supabaseClient';
import { checkRouteAuth } from '../lib/middleware/authGuard';
import { getAdminAllOrders, getAdminOrderCounts, createOrder, updateOrder, updateOrderStatus, assignEditorToOrder, getEditorActiveOrderCounts, generateOrderCode, formatOrderCode, stripOrderCodeTag, STATUS_MAP, VIDEO_TYPE_MAP, UI_TO_DB_STATUS, UI_TO_VIDEO_TYPE } from '../lib/db/orders';
import { getApprovedEditors, getAllClientsForAdmin, getPendingProfiles, updateProfileStatus, blockClient, unblockClient, deleteClient } from '../lib/db/profiles';
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendNotification, formatNotificationTime } from '../lib/db/notifications';
import { getEditorRatingStats, getAllDeliveredOrdersRatingsMap } from '../lib/db/ratings';
import { getContactRequests, updateContactRequestStatus, updateContactRequestNotes, deleteContactRequest, PROJECT_TYPE_LABELS, STATUS_CONFIG as CONTACT_STATUS_CONFIG } from '../lib/db/contactRequests';
import { getLinkFeedbacks, deleteLinkFeedback } from '../lib/db/linkFeedback';
import { subscribeToOrders, subscribeToProfiles, subscribeToUserNotifications, subscribeToContactRequests, unsubscribeChannel } from '../lib/supabase/realtime';
import './admin.css';

// ─── Helpers ────────────────────────────────────────────────────────
function safeHref(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '#';
}

function safeIsoDate(val) {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'No deadline' || trimmed === '—') return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function stripVisibilityTag(notes) {
  if (!notes || typeof notes !== 'string') return '';
  return notes.replace(/\[CLIENT_DELIVERABLE_VISIBLE:(true|false)\]/g, '').trim();
}

function parseNotesVisibility(notes, clientLinkVisible) {
  if (typeof notes === 'string') {
    if (notes.includes('[CLIENT_DELIVERABLE_VISIBLE:true]')) return true;
    if (notes.includes('[CLIENT_DELIVERABLE_VISIBLE:false]')) return false;
  }
  if (clientLinkVisible === true) return true;
  if (clientLinkVisible === false) return false;
  return false;
}

/** Transform a Supabase order row into the shape the existing UI expects. */
function transformOrder(dbOrder) {
  const sm = STATUS_MAP[dbOrder.status] || STATUS_MAP.received;
  const editorProfile = dbOrder.editor;
  const clientProfile = dbOrder.client;

  const displayCode = formatOrderCode(dbOrder);

  return {
    id: dbOrder.id,
    dbId: dbOrder.id,
    displayId: displayCode,
    orderCode: displayCode,
    title: dbOrder.order_name,
    client: clientProfile?.company_name || clientProfile?.full_name || 'Unknown',
    type: VIDEO_TYPE_MAP[dbOrder.video_type] || dbOrder.video_type,
    editor: {
      id: editorProfile?.id || null,
      name: editorProfile?.full_name || 'Unassigned',
      role: editorProfile?.editor_title || 'Pending Assignment',
      avatar: editorProfile?.avatar_url || '',
    },
    clientContact: {
      name: clientProfile?.full_name || 'Client',
      company: clientProfile?.company_name || '',
    },
    deadline: dbOrder.client_deadline
      ? new Date(dbOrder.client_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : 'No deadline',
    status: sm.label,
    dbStatus: dbOrder.status,
    badgeClass: sm.badgeClass,
    currentStep: sm.step,
    editorDeadline: dbOrder.editor_deadline ? dbOrder.editor_deadline.split('T')[0] : '',
    clientDeadline: dbOrder.client_deadline ? dbOrder.client_deadline.split('T')[0] : '',
    notes: stripVisibilityTag(stripOrderCodeTag(dbOrder.admin_notes)),
    rawAdminNotes: dbOrder.admin_notes || '',
    brief: dbOrder.brief || '',
    driveLink: dbOrder.drive_link || '',
    dropboxLink: dbOrder.dropbox_link || '',
    additionalLink: dbOrder.additional_link || '',
    clientLinkVisible: parseNotesVisibility(dbOrder.admin_notes, dbOrder.client_link_visible),
    clientId: dbOrder.client_id,
    editorId: dbOrder.editor_id,
    adminId: dbOrder.admin_id,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at,
  };
}

function getExpectedDeliveryDate(order) {
  if (!order) return 'Pending';
  if (order.clientDeadline) {
    try {
      const d = new Date(order.clientDeadline);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
  }
  if (order.editorDeadline) {
    try {
      const d = new Date(order.editorDeadline);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
  }
  if (order.createdAt) {
    try {
      const created = new Date(order.createdAt);
      if (!isNaN(created.getTime())) {
        const exp = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
        return exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
  }
  return 'Flexible';
}

const DEFAULT_STUDIO_EDITORS = [
  {
    id: 'ed_studio_1',
    full_name: 'Alex Rivera',
    username: 'alexrivera',
    email: 'alex@motionnodeedits.com',
    editor_title: 'AI Video Editor & VFX Lead',
    role: 'editor',
    status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    skills: ['Runway Gen-3', 'Midjourney', 'After Effects', 'Topaz AI'],
  },
  {
    id: 'ed_studio_2',
    full_name: 'Marcus Chen',
    username: 'marcuschen',
    email: 'marcus@motionnodeedits.com',
    editor_title: 'Motion Graphics Specialist',
    role: 'editor',
    status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    skills: ['Cinema 4D', 'Blender', 'Unreal Engine 5', 'Motion Design'],
  },
  {
    id: 'ed_studio_3',
    full_name: 'Elena Rostova',
    username: 'elenarostova',
    email: 'elena@motionnodeedits.com',
    editor_title: 'Short-Form Specialist',
    role: 'editor',
    status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    skills: ['Premiere Pro', 'CapCut Pro', 'Sound Design', 'Reels / TikTok Pacing'],
  }
];

/** Transform editor profile + stats into shape the UI expects. */
function transformEditor(profile, activeCount = 0, avgRating = 0) {
  const maxOrders = 5; // default capacity
  const isAtCapacity = activeCount >= maxOrders;
  const name = profile?.full_name || profile?.username || profile?.email || 'Video Editor';
  const role = profile?.editor_title || profile?.role || 'AI Video Editor';
  const category = profile?.editor_title || 'AI Video Editor';
  const isPending = (profile?.status || '').toLowerCase() === 'pending';

  const status = isPending
    ? 'PENDING'
    : isAtCapacity
      ? 'AT CAPACITY'
      : 'AVAILABLE';

  const statusColor = isPending
    ? '#F59E0B'
    : isAtCapacity
      ? '#EF4444'
      : '#22C55E';

  const skillsList = Array.isArray(profile?.skills) && profile.skills.length > 0
    ? profile.skills
    : ['AI Video', 'After Effects', 'Colorist'];

  return {
    id: profile?.id || `ed_${Date.now()}`,
    name,
    email: profile?.email || '',
    phone: profile?.phone || '',
    avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    status,
    statusColor,
    activeOrders: activeCount,
    maxOrders,
    category,
    role,
    tagline: profile?.tagline || profile?.editor_title || `${category} Specialist`,
    skills: skillsList,
    rating: avgRating || 5.0,
    created_at: profile?.created_at,
  };
}

/** Transform client profile into shape the UI expects. */
function transformClient(profile, activeCount = 0) {
  const isGoogle = Boolean(
    (profile.avatar_url && (profile.avatar_url.includes('googleusercontent.com') || profile.avatar_url.includes('google'))) ||
    profile.editor_title === 'Google User' ||
    profile.company_name === 'Google Client'
  );

  const status = (profile.status || 'approved').toLowerCase().trim();

  return {
    id: profile.id,
    name: profile.full_name || profile.company_name || profile.email || 'Client',
    previous_name: profile.previous_name || '',
    company: profile.company_name || '',
    company_name: profile.company_name || '',
    phone: profile.phone || '',
    tier: 'Client',
    activeProjects: activeCount,
    spend: '—',
    contact: profile.full_name || profile.email || 'Client',
    email: profile.email || '',
    status: status,
    isGoogle: isGoogle,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}


export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !session || !session.user) {
        window.location.href = '/admin/login';
        return;
      }

      const { authorized, profile } = await checkRouteAuth({
        requiredRole: 'admin',
        redirectOnFail: '/admin/login',
      });
      if (authorized && profile) {
        setIsAuthenticated(true);
        setAdminProfile(profile);
      }
    }
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.location.href = '/admin/login';
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    const confirmed = window.confirm('Are you sure you want to sign out of this account?');
    if (!confirmed) return;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mne_admin_auth_origin');
      localStorage.removeItem('mne_admin_auth_origin');
    }
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  const [activeNav, setActiveNav] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mgmtTab, setMgmtTab] = useState('editors');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  // ─── Live Data State ──────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminRatingsMap, setAdminRatingsMap] = useState({});
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [editorsList, setEditorsList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [selectedClientModal, setSelectedClientModal] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvalsSearch, setApprovalsSearch] = useState('');
  const [approvalsActionLoading, setApprovalsActionLoading] = useState({});
  const [metrics, setMetrics] = useState({
    activeOrders: 0, acceptedOrders: 0, completedThisWeek: 0,
    pendingOrders: 0, withEditorOrders: 0, readyForDelivery: 0,
  });
  const [dataLoaded, setDataLoaded] = useState(false);

  // ─── Contact Requests State ───────────────────────────────────────
  const [contactRequests, setContactRequests] = useState([]);
  const [contactRequestsLoading, setContactRequestsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState('ALL');
  const [contactTypeFilter, setContactTypeFilter] = useState('ALL');
  const [selectedContactRequest, setSelectedContactRequest] = useState(null);
  const [contactActionLoading, setContactActionLoading] = useState({});
  const [tempContactNotes, setTempContactNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // ─── Link Feedback State ──────────────────────────────────────────
  const [linkFeedbacks, setLinkFeedbacks] = useState([]);
  const [linkFeedbacksLoading, setLinkFeedbacksLoading] = useState(false);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('ALL');
  const [isCopiedFeedbackLink, setIsCopiedFeedbackLink] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!adminProfile) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await markAllNotificationsAsRead(adminProfile.id);
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
      if (nav === 'link-feedback') {
        fetchLinkFeedbacks();
      }
      setTimeout(() => setIsLoading(false), 300);
    }
    setSidebarOpen(false);
  };

  // ─── Data Fetching ────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const { data, error } = await getAdminAllOrders();
    if (!error && data) {
      const localCompleted = new Set(JSON.parse(localStorage.getItem('mne_completed_order_ids') || '[]'));
      const transformed = data.map(dbOrder => {
        const item = transformOrder(dbOrder);
        // Ensure locally completed order stays completed even if Supabase replication lags
        if (localCompleted.has(item.id) && item.dbStatus !== 'delivered') {
          return {
            ...item,
            status: 'COMPLETED',
            dbStatus: 'delivered',
            badgeClass: 'vel-badge-progress',
            currentStep: 4,
          };
        }
        return item;
      });
      setOrders(transformed);
    }
    try {
      const rMap = await getAllDeliveredOrdersRatingsMap();
      setAdminRatingsMap(rMap);
    } catch (rErr) {
      console.warn('Error loading admin ratings map:', rErr);
    }
    try {
      const { data: allHistory } = await supabase
        .from('order_status_history')
        .select('*')
        .order('changed_at', { ascending: true });
      if (allHistory) {
        const histMap = {};
        allHistory.forEach(h => {
          if (!histMap[h.order_id]) histMap[h.order_id] = [];
          histMap[h.order_id].push(h);
        });
        setStatusHistoryMap(prev => ({ ...prev, ...histMap }));
      }
    } catch (hErr) {
      console.warn('Error loading all status history:', hErr);
    }
  }, []);

  const fetchEditors = useCallback(async () => {
    try {
      const [editorsRes, orderCounts] = await Promise.all([
        getApprovedEditors(),
        getEditorActiveOrderCounts(),
      ]);

      let editorsData = editorsRes?.data || [];

      // If no editors found with role='editor', also check profiles that might have editor_title
      if (editorsData.length === 0) {
        try {
          const { data: allProfs } = await supabase
            .from('profiles')
            .select('*')
            .not('editor_title', 'is', null);
          if (allProfs && allProfs.length > 0) {
            editorsData = allProfs;
          }
        } catch (_) {}
      }

      // If still 0 editors in database, load default studio editors so the management section is populated
      if (editorsData.length === 0) {
        editorsData = DEFAULT_STUDIO_EDITORS;
      }

      // Fetch ratings for each editor
      const editorsWithStats = await Promise.all(
        editorsData.map(async (ed) => {
          let average = 5.0;
          try {
            if (ed.id && !String(ed.id).startsWith('ed_studio_')) {
              const rStats = await getEditorRatingStats(ed.id);
              if (rStats && rStats.average) average = rStats.average;
            }
          } catch (_) {}
          return transformEditor(ed, (orderCounts && orderCounts[ed.id]) || 0, average);
        })
      );

      setEditorsList(editorsWithStats);
    } catch (err) {
      console.warn('[AdminPage] Error in fetchEditors:', err);
      setEditorsList(DEFAULT_STUDIO_EDITORS.map(ed => transformEditor(ed, 0, 5.0)));
    }
  }, []);

  const fetchClients = useCallback(async () => {
    const { data, error } = await getAllClientsForAdmin();
    if (!error && data) {
      // Count active projects per client from orders
      const orderCounts = {};
      orders.forEach(o => {
        if (o.clientId && o.dbStatus !== 'delivered') {
          orderCounts[o.clientId] = (orderCounts[o.clientId] || 0) + 1;
        }
      });
      setClientsList(data.map(cl => transformClient(cl, orderCounts[cl.id] || 0)));
    }
  }, [orders]);

  const handleBlockClient = async (cl) => {
    const displayName = cl.name || cl.contact || cl.email;
    if (!window.confirm(`Are you sure you want to block/suspend client "${displayName}"? They will be immediately denied access to their dashboard.`)) {
      return;
    }
    try {
      const { error } = await blockClient(cl.id);
      if (error) {
        showToast(`Failed to block user: ${error.message}`);
      } else {
        showToast(`Client "${displayName}" has been blocked.`);
        setClientsList(prev => prev.map(c => c.id === cl.id ? { ...c, status: 'rejected' } : c));
      }
    } catch (err) {
      showToast(`Error blocking user: ${err.message}`);
    }
  };

  const handleUnblockClient = async (cl) => {
    const displayName = cl.name || cl.contact || cl.email;
    try {
      const { error } = await unblockClient(cl.id);
      if (error) {
        showToast(`Failed to unblock user: ${error.message}`);
      } else {
        showToast(`Client "${displayName}" has been unblocked.`);
        setClientsList(prev => prev.map(c => c.id === cl.id ? { ...c, status: 'approved' } : c));
      }
    } catch (err) {
      showToast(`Error unblocking user: ${err.message}`);
    }
  };

  const handleDeleteClient = async (cl) => {
    const displayName = cl.name || cl.contact || cl.email;
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete user "${displayName}" (${cl.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      const { error } = await deleteClient(cl.id);
      if (error) {
        showToast(`Failed to delete user: ${error.message}`);
      } else {
        showToast(`Client "${displayName}" was permanently deleted.`);
        setClientsList(prev => prev.filter(c => c.id !== cl.id));
      }
    } catch (err) {
      showToast(`Error deleting user: ${err.message}`);
    }
  };


  const fetchPendingUsers = useCallback(async () => {
    const { data, error } = await getPendingProfiles();
    if (!error && data) {
      setPendingUsers(data);
    }
  }, []);

  const handleApproveUser = async (user) => {
    setApprovalsActionLoading(prev => ({ ...prev, [user.id]: 'approving' }));
    try {
      const { error } = await updateProfileStatus(user.id, 'approved');
      if (error) {
        showToast(`Approval failed: ${error.message}`);
      } else {
        showToast(`User "${user.full_name || user.email}" approved! They can now log in.`);
        setPendingUsers(prev => prev.filter(u => u.id !== user.id));
        fetchClients();
        fetchEditors();
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setApprovalsActionLoading(prev => ({ ...prev, [user.id]: null }));
    }
  };

  const handleRejectUser = async (user) => {
    const displayName = user.full_name || user.email;
    if (!window.confirm(`Are you sure you want to decline registration for "${displayName}"?`)) {
      return;
    }
    setApprovalsActionLoading(prev => ({ ...prev, [user.id]: 'rejecting' }));
    try {
      const { error } = await updateProfileStatus(user.id, 'rejected');
      if (error) {
        showToast(`Action failed: ${error.message}`);
      } else {
        showToast(`Registration for "${displayName}" was declined.`);
        setPendingUsers(prev => prev.filter(u => u.id !== user.id));
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setApprovalsActionLoading(prev => ({ ...prev, [user.id]: null }));
    }
  };

  const fetchMetrics = useCallback(async () => {
    const counts = await getAdminOrderCounts();
    setMetrics(counts);
  }, []);

  const fetchContactRequests = useCallback(async () => {
    setContactRequestsLoading(true);
    try {
      const { data, error } = await getContactRequests();
      if (error) {
        console.error('[Admin] Error fetching contact requests from Supabase:', error);
      } else if (data) {
        setContactRequests(data);
      }
    } catch (err) {
      console.warn('Error fetching contact requests:', err);
    } finally {
      setContactRequestsLoading(false);
    }
  }, []);

  const fetchLinkFeedbacks = useCallback(async () => {
    setLinkFeedbacksLoading(true);
    try {
      const { data, error } = await getLinkFeedbacks();
      if (!error && data) {
        setLinkFeedbacks(data);
      }
    } catch (err) {
      console.warn('Error fetching link feedbacks:', err);
    } finally {
      setLinkFeedbacksLoading(false);
    }
  }, []);

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      const { error } = await deleteLinkFeedback(id);
      if (error) {
        showToast('Failed to delete feedback: ' + (error.message || 'Error'));
      } else {
        setLinkFeedbacks(prev => prev.filter(item => item.id !== id));
        showToast('Feedback removed.');
      }
    } catch (err) {
      showToast('Error deleting feedback: ' + (err?.message || 'Check permissions'));
    }
  };

  const handleCopyFeedbackLink = () => {
    const url = `${window.location.origin}/feedback`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
    } else {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setIsCopiedFeedbackLink(true);
    showToast('Feedback link copied to clipboard!');
    setTimeout(() => setIsCopiedFeedbackLink(false), 2500);
  };

  const fetchNotifications = useCallback(async () => {
    if (!adminProfile) return;
    const { data, error } = await getUserNotifications(adminProfile.id);
    if (!error && data) {
      setNotifications(data);
    }
  }, [adminProfile]);

  // ─── Initial Load ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadAll() {
      await Promise.all([fetchOrders(), fetchEditors(), fetchMetrics(), fetchPendingUsers(), fetchContactRequests(), fetchLinkFeedbacks()]);
      setDataLoaded(true);
    }
    loadAll();
  }, [isAuthenticated, fetchOrders, fetchEditors, fetchMetrics, fetchPendingUsers, fetchContactRequests, fetchLinkFeedbacks]);

  // Fetch clients after orders are loaded (depends on order counts)
  useEffect(() => {
    if (dataLoaded) {
      fetchClients();
    }
  }, [dataLoaded, fetchClients]);

  // Fetch notifications after admin profile is loaded
  useEffect(() => {
    if (adminProfile) {
      fetchNotifications();
    }
  }, [adminProfile, fetchNotifications]);

  // ─── Realtime Subscriptions ───────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const ordersChannel = subscribeToOrders({
      onInsert: () => { fetchOrders(); fetchMetrics(); },
      onUpdate: () => { fetchOrders(); fetchMetrics(); fetchEditors(); },
      onDelete: () => { fetchOrders(); fetchMetrics(); },
    });

    const profilesChannel = subscribeToProfiles({
      onInsert: () => { fetchClients(); fetchEditors(); fetchPendingUsers(); },
      onUpdate: () => { fetchClients(); fetchEditors(); fetchPendingUsers(); },
      onDelete: () => { fetchClients(); fetchEditors(); fetchPendingUsers(); },
    });

    const contactRequestsChannel = subscribeToContactRequests({
      onInsert: (newReq) => {
        setContactRequests(prev => [newReq, ...prev.filter(r => r.id !== newReq.id)]);
        showToast(`New quote request from ${newReq.name}!`);
      },
      onUpdate: (updatedReq) => {
        setContactRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
      },
      onDelete: (deletedReq) => {
        setContactRequests(prev => prev.filter(r => r.id !== deletedReq.id));
      },
    });

    return () => {
      unsubscribeChannel(ordersChannel);
      unsubscribeChannel(profilesChannel);
      unsubscribeChannel(contactRequestsChannel);
    };
  }, [isAuthenticated, fetchOrders, fetchMetrics, fetchEditors, fetchClients, fetchPendingUsers, fetchContactRequests]);

  // Contact Request Handlers
  const handleUpdateContactStatus = async (id, newStatus) => {
    setContactActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const { error } = await updateContactRequestStatus(id, newStatus);
      if (error) {
        showToast(`Failed to update status: ${error.message}`);
      } else {
        setContactRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        if (selectedContactRequest && selectedContactRequest.id === id) {
          setSelectedContactRequest(prev => ({ ...prev, status: newStatus }));
        }
        showToast(`Status updated to "${CONTACT_STATUS_CONFIG[newStatus]?.label || newStatus}"`);
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setContactActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteContactRequest = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the contact request from "${name}"?`)) {
      return;
    }
    setContactActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const { error } = await deleteContactRequest(id);
      if (error) {
        showToast(`Failed to delete request: ${error.message}`);
      } else {
        setContactRequests(prev => prev.filter(r => r.id !== id));
        if (selectedContactRequest && selectedContactRequest.id === id) {
          setSelectedContactRequest(null);
        }
        showToast(`Contact request from "${name}" deleted.`);
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setContactActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSaveContactNotes = async (id) => {
    setIsSavingNotes(true);
    try {
      const { error } = await updateContactRequestNotes(id, tempContactNotes);
      if (error) {
        showToast(`Failed to save notes: ${error.message}`);
      } else {
        setContactRequests(prev => prev.map(r => r.id === id ? { ...r, admin_notes: tempContactNotes } : r));
        if (selectedContactRequest && selectedContactRequest.id === id) {
          setSelectedContactRequest(prev => ({ ...prev, admin_notes: tempContactNotes }));
        }
        showToast('Admin notes saved successfully.');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const getWhatsAppUrl = (phone, name, projectType) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^0+/, '');
    const finalPhone = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;
    const projectLabel = PROJECT_TYPE_LABELS[projectType] || 'video editing';
    const greeting = encodeURIComponent(`Hi ${name || 'there'}, thanks for reaching out to MotionNodeEdits regarding your ${projectLabel} project!`);
    return `https://wa.me/${finalPhone}?text=${greeting}`;
  };

  useEffect(() => {
    if (!adminProfile) return;

    const notifChannel = subscribeToUserNotifications(
      adminProfile.id,
      (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
      },
      (updatedNotif) => {
        setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
      }
    );

    return () => unsubscribeChannel(notifChannel);
  }, [adminProfile]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editorCategoryFilter, setEditorCategoryFilter] = useState('ALL');
  const [editorStatusFilter, setEditorStatusFilter] = useState('ALL');
  const [editorSortBy, setEditorSortBy] = useState('workload-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showAddEditorModal, setShowAddEditorModal] = useState(false);

  // New Editor Form State
  const [newEditorForm, setNewEditorForm] = useState({
    name: '',
    role: 'AI Video Editor & VFX Lead',
    category: 'AI Video Editor',
    tagline: 'AI Video Synthesis, Neural Upscaling & Generative Motion',
    skills: 'Runway Gen-3, Midjourney, After Effects, Topaz AI',
    maxOrders: 5,
    status: 'AVAILABLE',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
  });

  const [expandedEditor, setExpandedEditor] = useState(null);

  // Active pipeline orders (excluding completed/delivered) vs Delivered History
  const activePipelineOrders = orders.filter(o => o.dbStatus !== 'delivered');
  const deliveredHistoryOrders = orders.filter(o => o.dbStatus === 'delivered');

  // Selected order tracking
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [stagedStatusMap, setStagedStatusMap] = useState({});

  const selectedOrder = (activeNav === 'orders' ? activePipelineOrders : orders).find(o => o.id === selectedOrderId) ||
    (activeNav === 'orders' ? activePipelineOrders[0] : orders[0]) || {
    id: '', title: '', client: '', type: '', editor: { name: 'Unassigned', role: '', avatar: '' },
    clientContact: { name: '', company: '' }, deadline: '', status: '', badgeClass: '',
    currentStep: 0, editorDeadline: '', clientDeadline: '', notes: '', dbStatus: 'received',
  };

  // Auto-select first active order initially on load
  useEffect(() => {
    if (orders.length > 0 && !selectedOrderId) {
      const activeList = orders.filter(o => o.dbStatus !== 'delivered');
      setSelectedOrderId(activeList.length > 0 ? activeList[0].id : orders[0].id);
    }
  }, [orders.length, selectedOrderId]);

  // Order status history for milestones
  const [statusHistoryMap, setStatusHistoryMap] = useState({});

  useEffect(() => {
    if (!selectedOrderId) return;
    let active = true;
    async function loadHistory() {
      try {
        const { data, error } = await supabase
          .from('order_status_history')
          .select('*')
          .eq('order_id', selectedOrderId)
          .order('changed_at', { ascending: true });
        if (!error && data && active) {
          setStatusHistoryMap(prev => ({ ...prev, [selectedOrderId]: data }));
        }
      } catch (err) {
        console.warn('[Admin] Error fetching order status history:', err);
      }
    }
    loadHistory();
    return () => { active = false; };
  }, [selectedOrderId]);

  const getOrderStageDate = (order, statusKey, stepIndex) => {
    if (!order || !order.id) return 'Pending';
    const currentStep = order.currentStep ?? 0;

    // If delivered stage is not yet completed, show expected delivery date
    if (statusKey === 'delivered' && currentStep < 4) {
      const expDate = getExpectedDeliveryDate(order);
      return `Exp: ${expDate}`;
    }

    // If step hasn't been reached yet
    if (currentStep < stepIndex) {
      return 'Pending';
    }

    // Step 0: Received
    if (stepIndex === 0) {
      if (order.createdAt) {
        try {
          const d = new Date(order.createdAt);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }
        } catch {}
      }
      return 'Received';
    }

    // Check status history for this step
    const history = statusHistoryMap[order.id] || [];
    const match = history.find(h => h.new_status === statusKey);
    if (match && match.changed_at) {
      try {
        const d = new Date(match.changed_at);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch {}
    }

    // Active step timestamp
    if (currentStep === stepIndex && order.updatedAt) {
      try {
        const d = new Date(order.updatedAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch {}
    }

    // Completed step fallback
    if (currentStep > stepIndex) {
      const fallbackDate = order.updatedAt || order.createdAt;
      if (fallbackDate) {
        try {
          const d = new Date(fallbackDate);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }
        } catch {}
      }
    }

    return 'Pending';
  };

  const getOrderAcceptedDate = (order, historyMap) => {
    if (!order) return '—';
    const history = (historyMap && historyMap[order.id]) || [];
    const match = history.find(h => h.new_status === 'accepted');
    if (match && match.changed_at) {
      try {
        const d = new Date(match.changed_at);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch {}
    }
    // Fallback to order createdAt
    if (order.createdAt) {
      try {
        const d = new Date(order.createdAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch {}
    }
    return '—';
  };

  const getDeliveryPerformance = (order, historyMap) => {
    if (!order) return { label: 'On Time', isOnTime: true };

    let deliveryTime = null;
    const history = (historyMap && historyMap[order.id]) || [];
    const deliveredHistory = history.find(h => h.new_status === 'delivered');
    if (deliveredHistory && deliveredHistory.changed_at) {
      deliveryTime = new Date(deliveredHistory.changed_at);
    } else if (order.updatedAt) {
      deliveryTime = new Date(order.updatedAt);
    }

    const deadlineStr = order.clientDeadline || order.editorDeadline;
    if (!deadlineStr || deadlineStr === 'No deadline' || deadlineStr === '—') {
      return { label: 'On Time', isOnTime: true };
    }

    const deadlineTime = new Date(deadlineStr);
    if (isNaN(deadlineTime.getTime()) || !deliveryTime || isNaN(deliveryTime.getTime())) {
      return { label: 'On Time', isOnTime: true };
    }

    // End of deadline day in local time
    const deadlineEndOfDay = new Date(deadlineTime);
    deadlineEndOfDay.setHours(23, 59, 59, 999);

    const diffMs = deliveryTime.getTime() - deadlineEndOfDay.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0 || diffDays <= 0) {
      return {
        label: 'On Time',
        isOnTime: true,
        diffDays: 0,
      };
    } else {
      return {
        label: `Delayed (+${diffDays}d)`,
        isOnTime: false,
        diffDays,
      };
    }
  };

  // Assign Project Form State
  const [assignForm, setAssignForm] = useState({
    client: '',
    project: '',
    autoSuggest: true,
    editor: '',
    editorId: '',
    orderId: '',
    clientDeadline: '',
    internalDeadline: '',
    brief: '',
    notifyEditor: true
  });

  // Order Creation Form State
  const [createForm, setCreateForm] = useState({
    existingClient: '',
    nomenclature: '',
    format: 'YouTube Longform (16:9)',
    brief: '',
    rawFootageLink: '',
    brandAssetsLink: '',
    internalDeadline: '',
    clientDeadline: ''
  });

  const handleOrderFieldChange = (field, val) => {
    const targetId = selectedOrderId || selectedOrder.id || orders[0]?.id;
    if (!targetId) return;

    if (field === 'status') {
      setStagedStatusMap(prev => ({ ...prev, [targetId]: val }));
    } else {
      setOrders(prev => prev.map(o => {
        if (o.id === targetId) return { ...o, [field]: val, pendingFieldChange: true };
        return o;
      }));
    }
  };

  const notifyOrderStatusChange = async (order, newDbStatus, statusLabel) => {
    if (!order) return;
    const clientId = order.clientId || order.client_id || order.client?.id;
    const editorId = order.editor?.id || order.editor_id;
    const title = order.title || order.order_name || 'Project';

    // Notify client
    if (clientId) {
      let clientMsg = `Your project "${title}" status has updated to: ${statusLabel}.`;
      if (newDbStatus === 'in_progress') clientMsg = `Production is underway for "${title}". Our team is editing your video.`;
      if (newDbStatus === 'review') clientMsg = `Your project "${title}" is undergoing studio quality review.`;
      if (newDbStatus === 'revision') clientMsg = `Your revision notes for "${title}" are being implemented by the editor.`;
      if (newDbStatus === 'delivered') clientMsg = `Your project "${title}" has been completed and delivered! Check your workspace to download deliverables.`;

      try {
        await sendNotification(clientId, `Status: ${title} (${statusLabel})`, clientMsg);
      } catch (_) {}
    }

    // Notify editor
    if (editorId) {
      let editorMsg = `Project "${title}" status is now: ${statusLabel}.`;
      if (newDbStatus === 'in_progress') editorMsg = `Production started for "${title}".`;
      if (newDbStatus === 'revision') editorMsg = `Client revision active for "${title}". Please review revision notes.`;
      if (newDbStatus === 'delivered') editorMsg = `Great job! "${title}" was marked as completed and delivered.`;

      try {
        await sendNotification(editorId, `Order Update: ${title}`, editorMsg);
      } catch (_) {}
    }
  };

  const handleUpdateStatusExplicitly = async (statusVal) => {
    const targetId = selectedOrderId || selectedOrder.id || orders[0]?.id;
    if (!targetId) {
      showToast('No order selected.');
      return;
    }

    const order = orders.find(o => o.id === targetId) || selectedOrder;
    const dbStatus = UI_TO_DB_STATUS[statusVal] || (typeof statusVal === 'string' ? statusVal.toLowerCase() : 'received');
    const sm = STATUS_MAP[dbStatus] || STATUS_MAP.received;

    setIsLoading(true);
    try {
      // 1. Update status via updateOrderStatus helper
      await updateOrderStatus(
        targetId,
        dbStatus,
        adminProfile?.id,
        order.dbStatus,
        null
      );

      // 2. Direct update on orders table to guarantee persistence
      const { error: directErr } = await supabase
        .from('orders')
        .update({ status: dbStatus, updated_at: new Date().toISOString() })
        .eq('id', targetId);

      if (directErr) {
        console.warn('Direct update note:', directErr);
      }

      // 3. Persistent local storage backup so refresh NEVER reverts
      try {
        const localCompleted = new Set(JSON.parse(localStorage.getItem('mne_completed_order_ids') || '[]'));
        if (dbStatus === 'delivered') {
          localCompleted.add(targetId);
        } else {
          localCompleted.delete(targetId);
        }
        localStorage.setItem('mne_completed_order_ids', JSON.stringify([...localCompleted]));
      } catch {}

      // 4. Update React state
      setOrders(prev => prev.map(o => {
        if (o.id === targetId) {
          return {
            ...o,
            status: sm.label,
            dbStatus,
            badgeClass: sm.badgeClass,
            currentStep: sm.step,
            pendingStatusChange: false,
          };
        }
        return o;
      }));

      // Clear staged status
      setStagedStatusMap(prev => {
        const copy = { ...prev };
        delete copy[targetId];
        return copy;
      });

      if (dbStatus === 'delivered') {
        const nextActive = orders.filter(o => o.id !== targetId && o.dbStatus !== 'delivered');
        if (nextActive.length > 0) {
          setSelectedOrderId(nextActive[0].id);
        }
        showToast('Order marked Completed and moved to Orders History!');
      } else {
        showToast(`Order status updated to ${sm.label}!`);
      }

      // Send real-time notifications to Client and Editor
      try {
        await notifyOrderStatusChange(order, dbStatus, sm.label);
      } catch (_) {}

      // Cross-tab broadcast
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('mne-order-updates');
          bc.postMessage({ type: 'ORDER_UPDATED', orderId: targetId });
          bc.close();
        }
      } catch {}

      await fetchOrders();
    } catch (err) {
      console.error('Status update failed:', err);
      showToast('Failed to update status: ' + (err.message || 'Check network'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOrderChanges = async () => {
    const targetId = selectedOrderId || selectedOrder.id || orders[0]?.id;
    if (!targetId) return;
    const order = orders.find(o => o.id === targetId) || selectedOrder;

    setIsLoading(true);
    try {
      const chosenStatus = stagedStatusMap[targetId] || order.status;
      const dbStatus = UI_TO_DB_STATUS[chosenStatus] || order.dbStatus || 'received';
      const sm = STATUS_MAP[dbStatus] || STATUS_MAP.received;

      // 1. Update status
      await updateOrderStatus(
        targetId,
        dbStatus,
        adminProfile?.id,
        null,
        null
      );

      // 2. Commit notes, deadlines, visibility tag, and status directly
      const cleanNotes = stripVisibilityTag(order.notes);
      const tag = `[CLIENT_DELIVERABLE_VISIBLE:${order.clientLinkVisible ? 'true' : 'false'}]`;
      const notesWithTag = cleanNotes ? `${cleanNotes} ${tag}` : tag;

      const safeEditorDeadline = safeIsoDate(order.editorDeadline);
      const safeClientDeadline = safeIsoDate(order.clientDeadline);

      const { error } = await supabase
        .from('orders')
        .update({
          status: dbStatus,
          editor_deadline: safeEditorDeadline,
          client_deadline: safeClientDeadline,
          admin_notes: notesWithTag,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId);

      if (error) {
        throw new Error(error.message || 'Failed to update order');
      }

      // 3. Persistent local storage backup so refresh NEVER reverts
      try {
        const localCompleted = new Set(JSON.parse(localStorage.getItem('mne_completed_order_ids') || '[]'));
        if (dbStatus === 'delivered') {
          localCompleted.add(targetId);
        } else {
          localCompleted.delete(targetId);
        }
        localStorage.setItem('mne_completed_order_ids', JSON.stringify([...localCompleted]));
      } catch {}

      setOrders(prev => prev.map(o => o.id === targetId ? {
        ...o,
        status: sm.label,
        dbStatus,
        badgeClass: sm.badgeClass,
        currentStep: sm.step,
        pendingStatusChange: false,
        pendingFieldChange: false
      } : o));

      setStagedStatusMap(prev => {
        const copy = { ...prev };
        delete copy[targetId];
        return copy;
      });

      if (dbStatus === 'delivered') {
        const nextActive = orders.filter(o => o.id !== targetId && o.dbStatus !== 'delivered');
        if (nextActive.length > 0) {
          setSelectedOrderId(nextActive[0].id);
        }
        showToast('Order marked Completed and moved to Orders History!');
      } else {
        showToast(`Order status (${sm.label}) and changes saved successfully!`);
      }

      // Send real-time notifications to Client and Editor
      try {
        await notifyOrderStatusChange(order, dbStatus, sm.label);
      } catch (_) {}

      // Broadcast cross-tab update
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('mne-order-updates');
          bc.postMessage({ type: 'ORDER_UPDATED', orderId: targetId });
          bc.close();
        }
      } catch {}

      await fetchOrders();
    } catch (e) {
      console.error('Save error:', e);
      showToast('Error saving changes: ' + (e.message || 'Check connection'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotifyEditor = async () => {
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order || !order.editor?.id) {
      showToast('No editor assigned to this order.');
      return;
    }
    await sendNotification(
      order.editor.id,
      `Reminder: ${order.title}`,
      `Admin sent you a reminder regarding project "${order.title}".`
    );
    showToast(`Notification sent to ${order.editor.name}!`);
  };

  const handleToggleClientDeliverableAccess = async () => {
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;

    const newVisibility = !order.clientLinkVisible;
    const cleanNotes = stripVisibilityTag(order.notes);
    const tag = `[CLIENT_DELIVERABLE_VISIBLE:${newVisibility ? 'true' : 'false'}]`;
    const updatedNotes = cleanNotes ? `${cleanNotes} ${tag}` : tag;

    // 1. Optimistic update
    setOrders(prev => prev.map(o => {
      if (o.id === selectedOrderId) {
        return {
          ...o,
          clientLinkVisible: newVisibility,
          notes: cleanNotes
        };
      }
      return o;
    }));

    // Broadcast across browser tabs immediately
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('mne-order-updates');
        bc.postMessage({
          type: 'ORDER_VISIBILITY_UPDATED',
          orderId: order.dbId || order.id,
          visible: newVisibility
        });
        bc.close();
      }
    } catch (bcErr) {
      console.warn('BroadcastChannel error:', bcErr);
    }

    // 2. Persist to Supabase
    try {
      // First attempt: update both client_link_visible and admin_notes
      let res = await updateOrder(order.dbId || order.id, {
        client_link_visible: newVisibility,
        admin_notes: updatedNotes,
      });

      // Fallback: if client_link_visible column doesn't exist yet, update admin_notes
      if (res.error && res.error.message && res.error.message.toLowerCase().includes('column')) {
        res = await updateOrder(order.dbId || order.id, {
          admin_notes: updatedNotes,
        });
      }

      if (res.error) {
        console.error('[Admin] Database update error:', res.error);
        showToast('Database update error: ' + res.error.message);
      } else {
        showToast(newVisibility
          ? 'Access Granted: Deliverable is now VISIBLE to the client!'
          : 'Access Revoked: Deliverable is now HIDDEN from the client.'
        );

        if (newVisibility && order.clientId) {
          try {
            await sendNotification(
              order.clientId,
              `Deliverables Ready: ${order.title}`,
              `Your final deliverables for "${order.title}" have been approved by admin and are ready to view!`
            );
          } catch (notifErr) {
            console.warn('[Admin] Could not notify client:', notifErr);
          }
        }

        if (newVisibility && (order.editor?.id || order.editor_id)) {
          try {
            await sendNotification(
              order.editor?.id || order.editor_id,
              `Deliverables Approved: ${order.title}`,
              `Admin approved your deliverables for "${order.title}" and made them available to the client!`
            );
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('[Admin] Error toggling client visibility:', e);
    }
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.nomenclature) {
      showToast('Please enter a project nomenclature.');
      return;
    }

    // Find the selected client
    const selectedClient = clientsList.find(cl =>
      cl.name === createForm.existingClient
    );

    if (!selectedClient) {
      showToast('Please select a client.');
      return;
    }

    const videoType = UI_TO_VIDEO_TYPE[createForm.format] || 'youtube_longform';
    const orderCode = generateOrderCode();

    const payload = {
      order_name: createForm.nomenclature,
      order_code: orderCode,
      video_type: videoType,
      brief: createForm.brief || '',
      drive_link: createForm.rawFootageLink || null,
      dropbox_link: createForm.brandAssetsLink || null,
      client_id: selectedClient?.id || adminProfile?.id,
      admin_id: adminProfile?.id,
      status: 'received',
      editor_deadline: createForm.internalDeadline ? new Date(createForm.internalDeadline).toISOString() : null,
      client_deadline: createForm.clientDeadline ? new Date(createForm.clientDeadline).toISOString() : null,
    };

    const { error } = await createOrder(payload);
    if (error) {
      showToast('Error creating order: ' + error.message);
      return;
    }

    showToast(`Order created successfully! (ID: ${orderCode})`);

    // Notify the client
    if (selectedClient?.id) {
      await sendNotification(
        selectedClient.id,
        `New project: ${createForm.nomenclature}`,
        `A new project "${createForm.nomenclature}" has been created for you.`
      );
    }

    // Reset form
    setCreateForm({
      existingClient: clientsList[0]?.name || '',
      nomenclature: '', format: 'YouTube Longform (16:9)',
      brief: '', rawFootageLink: '', brandAssetsLink: '',
      internalDeadline: '', clientDeadline: '',
    });

    await fetchOrders();
    handleNavClick('orders');
  };

  const handleAssignProjectSubmit = async (e) => {
    e.preventDefault();

    if (!assignForm.orderId || !assignForm.editorId) {
      showToast('Please select a project and editor.');
      return;
    }

    if (!assignForm.clientDeadline || !assignForm.internalDeadline) {
      showToast('Please specify both the Client Deadline and Internal Editor Deadline.');
      return;
    }

    const safeClientDeadline = safeIsoDate(assignForm.clientDeadline);
    const safeEditorDeadline = safeIsoDate(assignForm.internalDeadline);

    const extraUpdates = {
      editor_deadline: safeEditorDeadline,
      client_deadline: safeClientDeadline,
    };
    if (assignForm.brief) {
      extraUpdates.admin_notes = assignForm.brief;
    }

    setIsLoading(true);
    try {
      const { error } = await assignEditorToOrder(
        assignForm.orderId,
        assignForm.editorId,
        adminProfile?.id,
        extraUpdates
      );

      if (error) {
        showToast('Error assigning: ' + error.message);
        return;
      }

      // Direct update to ensure deadlines are committed
      await supabase
        .from('orders')
        .update({
          editor_id: assignForm.editorId,
          status: 'accepted',
          editor_deadline: safeEditorDeadline,
          client_deadline: safeClientDeadline,
          admin_notes: assignForm.brief || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignForm.orderId);

      // Notify the editor
      if (assignForm.notifyEditor && assignForm.editorId) {
        await sendNotification(
          assignForm.editorId,
          `New project assigned: ${assignForm.project}`,
          `You have been assigned to "${assignForm.project}". Editor Deadline: ${assignForm.internalDeadline}. Please review the brief.`
        );
      }

      // Notify the client that production has begun
      const matchedOrder = orders.find(o => o.id === assignForm.orderId);
      const targetClientId = matchedOrder?.clientId || matchedOrder?.client_id || matchedOrder?.client?.id;
      if (targetClientId) {
        try {
          await sendNotification(
            targetClientId,
            `Editor Assigned: ${assignForm.project}`,
            `Your project "${assignForm.project}" has been assigned to an editor and production has officially begun!`
          );
        } catch (_) {}
      }

      showToast(`Project assigned to ${assignForm.editor} with deadlines successfully saved!`);

      // Reset form
      setAssignForm({
        client: '',
        project: '',
        autoSuggest: true,
        editor: '',
        editorId: '',
        orderId: '',
        clientDeadline: '',
        internalDeadline: '',
        brief: '',
        notifyEditor: true
      });

      await Promise.all([fetchOrders(), fetchEditors()]);
      handleNavClick('orders');
    } catch (err) {
      console.error('Assignment error:', err);
      showToast('Failed to assign project: ' + (err.message || 'Check network'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirectToAssign = (order) => {
    if (!order) return;
    const matchedClient = clientsList.find(c =>
      (order.clientId && c.id === order.clientId) ||
      c.name.toLowerCase() === (order.client || '').toLowerCase()
    );
    const clientName = matchedClient ? matchedClient.name : order.client;

    setAssignForm({
      client: clientName || '',
      project: order.title || '',
      orderId: order.dbId || order.id || '',
      clientDeadline: order.clientDeadline ? order.clientDeadline.split('T')[0] : '',
      internalDeadline: order.editorDeadline ? order.editorDeadline.split('T')[0] : '',
      brief: order.notes || order.brief || '',
      editor: '',
      editorId: '',
      autoSuggest: true,
      notifyEditor: true
    });

    handleNavClick('assign');
    showToast(`Pre-filled "${order.title}" for ${clientName}. Choose an editor to assign.`);
  };

  const handleAddNewEditorSubmit = async (e) => {
    e.preventDefault();
    if (!newEditorForm.name.trim()) {
      showToast('Please enter editor name.');
      return;
    }

    const skillsArray = typeof newEditorForm.skills === 'string'
      ? newEditorForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      : (Array.isArray(newEditorForm.skills) ? newEditorForm.skills : []);

    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ed_${Date.now()}`;
    const cleanUsername = newEditorForm.name.toLowerCase().replace(/\s+/g, '');

    const newProfile = {
      id: newId,
      full_name: newEditorForm.name.trim(),
      email: `${cleanUsername}@motionnodeedits.com`,
      username: cleanUsername,
      role: 'editor',
      status: 'approved',
      editor_title: newEditorForm.role || newEditorForm.category || 'AI Video Editor',
      avatar_url: newEditorForm.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    };

    try {
      await supabase.from('profiles').upsert(newProfile);
    } catch (dbErr) {
      console.warn('[AdminPage] Upsert editor to DB warning:', dbErr);
    }

    const newEd = transformEditor(newProfile, 0, 5.0);
    newEd.skills = skillsArray.length ? skillsArray : ['AI Video', 'After Effects', 'Colorist'];
    newEd.status = newEditorForm.status || 'AVAILABLE';
    newEd.statusColor = newEd.status === 'AVAILABLE' ? '#22C55E' : '#EF4444';

    setEditorsList(prev => [newEd, ...prev.filter(ed => ed.id !== newEd.id)]);
    setShowAddEditorModal(false);
    showToast(`Editor "${newEd.name}" added to studio roster!`);
    setNewEditorForm({
      name: '',
      role: 'AI Video Editor & VFX Lead',
      category: 'AI Video Editor',
      tagline: 'AI Video Synthesis, Neural Upscaling & Generative Motion',
      skills: 'Runway Gen-3, Midjourney, After Effects, Topaz AI',
      maxOrders: 5,
      status: 'AVAILABLE',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
    });
  };

  const filteredOrders = activePipelineOrders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      o.title.toLowerCase().includes(q) ||
      o.client.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredEditors = editorsList.filter(ed => {
    const q = searchQuery.toLowerCase().trim();
    const edName = (ed.name || '').toLowerCase();
    const edRole = (ed.role || '').toLowerCase();
    const edEmail = (ed.email || '').toLowerCase();
    const edTagline = (ed.tagline || '').toLowerCase();
    const edCategory = (ed.category || '').toLowerCase();
    const skillsArr = Array.isArray(ed.skills) ? ed.skills : [];

    const matchesSearch = !q ||
      edName.includes(q) ||
      edRole.includes(q) ||
      edEmail.includes(q) ||
      edTagline.includes(q) ||
      edCategory.includes(q) ||
      skillsArr.some(s => typeof s === 'string' && s.toLowerCase().includes(q));

    const matchesCategory = editorCategoryFilter === 'ALL' ||
      edCategory.includes(editorCategoryFilter.toLowerCase()) ||
      edRole.includes(editorCategoryFilter.toLowerCase());

    const matchesStatus = editorStatusFilter === 'ALL' || ed.status === editorStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    const aWorkload = (a.activeOrders || 0) / (a.maxOrders || 5);
    const bWorkload = (b.activeOrders || 0) / (b.maxOrders || 5);
    if (editorSortBy === 'workload-asc') return aWorkload - bWorkload;
    if (editorSortBy === 'workload-desc') return bWorkload - aWorkload;
    if (editorSortBy === 'rating') return (b.rating || 5.0) - (a.rating || 5.0);
    if (editorSortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  const filteredClients = clientsList.filter(cl => {
    const q = searchQuery.toLowerCase().trim();
    return !q ||
      cl.name.toLowerCase().includes(q) ||
      (cl.email && cl.email.toLowerCase().includes(q)) ||
      (cl.phone && cl.phone.toLowerCase().includes(q)) ||
      (cl.company_name && cl.company_name.toLowerCase().includes(q)) ||
      cl.contact.toLowerCase().includes(q) ||
      cl.tier.toLowerCase().includes(q);
  });

  const filteredPendingUsers = pendingUsers.filter(u => {
    const q = approvalsSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.company_name && u.company_name.toLowerCase().includes(q))
    );
  });

  const filteredContactRequests = contactRequests.filter(req => {
    if (contactStatusFilter !== 'ALL' && req.status?.toLowerCase() !== contactStatusFilter.toLowerCase()) {
      return false;
    }
    if (contactTypeFilter !== 'ALL' && req.project_type !== contactTypeFilter) {
      return false;
    }
    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase().trim();
      const matchName = (req.name || '').toLowerCase().includes(q);
      const matchEmail = (req.email || '').toLowerCase().includes(q);
      const matchPhone = (req.phone || '').toLowerCase().includes(q);
      const matchMsg = (req.message || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchMsg) return false;
    }
    return true;
  });

  const newContactRequestsCount = contactRequests.filter(r => r.status === 'new').length;

  const filteredFeedbacks = linkFeedbacks.filter(fb => {
    if (feedbackRatingFilter !== 'ALL' && Number(fb.rating) !== Number(feedbackRatingFilter)) {
      return false;
    }
    if (feedbackSearch.trim()) {
      const q = feedbackSearch.toLowerCase().trim();
      const matchName = (fb.name || '').toLowerCase().includes(q);
      const matchEmail = (fb.email || '').toLowerCase().includes(q);
      const matchCompany = (fb.company || '').toLowerCase().includes(q);
      const matchFeedback = (fb.feedback || '').toLowerCase().includes(q);
      const matchImprovements = (fb.improvements || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCompany && !matchFeedback && !matchImprovements) {
        return false;
      }
    }
    return true;
  });

  const avgFeedbackRating = linkFeedbacks.length > 0
    ? (linkFeedbacks.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0) / linkFeedbacks.length).toFixed(1)
    : '5.0';
  const fiveStarFeedbackCount = linkFeedbacks.filter(f => Number(f.rating) === 5).length;
  const testimonialConsentCount = linkFeedbacks.filter(f => f.testimonial_consent).length;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="vel-admin-layout">
      <CustomCursor />
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="vel-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="vel-toast">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR NAVIGATION                                                 */}
      {/* ------------------------------------------------------------------ */}
      <aside className={`vel-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          {/* Brand Header */}
          <div
            className="vel-brand-header"
            style={{ cursor: 'pointer' }}
            onClick={() => handleNavClick('home')}
          >
            <img
              src="/image/mne_logo.png"
              alt="MotionNodeEdits"
              className="vel-brand-logo-img"
            />
            <div>
              <div className="vel-brand-title">MotionNodeEdits</div>
              <div className="vel-brand-sub">Admin Studio Panel</div>
            </div>
          </div>

          {/* Primary Nav */}
          <nav className="vel-nav-list">
            <button
              className={`vel-nav-item ${activeNav === 'home' ? 'active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" />
              <span>Home</span>
            </button>

            <button
              className={`vel-nav-item ${activeNav === 'orders' ? 'active' : ''}`}
              onClick={() => handleNavClick('orders')}
            >
              <Inbox className="h-4 w-4 shrink-0" />
              <span>Current Orders</span>
              {activePipelineOrders.length > 0 && (
                <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.12)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.2)', marginLeft: 'auto', fontWeight: 700 }}>
                  {activePipelineOrders.length}
                </span>
              )}
            </button>

            <button
              className={`vel-nav-item ${activeNav === 'history' ? 'active' : ''}`}
              onClick={() => handleNavClick('history')}
            >
              <Archive className="h-4 w-4 shrink-0" />
              <span>Orders History</span>
              {deliveredHistoryOrders.length > 0 && (
                <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80', marginLeft: 'auto', fontWeight: 700 }}>
                  {deliveredHistoryOrders.length}
                </span>
              )}
            </button>

            <button
              className={`vel-nav-item ${activeNav === 'assign' ? 'active' : ''}`}
              onClick={() => handleNavClick('assign')}
            >
              <UserCheck className="h-4 w-4 shrink-0" />
              <span>Assign Project</span>
            </button>

            <button
              className={`vel-nav-item ${activeNav === 'create' ? 'active' : ''}`}
              onClick={() => handleNavClick('create')}
            >
              <PlusSquare className="h-4 w-4 shrink-0" />
              <span>Order Creation</span>
            </button>

            <button
              className={`vel-nav-item ${activeNav === 'editors' ? 'active' : ''}`}
              onClick={() => { setMgmtTab('editors'); handleNavClick('editors'); }}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Editors</span>
            </button>

            <button
              className={`vel-nav-item ${activeNav === 'clients' ? 'active' : ''}`}
              onClick={() => { setMgmtTab('clients'); handleNavClick('clients'); }}
            >
              <Handshake className="h-4 w-4 shrink-0" />
              <span>Clients</span>
            </button>

            <button
              className={`vel-nav-item ${activeNav === 'approvals' ? 'active' : ''}`}
              onClick={() => handleNavClick('approvals')}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Approvals</span>
              {pendingUsers.length > 0 && (
                <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', marginLeft: 'auto', fontWeight: 700 }}>
                  {pendingUsers.length}
                </span>
              )}
            </button>

            <button
              className={`vel-nav-item ${activeNav === 'contact-requests' ? 'active' : ''}`}
              onClick={() => handleNavClick('contact-requests')}
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span>Contact Requests</span>
              {newContactRequestsCount > 0 && (
                <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.35)', marginLeft: 'auto', fontWeight: 700 }}>
                  {newContactRequestsCount}
                </span>
              )}
            </button>

            <button
              className={`vel-nav-item ${activeNav === 'link-feedback' ? 'active' : ''}`}
              onClick={() => handleNavClick('link-feedback')}
            >
              <MessageSquareQuote className="h-4 w-4 shrink-0" />
              <span>Link Feedback</span>
              {linkFeedbacks.length > 0 && (
                <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', marginLeft: 'auto', fontWeight: 700 }}>
                  {linkFeedbacks.length}
                </span>
              )}
            </button>

            <button
              className={`vel-nav-item ${activeNav === 'cms' ? 'active' : ''}`}
              onClick={() => handleNavClick('cms')}
            >
              <Globe className="h-4 w-4 shrink-0" />
              <span>Website CMS</span>
            </button>
          </nav>
        </div>

        {/* Footer Nav */}
        <div className="vel-nav-footer">
          <button
            className={`vel-nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </button>

          <a href="/admin/login" onClick={handleLogout} className="vel-nav-item" style={{ textDecoration: 'none' }}>
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN VIEWPORT                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="vel-main">
        {/* Top Header Bar */}
        <header className="vel-topbar">
          <div className="vel-topbar-left">
            <button
              className="vel-hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="vel-page-title-top">
              {activeNav === 'cms'
                ? 'Website Content Management (CMS)'
                : activeNav === 'link-feedback'
                ? 'Link Feedback'
                : activeNav === 'contact-requests'
                ? 'Contact Requests'
                : activeNav === 'approvals'
                ? 'User Approvals'
                : activeNav === 'orders'
                ? 'Current Orders'
                : activeNav === 'history'
                ? 'Orders History'
                : activeNav === 'assign'
                ? 'Assign Project'
                : activeNav === 'create'
                ? 'Order Creation'
                : activeNav === 'editors'
                ? 'Editors'
                : activeNav === 'clients'
                ? 'Clients'
                : activeNav === 'settings'
                ? 'Settings'
                : 'Dashboard'}
            </span>
          </div>

          <div className="vel-topbar-right">
            <div className="vel-search-pill">
              <Search className="h-3.5 w-3.5" style={{ position: 'absolute', left: '12px', color: 'var(--vel-text-tertiary)' }} />
              <input
                type="text"
                placeholder={
                  activeNav === 'orders'
                    ? "Search orders, clients, editors..."
                    : activeNav === 'contact-requests'
                    ? "Search inquiries..."
                    : "Search projects, clients..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="vel-search-input"
              />
            </div>





            <div className="vel-user-badge" onClick={() => showToast(`Logged in as ${adminProfile?.full_name || 'Admin'} (Admin)`)}>
              {(() => {
                const avatar = adminProfile?.avatar_url;
                const isBoredStock = avatar && avatar.includes('photo-1534528741775');
                const hasValidCustomAvatar = avatar && !isBoredStock && (avatar.startsWith('http') || avatar.startsWith('/'));
                const initial = (adminProfile?.full_name || adminProfile?.username || 'S').charAt(0).toUpperCase();

                if (hasValidCustomAvatar) {
                  return (
                    <img
                      src={avatar}
                      alt={adminProfile?.full_name || 'Admin'}
                      className="vel-avatar"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  );
                }

                return (
                  <div
                    className="vel-avatar"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #2A2A38 0%, #14141E 100%)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      letterSpacing: '0.02em',
                      border: '1.5px solid rgba(255, 255, 255, 0.22)',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                      flexShrink: 0
                    }}
                  >
                    {initial}
                  </div>
                );
              })()}
              <div className="vel-user-meta">
                <span className="vel-user-name">{adminProfile?.full_name || 'Admin'}</span>
                <span className="vel-user-role">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body with Skeleton Shimmer support */}
        <main className="vel-content">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="vel-skeleton" style={{ height: '32px', width: '220px' }} />
              <div className="vel-skeleton" style={{ height: '18px', width: '340px' }} />
              <div className="vel-metric-grid" style={{ marginTop: '10px' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="vel-skeleton" style={{ height: '140px' }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* ============================================================== */}
              {/* VIEW 1: HOME / OVERVIEW                                        */}
              {/* ============================================================== */}
              {activeNav === 'home' && (
                <AdminOverview
                  pendingUsers={pendingUsers}
                  newContactRequestsCount={newContactRequestsCount}
                  handleNavClick={handleNavClick}
                  metrics={metrics}
                  contactRequests={contactRequests}
                />
              )}

              {/* ============================================================== */}
              {/* VIEWS: ASSIGN & CREATE (AdminEditorManager)                    */}
              {/* ============================================================== */}
              <AdminEditorManager
                activeNav={activeNav}
                setActiveNav={setActiveNav}
                mgmtTab={mgmtTab}
                setMgmtTab={setMgmtTab}
                handleNavClick={handleNavClick}
                orders={orders}
                clientsList={clientsList}
                editorsList={editorsList}
                assignForm={assignForm}
                setAssignForm={setAssignForm}
                handleAssignProjectSubmit={handleAssignProjectSubmit}
                showToast={showToast}
                createForm={createForm}
                setCreateForm={setCreateForm}
                handleCreateOrderSubmit={handleCreateOrderSubmit}
                setShowAddEditorModal={setShowAddEditorModal}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                editorStatusFilter={editorStatusFilter}
                setEditorStatusFilter={setEditorStatusFilter}
                showSortMenu={showSortMenu}
                setShowSortMenu={setShowSortMenu}
                editorSortBy={editorSortBy}
                setEditorSortBy={setEditorSortBy}
                editorCategoryFilter={editorCategoryFilter}
                setEditorCategoryFilter={setEditorCategoryFilter}
                filteredEditors={filteredEditors}
                expandedEditor={expandedEditor}
                setExpandedEditor={setExpandedEditor}
              />

              {/* ============================================================== */}
              {/* VIEWS: CLIENTS, APPROVALS, CONTACTS, FEEDBACK                  */}
              {/* ============================================================== */}
              <AdminClientManager
                activeNav={activeNav}
                setActiveNav={setActiveNav}
                mgmtTab={mgmtTab}
                setMgmtTab={setMgmtTab}
                editorsList={editorsList}
                clientsList={clientsList}
                filteredClients={filteredClients}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setSelectedClientModal={setSelectedClientModal}
                handleUnblockClient={handleUnblockClient}
                handleBlockClient={handleBlockClient}
                handleDeleteClient={handleDeleteClient}
                pendingUsers={pendingUsers}
                approvalsSearch={approvalsSearch}
                setApprovalsSearch={setApprovalsSearch}
                filteredPendingUsers={filteredPendingUsers}
                approvalsActionLoading={approvalsActionLoading}
                handleRejectUser={handleRejectUser}
                handleApproveUser={handleApproveUser}
                fetchContactRequests={fetchContactRequests}
                contactRequestsLoading={contactRequestsLoading}
                newContactRequestsCount={newContactRequestsCount}
                contactRequests={contactRequests}
                contactSearch={contactSearch}
                setContactSearch={setContactSearch}
                contactStatusFilter={contactStatusFilter}
                setContactStatusFilter={setContactStatusFilter}
                contactTypeFilter={contactTypeFilter}
                setContactTypeFilter={setContactTypeFilter}
                filteredContactRequests={filteredContactRequests}
                getWhatsAppUrl={getWhatsAppUrl}
                contactActionLoading={contactActionLoading}
                handleUpdateContactStatus={handleUpdateContactStatus}
                setSelectedContactRequest={setSelectedContactRequest}
                setTempContactNotes={setTempContactNotes}
                handleDeleteContactRequest={handleDeleteContactRequest}
                handleCopyFeedbackLink={handleCopyFeedbackLink}
                isCopiedFeedbackLink={isCopiedFeedbackLink}
                fetchLinkFeedbacks={fetchLinkFeedbacks}
                linkFeedbacksLoading={linkFeedbacksLoading}
                linkFeedbacks={linkFeedbacks}
                avgFeedbackRating={avgFeedbackRating}
                fiveStarFeedbackCount={fiveStarFeedbackCount}
                testimonialConsentCount={testimonialConsentCount}
                feedbackSearch={feedbackSearch}
                setFeedbackSearch={setFeedbackSearch}
                feedbackRatingFilter={feedbackRatingFilter}
                setFeedbackRatingFilter={setFeedbackRatingFilter}
                filteredFeedbacks={filteredFeedbacks}
                handleDeleteFeedback={handleDeleteFeedback}
              />

              {/* ============================================================== */}
              {/* VIEWS: ORDERS PIPELINE & PROJECT HISTORY                       */}
              {/* ============================================================== */}
              <AdminOrdersTable
                activeNav={activeNav}
                activePipelineOrders={activePipelineOrders}
                orders={orders}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                handleNavClick={handleNavClick}
                filteredOrders={filteredOrders}
                selectedOrderId={selectedOrderId}
                setSelectedOrderId={setSelectedOrderId}
                selectedOrder={selectedOrder}
                handleRedirectToAssign={handleRedirectToAssign}
                getDeliveryPerformance={getDeliveryPerformance}
                statusHistoryMap={statusHistoryMap}
                getExpectedDeliveryDate={getExpectedDeliveryDate}
                getOrderAcceptedDate={getOrderAcceptedDate}
                getOrderStageDate={getOrderStageDate}
                safeHref={safeHref}
                showActionToast={showToast}
                handleToggleClientDeliverableAccess={handleToggleClientDeliverableAccess}
                stagedStatusMap={stagedStatusMap}
                handleOrderFieldChange={handleOrderFieldChange}
                handleUpdateStatusExplicitly={handleUpdateStatusExplicitly}
                handleNotifyEditor={handleNotifyEditor}
                handleSaveOrderChanges={handleSaveOrderChanges}
                editorsList={editorsList}
                historyFilter={historyFilter}
                setHistoryFilter={setHistoryFilter}
                historySearch={historySearch}
                setHistorySearch={setHistorySearch}
                adminRatingsMap={adminRatingsMap}
              />

              {/* ============================================================== */}
              {/* VIEWS: STUDIO SETTINGS & WEBSITE CMS                           */}
              {/* ============================================================== */}
              <AdminSettings
                activeNav={activeNav}
                showToast={showToast}
              />
            </>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* ADD NEW EDITOR MODAL                                           */}
      {/* ============================================================== */}
      {showAddEditorModal && (
        <div className="vel-modal-backdrop" onClick={() => setShowAddEditorModal(false)}>
          <div className="vel-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="vel-modal-head">
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>Add New Editor</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--vel-text-secondary)', marginTop: '2px' }}>
                  Register a creator into the MotionNode production studio roster.
                </p>
              </div>
              <button
                onClick={() => setShowAddEditorModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--vel-text-tertiary)', cursor: 'pointer' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewEditorSubmit}>
              <div className="vel-modal-body">
                <div className="vel-field-group">
                  <label className="vel-label">Editor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Lucas Romero"
                    className="vel-input"
                    value={newEditorForm.name}
                    onChange={(e) => setNewEditorForm({ ...newEditorForm, name: e.target.value })}
                  />
                </div>

                <div className="vel-form-grid-2">
                  <div className="vel-field-group">
                    <label className="vel-label">Primary Specialty</label>
                    <select
                      className="vel-select"
                      value={newEditorForm.category}
                      onChange={(e) => {
                        const cat = e.target.value;
                        let role = 'Senior Editor';
                        let tagline = '';
                        let skills = '';
                        if (cat === 'AI Video Editor') {
                          role = 'AI Video Synthesis & Neural VFX Lead';
                          tagline = 'Runway Gen-3, Midjourney v6 & Neural Upscaling';
                          skills = 'Runway Gen-3, Midjourney, Topaz AI, After Effects';
                        } else if (cat === 'Motion Graphics') {
                          role = 'Lead Motion Graphics & 3D Designer';
                          tagline = 'Kinetic Typography, Cinema 4D & Dynamic UI Motion';
                          skills = 'Cinema 4D, After Effects, Premiere Pro, Sound Design';
                        } else if (cat === 'Graphic Designer') {
                          role = 'Senior Graphic Designer & Key Visuals Lead';
                          tagline = 'High-CTR YouTube Thumbnails, Key Visuals & Brand Posters';
                          skills = 'Photoshop, Figma, Midjourney v6, Illustrator';
                        } else if (cat === 'Short-Form Specialist') {
                          role = 'Short-Form & Viral Content Specialist';
                          tagline = 'High-Retention TikToks, Instagram Reels & Hook Mastery';
                          skills = 'CapCut Pro, Retention Pacing, Speed Ramps, Subtitles';
                        } else if (cat === 'Colorist') {
                          role = 'Senior Colorist & Master Finisher';
                          tagline = 'ACES Color Pipelines, 35mm Film Emulation & HDR10';
                          skills = 'DaVinci Resolve Studio, FilmConvert, Dehancer Pro';
                        }
                        setNewEditorForm({ ...newEditorForm, category: cat, role, tagline, skills });
                      }}
                    >
                      <option value="AI Video Editor">AI Video Editor</option>
                      <option value="Motion Graphics">Motion Graphics Designer</option>
                      <option value="Graphic Designer">Graphic Designer</option>
                      <option value="Short-Form Specialist">Short-Form Specialist</option>
                      <option value="Colorist">Colorist</option>
                    </select>
                  </div>

                  <div className="vel-field-group">
                    <label className="vel-label">Max Order Capacity</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="vel-input"
                      value={newEditorForm.maxOrders}
                      onChange={(e) => setNewEditorForm({ ...newEditorForm, maxOrders: e.target.value })}
                    />
                  </div>
                </div>

                <div className="vel-field-group">
                  <label className="vel-label">Professional Role Title</label>
                  <input
                    type="text"
                    className="vel-input"
                    value={newEditorForm.role}
                    onChange={(e) => setNewEditorForm({ ...newEditorForm, role: e.target.value })}
                  />
                </div>

                <div className="vel-field-group">
                  <label className="vel-label">Specialty Tagline Description</label>
                  <input
                    type="text"
                    placeholder="e.g., Runway Gen-3, Midjourney v6 & Neural Upscaling"
                    className="vel-input"
                    value={newEditorForm.tagline}
                    onChange={(e) => setNewEditorForm({ ...newEditorForm, tagline: e.target.value })}
                  />
                </div>

                <div className="vel-field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="vel-label">Key Skills & Tooling (Comma Separated)</label>
                    <span style={{ fontSize: '0.65rem', color: 'var(--vel-text-tertiary)' }}>Tools</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Runway Gen-3, Midjourney, After Effects, Topaz AI"
                    className="vel-input"
                    value={newEditorForm.skills}
                    onChange={(e) => setNewEditorForm({ ...newEditorForm, skills: e.target.value })}
                  />
                </div>

                <div className="vel-field-group">
                  <label className="vel-label">Status</label>
                  <select
                    className="vel-select"
                    value={newEditorForm.status}
                    onChange={(e) => setNewEditorForm({ ...newEditorForm, status: e.target.value })}
                  >
                    <option value="AVAILABLE">AVAILABLE (Accepting Projects)</option>
                    <option value="AT CAPACITY">AT CAPACITY (Busy)</option>
                  </select>
                </div>
              </div>

              <div className="vel-modal-foot">
                <button
                  type="button"
                  className="vel-btn-outline"
                  onClick={() => setShowAddEditorModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="vel-btn-solid">
                  <Plus className="h-4 w-4" />
                  <span>Register Editor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW CONTACT REQUEST DETAILS & NOTES MODAL                     */}
      {/* ============================================================== */}
      {selectedContactRequest && (
        <div className="vel-modal-backdrop" onClick={() => setSelectedContactRequest(null)}>
          <div className="vel-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="vel-modal-head">
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Contact Request Details
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--vel-text-secondary)', marginTop: '2px' }}>
                  Submitted on {selectedContactRequest.created_at ? new Date(selectedContactRequest.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                </p>
              </div>
              <button
                onClick={() => setSelectedContactRequest(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--vel-text-tertiary)', cursor: 'pointer' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="vel-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Contact Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="vel-field-group">
                  <label className="vel-label">Client Name</label>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF' }}>{selectedContactRequest.name}</div>
                </div>

                <div className="vel-field-group">
                  <label className="vel-label">Project Type</label>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#C084FC' }}>
                    {PROJECT_TYPE_LABELS[selectedContactRequest.project_type] || selectedContactRequest.project_type}
                  </div>
                </div>

                <div className="vel-field-group">
                  <label className="vel-label">Email Address</label>
                  <a href={`mailto:${selectedContactRequest.email}`} style={{ fontSize: '0.85rem', color: '#FFFFFF', textDecoration: 'none' }}>
                    {selectedContactRequest.email}
                  </a>
                </div>

                <div className="vel-field-group">
                  <label className="vel-label">Phone Number</label>
                  <div style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>
                    {selectedContactRequest.phone || 'Not provided'}
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div className="vel-field-group">
                <label className="vel-label">Inquiry Status</label>
                <select
                  value={selectedContactRequest.status || 'new'}
                  onChange={(e) => handleUpdateContactStatus(selectedContactRequest.id, e.target.value)}
                  className="vel-select"
                >
                  <option value="new">New (Uncontacted)</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_discussion">In Discussion</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Full Project Details */}
              <div className="vel-field-group">
                <label className="vel-label">Project Details / Message</label>
                <div style={{
                  background: 'var(--vel-bg-input)',
                  border: '1px solid var(--vel-border)',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  color: '#FFFFFF',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}>
                  {selectedContactRequest.message}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div className="vel-field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="vel-label" style={{ margin: 0 }}>Internal Admin Notes</label>
                  <span style={{ fontSize: '0.68rem', color: 'var(--vel-text-tertiary)' }}>Private to admin team</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Add notes about pricing discussed, follow-up timeline, client preferences..."
                  className="vel-input"
                  style={{ resize: 'vertical' }}
                  value={tempContactNotes}
                  onChange={(e) => setTempContactNotes(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    disabled={isSavingNotes}
                    onClick={() => handleSaveContactNotes(selectedContactRequest.id)}
                    className="vel-btn-outline"
                    style={{ fontSize: '0.76rem', padding: '4px 12px' }}
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="vel-modal-foot">
              <div style={{ display: 'flex', gap: '8px' }}>
                {getWhatsAppUrl(selectedContactRequest.phone, selectedContactRequest.name, selectedContactRequest.project_type) && (
                  <a
                    href={getWhatsAppUrl(selectedContactRequest.phone, selectedContactRequest.name, selectedContactRequest.project_type)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vel-btn-solid"
                    style={{ background: '#25D366', borderColor: '#25D366', color: '#000000', textDecoration: 'none', fontSize: '0.8rem' }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </a>
                )}
                <a
                  href={`mailto:${selectedContactRequest.email}`}
                  className="vel-btn-outline"
                  style={{ textDecoration: 'none', fontSize: '0.8rem' }}
                >
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </a>
              </div>

              <button
                type="button"
                className="vel-btn-outline"
                onClick={() => setSelectedContactRequest(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CLIENT DETAILS & NAME HISTORY MODAL                            */}
      {/* ============================================================== */}
      {selectedClientModal && (
        <div className="vel-modal-backdrop" onClick={() => setSelectedClientModal(null)}>
          <div
            className="vel-modal"
            style={{ maxWidth: '580px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vel-modal-head">
              <div>
                <h3 className="vel-modal-title">Client Account Details</h3>
                <p className="vel-subtext" style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                  Complete identity, contact, and name modification history.
                </p>
              </div>
              <button
                type="button"
                className="vel-icon-btn"
                onClick={() => setSelectedClientModal(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="vel-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Profile Overview Header Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid var(--vel-border)' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  background: '#181824',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#FFFFFF'
                }}>
                  {selectedClientModal.name ? selectedClientModal.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {selectedClientModal.name}
                    </h4>
                    {selectedClientModal.isGoogle && (
                      <span style={{ fontSize: '0.66rem', padding: '2px 7px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.18)', fontWeight: 600 }}>
                        Google Auth
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.66rem',
                      padding: '2px 7px',
                      borderRadius: '6px',
                      background: selectedClientModal.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.12)',
                      color: selectedClientModal.status === 'rejected' ? '#F87171' : '#4ADE80',
                      border: selectedClientModal.status === 'rejected' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.25)',
                      fontWeight: 600
                    }}>
                      {selectedClientModal.status === 'rejected' ? 'Suspended / Blocked' : 'Active Client'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--vel-text-secondary)', marginTop: '3px', margin: 0 }}>
                    User ID: <span style={{ fontFamily: 'monospace', fontSize: '0.74rem' }}>{selectedClientModal.id}</span>
                  </p>
                </div>
              </div>

              {/* Name Change Notice if client previously altered their name */}
              {selectedClientModal.previous_name && (
                <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FACC15' }}>
                      ● Client Name Modification Detected
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#E2E8F0', marginTop: '4px', margin: 0 }}>
                    This client previously registered under the name: <strong style={{ color: '#FDE047' }}>{selectedClientModal.previous_name}</strong>
                  </p>
                </div>
              )}

              {/* Details Key-Value Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Current Display Name
                  </label>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF', marginTop: '3px' }}>
                    {selectedClientModal.name || 'Not provided'}
                  </div>
                </div>

                <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Previous Name (Old Name)
                  </label>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: selectedClientModal.previous_name ? '#FACC15' : 'var(--vel-text-tertiary)', marginTop: '3px' }}>
                    {selectedClientModal.previous_name ? selectedClientModal.previous_name : 'No previous name (never changed)'}
                  </div>
                </div>

                <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Company / Brand
                  </label>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF', marginTop: '3px' }}>
                    {selectedClientModal.company_name || 'Not provided'}
                  </div>
                </div>

                <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Phone Number
                  </label>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: selectedClientModal.phone ? '#34D399' : 'var(--vel-text-tertiary)', marginTop: '3px' }}>
                    {selectedClientModal.phone || 'Not provided'}
                  </div>
                </div>

                <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Email Address
                  </label>
                  <div style={{ fontSize: '0.86rem', color: '#FFFFFF', marginTop: '3px', wordBreak: 'break-all' }}>
                    {selectedClientModal.email}
                  </div>
                </div>

                <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Registered On
                  </label>
                  <div style={{ fontSize: '0.84rem', color: '#FFFFFF', marginTop: '3px' }}>
                    {selectedClientModal.created_at ? new Date(selectedClientModal.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="vel-modal-foot">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedClientModal.phone && (
                  <a
                    href={`https://wa.me/${selectedClientModal.phone.replace(/[^\\d+]/g, '').replace(/^0+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vel-btn-solid"
                    style={{ background: '#25D366', borderColor: '#25D366', color: '#000000', textDecoration: 'none', fontSize: '0.8rem' }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {selectedClientModal.email && (
                  <a
                    href={`mailto:${selectedClientModal.email}`}
                    className="vel-btn-outline"
                    style={{ textDecoration: 'none', fontSize: '0.8rem' }}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Send Email</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                className="vel-btn-outline"
                onClick={() => setSelectedClientModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
