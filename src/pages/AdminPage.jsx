import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Menu,
  X,
  Archive,
  ShieldCheck,
  Mail,
  Globe,
  MessageSquareQuote,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { checkRouteAuth } from '../lib/middleware/authGuard';
import NotificationDrawer from '../components/Admin/NotificationDrawer';
import AdminOverview from '../components/Admin/AdminOverview';
import AdminOrdersTable from '../components/Admin/AdminOrdersTable';
import AdminClientManager from '../components/Admin/AdminClientManager';
import AdminEditorManager from '../components/Admin/AdminEditorManager';
import AdminSettings from '../components/Admin/AdminSettings';
import AdminLoginDevices from '../components/Admin/AdminLoginDevices';
import AddEditorModal from '../components/Admin/modals/AddEditorModal';
import ContactRequestModal from '../components/Admin/modals/ContactRequestModal';
import ClientDetailsModal from '../components/Admin/modals/ClientDetailsModal';
import {
  safeHref,
  safeIsoDate,
  stripVisibilityTag,
  parseEditorRequirements,
  parseCustomSection,
  stripCustomTags,
  preserveMetaTags,
  parseNotesVisibility,
  transformOrder,
  getExpectedDeliveryDate,
  DEFAULT_STUDIO_EDITORS,
  transformEditor,
  transformClient,
  getWhatsAppUrl,
  getOrderAcceptedDate,
  getDeliveryPerformance,
  getOrderStageDate
} from '../components/Admin/adminHelpers';
import { clearStoredDeviceToken } from '../lib/auth/deviceManager';

import { supabase } from '../supabaseClient';
import { getAdminAllOrders, getAdminOrderCounts, createOrder, updateOrder, updateOrderStatus, cancelOrder, assignEditorToOrder, getEditorActiveOrderCounts, generateOrderCode, STATUS_MAP, UI_TO_DB_STATUS, UI_TO_VIDEO_TYPE } from '../lib/db/orders';
import { getApprovedEditors, getAllClientsForAdmin, getPendingProfiles, updateProfileStatus, blockClient, unblockClient, deleteClient } from '../lib/db/profiles';
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendNotification } from '../lib/db/notifications';
import { getEditorRatingStats, getAllDeliveredOrdersRatingsMap } from '../lib/db/ratings';
import { getContactRequests, updateContactRequestStatus, updateContactRequestNotes, deleteContactRequest, STATUS_CONFIG as CONTACT_STATUS_CONFIG } from '../lib/db/contactRequests';
import { getLinkFeedbacks, deleteLinkFeedback } from '../lib/db/linkFeedback';
import { subscribeToOrders, subscribeToProfiles, subscribeToUserNotifications, subscribeToContactRequests, unsubscribeChannel } from '../lib/supabase/realtime';
import './admin.css';


export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr || !session || !session.user) {
          window.location.href = '/admin/login';
          return;
        }

        const { authorized, profile } = await checkRouteAuth({
          requiredRole: 'admin',
          redirectOnFail: '/admin/login',
        });
        if (isMounted && authorized && profile) {
          setIsAuthenticated(true);
          setAdminProfile(profile);
        }
      } catch (err) {
        console.error('[AdminPage] Auth verification error:', err);
        window.location.href = '/admin/login';
      }
    }
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.location.href = '/admin/login';
      }
    });

    return () => {
      isMounted = false;
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
      clearStoredDeviceToken();
    }
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  const [activeNav, setActiveNav] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mgmtTab, setMgmtTab] = useState('editors');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // ─── Live Data State ──────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
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

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!adminProfile) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await markAllNotificationsAsRead(adminProfile.id);
    showToast('All notifications marked as read.');
  };

  const handleMarkNotificationRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    await markNotificationAsRead(notifId);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleNavClick = (nav) => {
    if (nav !== activeNav) {
      setActiveNav(nav);
      if (nav === 'link-feedback') {
        setIsLoading(true);
        fetchLinkFeedbacks().finally(() => setIsLoading(false));
      }
    }
    setSidebarOpen(false);
  };

  // ─── Data Fetching ────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const { data, error } = await getAdminAllOrders();
    if (!error && data) {
      // Authoritative database records: browser storage must never override database truth
      const transformed = data.map(dbOrder => transformOrder(dbOrder));
      ordersRef.current = transformed;
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
      const currentOrders = ordersRef.current || [];
      currentOrders.forEach(o => {
        if (o.clientId && o.dbStatus !== 'delivered') {
          orderCounts[o.clientId] = (orderCounts[o.clientId] || 0) + 1;
        }
      });
      setClientsList(data.map(cl => transformClient(cl, orderCounts[cl.id] || 0)));
    }
  }, []);

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
    let isMounted = true;

    // Safety timeout: ensure dashboard displays within 2.5s even if an API is slow
    const safetyTimer = setTimeout(() => {
      if (isMounted) setDataLoaded(true);
    }, 2500);

    async function loadAll() {
      try {
        await Promise.allSettled([
          fetchOrders(),
          fetchEditors(),
          fetchMetrics(),
          fetchPendingUsers(),
          fetchContactRequests(),
          fetchLinkFeedbacks(),
          fetchClients(),
        ]);
        if (adminProfile) {
          await fetchNotifications();
        }
      } catch (err) {
        console.warn('[AdminPage] Initial data load warning:', err);
      } finally {
        if (isMounted) {
          setDataLoaded(true);
          clearTimeout(safetyTimer);
        }
      }
    }
    loadAll();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [isAuthenticated, adminProfile, fetchOrders, fetchEditors, fetchMetrics, fetchPendingUsers, fetchContactRequests, fetchLinkFeedbacks, fetchClients, fetchNotifications]);

  // ─── Realtime Subscriptions (Stable & Persistent) ─────────────────
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
  }, [isAuthenticated]);

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

  // Active pipeline orders (excluding completed/delivered and cancelled) vs Delivered
  const activePipelineOrders = orders.filter(o => o.dbStatus !== 'delivered' && o.dbStatus !== 'cancelled');
  const deliveredHistoryOrders = orders.filter(o => o.dbStatus === 'delivered');

  // Cancel Order Modal State (Admin Exclusive)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

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
      const activeList = orders.filter(o => o.dbStatus !== 'delivered' && o.dbStatus !== 'cancelled');
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

  const handleGetOrderStageDate = (order, statusKey, stepIndex) =>
    getOrderStageDate(order, statusKey, stepIndex, statusHistoryMap);

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
    editorRequirements: '',
    hasCustomSection: false,
    customSectionTitle: '',
    customSectionContent: '',
    rawFootageLink: '',
    brandAssetsLink: '',
    internalDeadline: '',
    clientDeadline: '',
    currency: 'INR',
    totalAmount: '',
    advancePaid: '',
    duration: '1 min',
    clientLocation: '',
    selectedProjectId: ''
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

  // ─── Order Cancellation Handlers (Admin Only) ──────────────────────
  const handleOpenCancelModal = (order) => {
    const target = order || selectedOrder || (activeNav === 'orders' ? activePipelineOrders[0] : orders[0]);
    if (!target) return;
    const role = String(adminProfile?.role || '').toLowerCase();
    if (!isAuthenticated && role !== 'admin') {
      showToast('Unauthorized: Only studio administrators can cancel orders.');
      return;
    }
    setOrderToCancel(target);
    setCancelReason('');
    setCancelReasonError('');
    setIsCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    if (isCancelling) return;
    setIsCancelModalOpen(false);
    setOrderToCancel(null);
    setCancelReason('');
    setCancelReasonError('');
  };

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;
    const role = String(adminProfile?.role || '').toLowerCase();
    if (!isAuthenticated && role !== 'admin') {
      showToast('Unauthorized: Only studio administrators can cancel orders.');
      setIsCancelModalOpen(false);
      return;
    }

    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      setCancelReasonError('Please provide a description / reason for cancelling this order.');
      return;
    }

    setIsCancelling(true);
    try {
      const targetId = orderToCancel.id;
      const { error } = await cancelOrder(
        targetId,
        adminProfile.id,
        trimmedReason,
        orderToCancel.notes || orderToCancel.rawAdminNotes
      );

      if (error) {
        console.warn('Cancel order warning:', error);
      }

      // Persist in localStorage backup map
      try {
        const localCancelled = new Map(JSON.parse(localStorage.getItem('mne_cancelled_order_map') || '[]'));
        localCancelled.set(targetId, {
          reason: trimmedReason,
          cancelledAt: new Date().toISOString(),
          adminId: adminProfile.id,
        });
        localStorage.setItem('mne_cancelled_order_map', JSON.stringify([...localCancelled.entries()]));

        // Clear completed cache for this order if present
        const localCompleted = new Set(JSON.parse(localStorage.getItem('mne_completed_order_ids') || '[]'));
        localCompleted.delete(targetId);
        localStorage.setItem('mne_completed_order_ids', JSON.stringify([...localCompleted]));
      } catch {}

      // Update React state
      setOrders(prev => prev.map(o => {
        if (o.id === targetId) {
          return {
            ...o,
            status: 'CANCELLED',
            dbStatus: 'cancelled',
            badgeClass: 'vel-badge-cancelled',
            currentStep: -1,
            cancellationReason: trimmedReason,
            cancelledAt: new Date().toISOString(),
          };
        }
        return o;
      }));

      // Clear any staged status for this order
      setStagedStatusMap(prev => {
        const copy = { ...prev };
        delete copy[targetId];
        return copy;
      });

      // Send notifications to client and editor
      if (orderToCancel.clientId) {
        try {
          await sendNotification(
            orderToCancel.clientId,
            `Order Cancelled: ${orderToCancel.title}`,
            `Your order "${orderToCancel.title}" was cancelled by Admin. Reason: ${trimmedReason}`
          );
        } catch (_) {}
      }

      if (orderToCancel.editorId) {
        try {
          await sendNotification(
            orderToCancel.editorId,
            `Order Cancelled: ${orderToCancel.title}`,
            `Project "${orderToCancel.title}" was cancelled by Admin. Reason: ${trimmedReason}`
          );
        } catch (_) {}
      }

      // Cross-tab broadcast
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('mne-order-updates');
          bc.postMessage({ type: 'ORDER_CANCELLED', orderId: targetId });
          bc.close();
        }
      } catch {}

      showToast(`Order "${orderToCancel.title}" cancelled successfully. Reason recorded.`);
      setIsCancelModalOpen(false);
      setOrderToCancel(null);
      setCancelReason('');

      // Auto-select next active order if cancelled was selected
      const nextActive = orders.filter(o => o.id !== targetId && o.dbStatus !== 'delivered' && o.dbStatus !== 'cancelled');
      if (nextActive.length > 0) {
        setSelectedOrderId(nextActive[0].id);
      }

      await fetchOrders();
    } catch (err) {
      console.error('Cancellation failed:', err);
      showToast('Failed to cancel order: ' + (err.message || 'Unknown error'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdateStatusExplicitly = async (statusVal) => {
    const targetId = selectedOrderId || selectedOrder.id || orders[0]?.id;
    if (!targetId) {
      showToast('No order selected.');
      return;
    }

    const order = orders.find(o => o.id === targetId) || selectedOrder;

    // If cancelled is chosen, strictly route to cancellation modal to require description
    if (statusVal === 'CANCELLED' || statusVal === 'cancelled') {
      handleOpenCancelModal(order);
      return;
    }

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
      if (chosenStatus === 'CANCELLED' || chosenStatus === 'cancelled') {
        setIsLoading(false);
        handleOpenCancelModal(order);
        return;
      }
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
      const cleanNotes = stripCustomTags(stripVisibilityTag(order.notes));
      const tag = `[CLIENT_DELIVERABLE_VISIBLE:${order.clientLinkVisible ? 'true' : 'false'}]`;
      const notesWithTag = preserveMetaTags(order.rawAdminNotes, cleanNotes, tag);

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
    const order = orders.find(o => o.id === (selectedOrderId || selectedOrder?.id));
    if (!order) return;

    const targetId = order.id;
    const newVisibility = !order.clientLinkVisible;
    const cleanNotes = stripVisibilityTag(order.notes);
    const tag = `[CLIENT_DELIVERABLE_VISIBLE:${newVisibility ? 'true' : 'false'}]`;
    const updatedNotes = cleanNotes ? `${cleanNotes} ${tag}` : tag;

    // 1. Optimistic update
    setOrders(prev => prev.map(o => {
      if (o.id === targetId) {
        return {
          ...o,
          clientLinkVisible: newVisibility,
          notes: cleanNotes
        };
      }
      return o;
    }));

    // LocalStorage cross-tab sync
    try {
      const visibleMap = JSON.parse(localStorage.getItem('mne_client_visible_orders') || '{}');
      visibleMap[targetId] = newVisibility;
      localStorage.setItem('mne_client_visible_orders', JSON.stringify(visibleMap));
    } catch (e) {}

    // Broadcast across browser tabs immediately
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('mne-order-updates');
        bc.postMessage({
          type: 'ORDER_VISIBILITY_UPDATED',
          orderId: order.dbId || targetId,
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
      let res = await updateOrder(order.dbId || targetId, {
        client_link_visible: newVisibility,
        admin_notes: updatedNotes,
      });

      // Fallback: if client_link_visible column doesn't exist yet or update had error, update admin_notes
      if (res.error) {
        res = await updateOrder(order.dbId || targetId, {
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
    if (!createForm.nomenclature || !createForm.nomenclature.trim()) {
      showToast('Please enter a project name.');
      return;
    }

    // Find the selected client
    const selectedClient = clientsList.find(cl =>
      cl.name === createForm.existingClient || cl.company === createForm.existingClient
    );

    if (!selectedClient) {
      showToast('Please select a client from Available Clients.');
      return;
    }

    const videoType = UI_TO_VIDEO_TYPE[createForm.format] || 'youtube_longform';
    const orderCode = generateOrderCode();

    // Compile admin notes with tags for Editor's Requirements and Custom Section
    let compiledNotes = '';
    if (createForm.editorRequirements && createForm.editorRequirements.trim()) {
      compiledNotes += `[EDITOR_REQUIREMENTS:${encodeURIComponent(createForm.editorRequirements.trim())}] `;
    }
    if (createForm.hasCustomSection) {
      if (createForm.customSectionTitle && createForm.customSectionTitle.trim()) {
        compiledNotes += `[CUSTOM_SECTION_TITLE:${encodeURIComponent(createForm.customSectionTitle.trim())}] `;
      }
      if (createForm.customSectionContent && createForm.customSectionContent.trim()) {
        compiledNotes += `[CUSTOM_SECTION_CONTENT:${encodeURIComponent(createForm.customSectionContent.trim())}] `;
      }
    }
    if (createForm.currency) {
      compiledNotes += `[INVOICE_CURRENCY:${encodeURIComponent(createForm.currency)}] `;
    }
    if (createForm.totalAmount) {
      compiledNotes += `[INVOICE_TOTAL:${encodeURIComponent(createForm.totalAmount.trim())}] `;
    }
    if (createForm.advancePaid) {
      compiledNotes += `[INVOICE_ADVANCE:${encodeURIComponent(createForm.advancePaid.trim())}] `;
    }
    if (createForm.duration) {
      compiledNotes += `[INVOICE_DURATION:${encodeURIComponent(createForm.duration.trim())}] `;
    }
    if (createForm.clientLocation) {
      compiledNotes += `[INVOICE_LOCATION:${encodeURIComponent(createForm.clientLocation.trim())}] `;
    }

    const payload = {
      order_name: createForm.nomenclature.trim(),
      order_code: orderCode,
      video_type: videoType,
      brief: createForm.brief || '',
      admin_notes: compiledNotes.trim() || null,
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
      nomenclature: '',
      format: 'YouTube Longform (16:9)',
      brief: '',
      editorRequirements: '',
      hasCustomSection: false,
      customSectionTitle: '',
      customSectionContent: '',
      rawFootageLink: '',
      brandAssetsLink: '',
      internalDeadline: '',
      clientDeadline: '',
      currency: 'INR',
      totalAmount: '',
      advancePaid: '',
      duration: '1 min',
      clientLocation: '',
      selectedProjectId: ''
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
    const q = searchQuery.toLowerCase().trim();
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    if (!q) {
      return matchesStatus;
    }
    const title = (o.title || '').toLowerCase();
    const client = (o.client || o.client_name || '').toLowerCase();
    const clientEmail = (o.client_email || '').toLowerCase();
    const id = (o.id || '').toLowerCase();
    const displayId = (o.displayId || '').toLowerCase();
    const orderCode = (o.order_code || '').toLowerCase();
    const editorName = (o.editor?.name || o.editor_name || '').toLowerCase();
    const type = (o.type || '').toLowerCase();

    const matchesSearch =
      title.includes(q) ||
      client.includes(q) ||
      clientEmail.includes(q) ||
      id.includes(q) ||
      displayId.includes(q) ||
      orderCode.includes(q) ||
      editorName.includes(q) ||
      type.includes(q);

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

  if (!isAuthenticated || !dataLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#08080C',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(192, 132, 252, 0.2)',
          borderTopColor: '#C084FC',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{
          color: '#8E8EA0',
          fontSize: '0.85rem',
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          {!isAuthenticated ? 'Verifying Admin Credentials...' : 'Loading Studio Workspace...'}
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="vel-admin-layout">
      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
        onMarkRead={handleMarkNotificationRead}
      />

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
            className={`vel-nav-item ${activeNav === 'devices' ? 'active' : ''}`}
            onClick={() => handleNavClick('devices')}
          >
            <Laptop className="h-4 w-4 shrink-0" />
            <span>Login Devices</span>
          </button>

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
                : activeNav === 'devices'
                ? 'Login Devices'
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
                    : activeNav === 'history'
                    ? "Search order history..."
                    : "Search projects, clients..."
                }
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (activeNav === 'history') setHistorySearch(val);
                  if (activeNav === 'contact-requests') setContactSearch(val);
                  if (activeNav === 'link-feedback') setFeedbackSearch(val);
                }}
                className="vel-search-input"
              />
            </div>

            {/* Notification Bell Button */}
            <button
              type="button"
              className="vel-notif-btn"
              onClick={() => setIsNotifOpen(prev => !prev)}
              aria-label={`Notifications (${unreadCount} unread)`}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="vel-notif-badge-pill">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>





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
                  orders={orders}
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
                getOrderStageDate={handleGetOrderStageDate}
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
                adminProfile={adminProfile}
                handleOpenCancelModal={handleOpenCancelModal}
                isCancelModalOpen={isCancelModalOpen}
                orderToCancel={orderToCancel}
                cancelReason={cancelReason}
                setCancelReason={setCancelReason}
                cancelReasonError={cancelReasonError}
                setCancelReasonError={setCancelReasonError}
                isCancelling={isCancelling}
                handleCloseCancelModal={handleCloseCancelModal}
                handleConfirmCancelOrder={handleConfirmCancelOrder}
              />

              {/* ============================================================== */}
              {/* VIEWS: STUDIO SETTINGS & WEBSITE CMS                           */}
              {/* ============================================================== */}
              <AdminSettings
                activeNav={activeNav}
                showToast={showToast}
              />

              {/* ============================================================== */}
              {/* VIEW: LOGIN DEVICES MANAGEMENT                                 */}
              {/* ============================================================== */}
              {activeNav === 'devices' && (
                <AdminLoginDevices showToast={showToast} />
              )}
            </>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODALS                                                         */}
      {/* ============================================================== */}
      <AddEditorModal
        showAddEditorModal={showAddEditorModal}
        setShowAddEditorModal={setShowAddEditorModal}
        handleAddNewEditorSubmit={handleAddNewEditorSubmit}
        newEditorForm={newEditorForm}
        setNewEditorForm={setNewEditorForm}
      />

      <ContactRequestModal
        selectedContactRequest={selectedContactRequest}
        setSelectedContactRequest={setSelectedContactRequest}
        handleUpdateContactStatus={handleUpdateContactStatus}
        tempContactNotes={tempContactNotes}
        setTempContactNotes={setTempContactNotes}
        isSavingNotes={isSavingNotes}
        handleSaveContactNotes={handleSaveContactNotes}
        getWhatsAppUrl={getWhatsAppUrl}
      />

      <ClientDetailsModal
        selectedClientModal={selectedClientModal}
        setSelectedClientModal={setSelectedClientModal}
      />
    </div>
  );
}
