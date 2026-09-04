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
  Quote
} from 'lucide-react';
import CustomCursor from '../components/CustomCursor';
import { supabase } from '../supabaseClient';
import { getAdminAllOrders, getAdminOrderCounts, createOrder, updateOrder, updateOrderStatus, assignEditorToOrder, getEditorActiveOrderCounts, getUnassignedOrders, generateOrderCode, formatOrderCode, stripOrderCodeTag, STATUS_MAP, VIDEO_TYPE_MAP, UI_TO_DB_STATUS, UI_TO_VIDEO_TYPE } from '../lib/db/orders';
import { getProfile, getApprovedEditors, getApprovedClients } from '../lib/db/profiles';
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendNotification, formatNotificationTime } from '../lib/db/notifications';
import { getEditorRatingStats, getAllDeliveredOrdersRatingsMap } from '../lib/db/ratings';
import { subscribeToOrders, subscribeToProfiles, subscribeToUserNotifications, unsubscribeChannel } from '../lib/supabase/realtime';
import './admin.css';

// ─── Helpers ────────────────────────────────────────────────────────
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

/** Transform editor profile + stats into shape the UI expects. */
function transformEditor(profile, activeCount = 0, avgRating = 0) {
  const maxOrders = 5; // default capacity
  const isAtCapacity = activeCount >= maxOrders;
  return {
    id: profile.id,
    name: profile.full_name,
    avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    status: isAtCapacity ? 'AT CAPACITY' : 'AVAILABLE',
    statusColor: isAtCapacity ? '#F59E0B' : '#22C55E',
    activeOrders: activeCount,
    maxOrders,
    category: profile.editor_title || 'Video Editor',
    role: profile.editor_title || 'Video Editor',
    tagline: profile.editor_title || 'Professional Video Editor',
    skills: [], // Skills not stored in profiles table currently
    rating: avgRating || 0,
  };
}

/** Transform client profile into shape the UI expects. */
function transformClient(profile, activeCount = 0) {
  return {
    id: profile.id,
    name: profile.company_name || profile.full_name,
    tier: 'Client',
    activeProjects: activeCount,
    spend: '—',
    contact: profile.full_name,
  };
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
      } else {
        setIsAuthenticated(true);
        // Fetch admin profile
        const { data: profile } = await getProfile(session.user.id);
        if (profile) {
          setAdminProfile(profile);
        }
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
  const [mgmtTab, setMgmtTab] = useState('editors');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  // ─── Live Data State ──────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminRatingsMap, setAdminRatingsMap] = useState({});
  const [historySearch, setHistorySearch] = useState('');
  const [editorsList, setEditorsList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [metrics, setMetrics] = useState({
    activeOrders: 0, acceptedOrders: 0, completedThisWeek: 0,
    pendingOrders: 0, withEditorOrders: 0, readyForDelivery: 0,
  });
  const [dataLoaded, setDataLoaded] = useState(false);

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
    const [editorsRes, orderCounts] = await Promise.all([
      getApprovedEditors(),
      getEditorActiveOrderCounts(),
    ]);
    if (!editorsRes.error && editorsRes.data) {
      // Fetch ratings for each editor
      const editorsWithStats = await Promise.all(
        editorsRes.data.map(async (ed) => {
          const { average } = await getEditorRatingStats(ed.id);
          return transformEditor(ed, orderCounts[ed.id] || 0, average);
        })
      );
      setEditorsList(editorsWithStats);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    const { data, error } = await getApprovedClients();
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

  const fetchMetrics = useCallback(async () => {
    const counts = await getAdminOrderCounts();
    setMetrics(counts);
  }, []);

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
      await Promise.all([fetchOrders(), fetchEditors(), fetchMetrics()]);
      setDataLoaded(true);
    }
    loadAll();
  }, [isAuthenticated, fetchOrders, fetchEditors, fetchMetrics]);

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
      onInsert: () => { fetchClients(); fetchEditors(); },
      onUpdate: () => { fetchClients(); fetchEditors(); },
      onDelete: () => { fetchClients(); fetchEditors(); },
    });

    return () => {
      unsubscribeChannel(ordersChannel);
      unsubscribeChannel(profilesChannel);
    };
  }, [isAuthenticated, fetchOrders, fetchMetrics, fetchEditors, fetchClients]);

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

    const { data, error } = await createOrder(payload);
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

      if (error) {
        showToast('Error assigning: ' + error.message);
        return;
      }

      // Notify the editor
      if (assignForm.notifyEditor && assignForm.editorId) {
        await sendNotification(
          assignForm.editorId,
          `New project assigned: ${assignForm.project}`,
          `You have been assigned to "${assignForm.project}". Editor Deadline: ${assignForm.internalDeadline}. Please review the brief.`
        );
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

  const handleAddNewEditorSubmit = (e) => {
    e.preventDefault();
    if (!newEditorForm.name.trim()) {
      showToast('Please enter editor name.');
      return;
    }

    // Editors must sign up via the login page — this just adds to local display
    const skillsArray = typeof newEditorForm.skills === 'string'
      ? newEditorForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      : newEditorForm.skills;

    const newEd = {
      id: Date.now(),
      name: newEditorForm.name,
      avatar: newEditorForm.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      status: newEditorForm.status,
      statusColor: newEditorForm.status === 'AVAILABLE' ? '#22C55E' : '#F59E0B',
      activeOrders: 0,
      maxOrders: Number(newEditorForm.maxOrders) || 5,
      category: newEditorForm.category,
      role: newEditorForm.role,
      tagline: newEditorForm.tagline || `${newEditorForm.category} Specialist`,
      skills: skillsArray.length ? skillsArray : ['AI Video', 'After Effects', 'Colorist'],
      rating: 5.0
    };

    setEditorsList(prev => [newEd, ...prev]);
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
    const matchesSearch = !q ||
      ed.name.toLowerCase().includes(q) ||
      ed.role.toLowerCase().includes(q) ||
      (ed.tagline && ed.tagline.toLowerCase().includes(q)) ||
      (ed.category && ed.category.toLowerCase().includes(q)) ||
      ed.skills.some(s => s.toLowerCase().includes(q));

    const matchesCategory = editorCategoryFilter === 'ALL' || ed.category === editorCategoryFilter;
    const matchesStatus = editorStatusFilter === 'ALL' || ed.status === editorStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (editorSortBy === 'workload-asc') return (a.activeOrders / a.maxOrders) - (b.activeOrders / b.maxOrders);
    if (editorSortBy === 'workload-desc') return (b.activeOrders / b.maxOrders) - (a.activeOrders / a.maxOrders);
    if (editorSortBy === 'rating') return (b.rating || 4.8) - (a.rating || 4.8);
    if (editorSortBy === 'name-asc') return a.name.localeCompare(b.name);
    return 0;
  });

  const filteredClients = clientsList.filter(cl => {
    const q = searchQuery.toLowerCase().trim();
    return !q ||
      cl.name.toLowerCase().includes(q) ||
      cl.contact.toLowerCase().includes(q) ||
      cl.tier.toLowerCase().includes(q);
  });

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
                <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', marginLeft: 'auto', fontWeight: 700 }}>
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

          <a href="/login" onClick={handleLogout} className="vel-nav-item" style={{ textDecoration: 'none' }}>
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
            <span className="vel-page-title-top">Dashboard</span>
          </div>

          <div className="vel-topbar-right">
            <div className="vel-search-pill">
              <Search className="h-3.5 w-3.5" style={{ position: 'absolute', left: '12px', color: 'var(--vel-text-tertiary)' }} />
              <input
                type="text"
                placeholder={activeNav === 'orders' ? "Search orders, clients, edi..." : "Search projects, clients..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="vel-search-input"
              />
            </div>

            <div className="notif-wrapper">
              <button
                className={`vel-icon-btn ${notifOpen ? 'active' : ''}`}
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
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`notif-item ${!item.is_read ? 'unread' : ''}`}
                        onClick={async () => {
                          setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
                          await markNotificationAsRead(item.id);
                          setNotifOpen(false);
                          handleNavClick('orders');
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
                    ))}
                  </div>

                  <div className="notif-footer">
                    <button
                      className="notif-footer-btn"
                      onClick={() => {
                        setNotifOpen(false);
                        handleNavClick('orders');
                      }}
                    >
                      View All in Activity Pipeline →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="vel-user-badge" onClick={() => showToast(`Logged in as ${adminProfile?.full_name || 'Admin'} (Admin)`)}>
              <img
                src={adminProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={adminProfile?.full_name || 'Admin'}
                className="vel-avatar"
              />
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
                <>
                  <div className="vel-page-header">
                    <h1 className="vel-page-h1">Overview</h1>
                    <p className="vel-page-sub">Real-time production metrics.</p>
                  </div>

                  <div className="vel-metric-grid">
                    {/* 1. Active Orders */}
                    <div className="vel-metric-card" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('orders')}>
                      <div className="vel-metric-top">
                        <span className="vel-metric-label">Active Orders</span>
                        <div className="vel-metric-icon">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="vel-metric-bottom">
                        <div className="vel-metric-number">{metrics.activeOrders} •</div>
                      </div>
                    </div>

                    {/* 2. Accepted Orders */}
                    <div className="vel-metric-card">
                      <div className="vel-metric-top">
                        <span className="vel-metric-label">Accepted Orders</span>
                        <div className="vel-metric-icon">
                          <CheckSquare className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="vel-metric-bottom">
                        <div className="vel-metric-number">{metrics.acceptedOrders}</div>
                        <span className="vel-metric-pill-badge">In Queue</span>
                      </div>
                    </div>

                    {/* 3. Completed This Week */}
                    <div className="vel-metric-card">
                      <div className="vel-metric-top">
                        <span className="vel-metric-label">Completed This Week</span>
                        <div className="vel-metric-icon">
                          <CheckSquare className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="vel-metric-bottom">
                        <div className="vel-metric-number">{metrics.completedThisWeek}</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '22px' }}>
                          <div style={{ width: '4px', height: '8px', background: '#3A3A4A', borderRadius: '1px' }} />
                          <div style={{ width: '4px', height: '12px', background: '#3A3A4A', borderRadius: '1px' }} />
                          <div style={{ width: '4px', height: '18px', background: '#3A3A4A', borderRadius: '1px' }} />
                          <div style={{ width: '4px', height: '14px', background: '#3A3A4A', borderRadius: '1px' }} />
                          <div style={{ width: '4px', height: '22px', background: '#6A6A80', borderRadius: '1px' }} />
                          <div style={{ width: '4px', height: '20px', background: '#8A8AA0', borderRadius: '1px' }} />
                        </div>
                      </div>
                    </div>

                    {/* 4. Pending Orders (Alert Amber) */}
                    <div className="vel-metric-card alert-amber" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('orders')}>
                      <div className="vel-metric-top">
                        <span className="vel-metric-label">Pending Orders</span>
                        <div className="vel-metric-icon">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="vel-metric-bottom">
                        <div className="vel-metric-number">{metrics.pendingOrders}</div>
                        <span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 600 }}>Action Req.</span>
                      </div>
                    </div>

                    {/* 5. With Editor */}
                    <div className="vel-metric-card" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('editors')}>
                      <div className="vel-metric-top">
                        <span className="vel-metric-label">With Editor</span>
                        <div className="vel-metric-icon">
                          <Users className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="vel-metric-bottom">
                        <div className="vel-metric-number">{metrics.withEditorOrders}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.72rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--vel-text-secondary)' }}>
                            <span style={{ color: '#EF4444' }}>•</span>
                            <span>Near Deadline</span>
                            <strong style={{ color: '#FFFFFF', marginLeft: 'auto' }}>3</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--vel-text-secondary)' }}>
                            <span style={{ color: '#22C55E' }}>•</span>
                            <span>On Track</span>
                            <strong style={{ color: '#FFFFFF', marginLeft: 'auto' }}>3</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 6. Ready for Delivery */}
                    <div className="vel-metric-card">
                      <div className="vel-metric-top">
                        <span className="vel-metric-label">Ready for Delivery</span>
                        <div className="vel-metric-icon">
                          <Send className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="vel-metric-bottom">
                        <div className="vel-metric-number">{metrics.readyForDelivery}</div>
                        <button
                          className="vel-metric-cta-btn"
                          onClick={() => handleNavClick('orders')}
                        >
                          <span>Review & Deliver</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 2: ASSIGN PROJECT                                         */}
              {/* ============================================================== */}
              {activeNav === 'assign' && (
                <>
                  <div className="vel-page-header">
                    <h1 className="vel-page-h1">Assign Project</h1>
                    <p className="vel-page-sub">Route editing tasks to the optimal studio personnel.</p>
                  </div>

                  <form onSubmit={handleAssignProjectSubmit} className="vel-assign-layout">
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      <div className="vel-card">
                        <div className="vel-card-head">
                          <span className="vel-card-title-sm">PROJECT DETAILS</span>
                          <FileText className="h-4 w-4 text-white/40" />
                        </div>

                        {(() => {
                          const clientEligibleProjects = orders
                            .filter(o => o.dbStatus !== 'delivered')
                            .filter(o => {
                              if (!assignForm.client) return false;
                              const selectedClientObj = clientsList.find(c => c.name === assignForm.client);
                              if (selectedClientObj && o.clientId && o.clientId === selectedClientObj.id) {
                                return true;
                              }
                              return (o.client || '').toLowerCase() === assignForm.client.toLowerCase();
                            });

                          return (
                            <div className="vel-form-grid-2">
                              <div className="vel-field-group">
                                <label className="vel-label">Select Client</label>
                                <select
                                  className="vel-select"
                                  value={assignForm.client}
                                  onChange={(e) => {
                                    const clientName = e.target.value;
                                    setAssignForm(prev => ({
                                      ...prev,
                                      client: clientName,
                                      project: '',
                                      orderId: '',
                                      clientDeadline: '',
                                      internalDeadline: '',
                                      brief: '',
                                    }));
                                  }}
                                >
                                  <option value="">-- Choose Client --</option>
                                  {clientsList.map((cl) => (
                                    <option key={cl.id} value={cl.name}>
                                      {cl.name} {cl.company ? `(${cl.company})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="vel-field-group">
                                <label className="vel-label">Select Project</label>
                                <select
                                  className="vel-select"
                                  value={assignForm.project}
                                  onChange={(e) => {
                                    const selectedTitle = e.target.value;
                                    const matched = clientEligibleProjects.find(o => o.title === selectedTitle);
                                    setAssignForm(prev => ({
                                      ...prev,
                                      project: selectedTitle,
                                      orderId: matched?.dbId || matched?.id || '',
                                      client: matched?.client || prev.client,
                                      clientDeadline: matched?.clientDeadline || '',
                                      internalDeadline: matched?.editorDeadline || '',
                                      brief: matched?.notes || prev.brief,
                                    }));
                                  }}
                                  disabled={!assignForm.client}
                                  style={{
                                    opacity: !assignForm.client ? 0.6 : 1,
                                    cursor: !assignForm.client ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {!assignForm.client ? (
                                    <option value="">-- Select Client First --</option>
                                  ) : clientEligibleProjects.length === 0 ? (
                                    <option value="">-- No Active Projects for this Client --</option>
                                  ) : (
                                    <>
                                      <option value="">-- Choose Project ({clientEligibleProjects.length} available) --</option>
                                      {clientEligibleProjects.map((ord) => (
                                        <option key={ord.id} value={ord.title}>
                                          [{ord.displayId}] {ord.title} {ord.type ? `(${ord.type})` : ''} {ord.editor.name !== 'Unassigned' ? `• Assigned: ${ord.editor.name}` : '• Unassigned'}
                                        </option>
                                      ))}
                                    </>
                                  )}
                                </select>
                                {Boolean(assignForm.client && clientEligibleProjects.length === 0) && (
                                  <span style={{ fontSize: '0.68rem', color: '#FCD34D', marginTop: '4px', display: 'block' }}>
                                    This client currently has no active (uncompleted) projects.
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="vel-card">
                        <div className="vel-card-head">
                          <span className="vel-card-title-sm">RESOURCE ALLOCATION</span>
                          <div className="vel-toggle-wrap">
                            <span>Auto-suggest</span>
                            <label className="vel-switch">
                              <input
                                type="checkbox"
                                checked={assignForm.autoSuggest}
                                onChange={(e) => setAssignForm({ ...assignForm, autoSuggest: e.target.checked })}
                              />
                              <span className="vel-slider"></span>
                            </label>
                          </div>
                        </div>

                        <div className="vel-field-group">
                          <label className="vel-label">Assigned Editor</label>
                          <select
                            className="vel-select"
                            value={assignForm.editorId || ''}
                            onChange={(e) => {
                              const edId = e.target.value;
                              const matchedEd = editorsList.find(ed => String(ed.id) === String(edId));
                              setAssignForm(prev => ({
                                ...prev,
                                editorId: edId,
                                editor: matchedEd?.name || '',
                              }));
                            }}
                          >
                            <option value="">-- Select Editor --</option>
                            {editorsList.map((ed) => (
                              <option key={ed.id} value={ed.id}>
                                {ed.name} ({ed.role || ed.category}) — {ed.activeOrders}/{ed.maxOrders} Active
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="vel-form-grid-2">
                          <div className="vel-field-group">
                            <label className="vel-label">
                              Client Deadline <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <input
                              type="date"
                              className="vel-input"
                              value={assignForm.clientDeadline}
                              onChange={(e) => setAssignForm({ ...assignForm, clientDeadline: e.target.value })}
                              required
                            />
                          </div>

                          <div className="vel-field-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label className="vel-label">
                                Internal Editor Deadline <span style={{ color: '#EF4444' }}>*</span>
                              </label>
                              <span style={{ fontSize: '0.62rem', color: '#22C55E', letterSpacing: '0.05em', fontWeight: 700 }}>REQUIRED</span>
                            </div>
                            <input
                              type="date"
                              className="vel-input"
                              value={assignForm.internalDeadline}
                              onChange={(e) => setAssignForm({ ...assignForm, internalDeadline: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Brief & Notes */}
                    <div className="vel-card" style={{ height: '100%', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="vel-card-head">
                          <span className="vel-card-title-sm">BRIEF & NOTES</span>
                          <FileText className="h-4 w-4 text-white/40" />
                        </div>

                        <textarea
                          className="vel-textarea"
                          placeholder="Enter specific instructions, reference links, or focus areas for the editor..."
                          value={assignForm.brief}
                          onChange={(e) => setAssignForm({ ...assignForm, brief: e.target.value })}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#121217', borderRadius: '8px', border: '1px solid var(--vel-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Mail className="h-4 w-4 text-white/60" />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Notify Editor</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)' }}>Send automated slack & email brief</span>
                            </div>
                          </div>

                          <label className="vel-switch">
                            <input
                              type="checkbox"
                              checked={assignForm.notifyEditor}
                              onChange={(e) => setAssignForm({ ...assignForm, notifyEditor: e.target.checked })}
                            />
                            <span className="vel-slider"></span>
                          </label>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                        <button type="submit" className="vel-btn-solid">
                          <Send className="h-4 w-4" />
                          <span>Assign Project</span>
                        </button>
                        <button type="button" className="vel-btn-outline" onClick={() => showToast('Draft saved successfully.')}>
                          Save as Draft
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 3: ORDER CREATION                                         */}
              {/* ============================================================== */}
              {activeNav === 'create' && (
                <>
                  <div className="vel-page-header">
                    <h1 className="vel-page-h1">New Project Initialization</h1>
                    <p className="vel-page-sub">Configure client details, project scope, and deadlines.</p>
                  </div>

                  <form onSubmit={handleCreateOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="vel-card">
                      <div className="vel-card-head">
                        <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users className="h-4 w-4" />
                          <span>Client Identity</span>
                        </span>
                      </div>

                      <div className="vel-field-group">
                        <label className="vel-label">Select Client</label>
                        <select
                          className="vel-select"
                          value={createForm.existingClient}
                          onChange={(e) => setCreateForm({ ...createForm, existingClient: e.target.value })}
                          required
                        >
                          <option value="">-- Choose Client --</option>
                          {clientsList.map((cl) => (
                            <option key={cl.id} value={cl.name}>
                              {cl.name} {cl.company ? `(${cl.company})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="vel-card">
                      <div className="vel-card-head">
                        <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clapperboard className="h-4 w-4" />
                          <span>Project Scope</span>
                        </span>
                      </div>

                      <div className="vel-form-grid-2">
                        <div className="vel-field-group">
                          <label className="vel-label">Project Nomenclature</label>
                          <input
                            type="text"
                            placeholder="e.g., Q3 Product Launch Reel"
                            className="vel-input"
                            value={createForm.nomenclature}
                            onChange={(e) => setCreateForm({ ...createForm, nomenclature: e.target.value })}
                            required
                          />
                        </div>

                        <div className="vel-field-group">
                          <label className="vel-label">Format / Platform</label>
                          <select
                            className="vel-select"
                            value={createForm.format}
                            onChange={(e) => setCreateForm({ ...createForm, format: e.target.value })}
                          >
                            <option value="YouTube Longform (16:9)">YouTube Longform (16:9)</option>
                            <option value="Instagram / TikTok Reel (9:16)">Instagram / TikTok Reel (9:16)</option>
                            <option value="Commercial 4K Broadcast">Commercial 4K Broadcast</option>
                            <option value="Square Social Ad (1:1)">Square Social Ad (1:1)</option>
                          </select>
                        </div>
                      </div>

                      <div className="vel-field-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <label className="vel-label">Creative Brief & Instructions</label>
                          <span style={{ fontSize: '0.65rem', color: 'var(--vel-text-tertiary)' }}>Markdown Supported</span>
                        </div>
                        <textarea
                          className="vel-textarea"
                          style={{ minHeight: '120px' }}
                          placeholder="Detail the pacing, mood, reference videos, and specific editing requirements..."
                          value={createForm.brief}
                          onChange={(e) => setCreateForm({ ...createForm, brief: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="vel-form-grid-2">
                      <div className="vel-card">
                        <div className="vel-card-head">
                          <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Paperclip className="h-4 w-4" />
                            <span>Asset Ingestion</span>
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <input
                            type="text"
                            placeholder="Raw Footage Link (Google Drive, Dropbox, Mega)"
                            className="vel-input"
                            value={createForm.rawFootageLink}
                            onChange={(e) => setCreateForm({ ...createForm, rawFootageLink: e.target.value })}
                          />
                          <input
                            type="text"
                            placeholder="Brand Assets / LUTs / Graphics Link (Optional)"
                            className="vel-input"
                            value={createForm.brandAssetsLink}
                            onChange={(e) => setCreateForm({ ...createForm, brandAssetsLink: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="vel-card">
                        <div className="vel-card-head">
                          <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar className="h-4 w-4" />
                            <span>Timeline Tracker</span>
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className="vel-field-group">
                            <label className="vel-label">Internal Editor Deadline</label>
                            <input
                              type="date"
                              className="vel-input"
                              value={createForm.internalDeadline}
                              onChange={(e) => setCreateForm({ ...createForm, internalDeadline: e.target.value })}
                            />
                          </div>

                          <div className="vel-field-group">
                            <label className="vel-label">Client Delivery Date</label>
                            <input
                              type="date"
                              className="vel-input"
                              value={createForm.clientDeadline}
                              onChange={(e) => setCreateForm({ ...createForm, clientDeadline: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                      <button type="button" className="vel-btn-outline" onClick={() => handleNavClick('home')}>
                        Cancel
                      </button>
                      <button type="submit" className="vel-btn-solid">
                        <span>Create Order</span>
                        <span>→</span>
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 4: EDITORS & CLIENTS MANAGEMENT                           */}
              {/* ============================================================== */}
              {(activeNav === 'editors' || activeNav === 'clients') && (
                <>
                  <div className="vel-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h1 className="vel-page-h1">Management</h1>
                      <p className="vel-page-sub">Oversee editor workloads, track specialities, and manage studio resource allocation.</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', background: '#121217', padding: '3px', borderRadius: '8px', border: '1px solid var(--vel-border)' }}>
                        <button
                          onClick={() => { setActiveNav('editors'); setMgmtTab('editors'); }}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            background: mgmtTab === 'editors' ? '#262633' : 'transparent',
                            color: mgmtTab === 'editors' ? '#FFFFFF' : 'var(--vel-text-secondary)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Editors ({editorsList.length})
                        </button>
                        <button
                          onClick={() => { setActiveNav('clients'); setMgmtTab('clients'); }}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            background: mgmtTab === 'clients' ? '#262633' : 'transparent',
                            color: mgmtTab === 'clients' ? '#FFFFFF' : 'var(--vel-text-secondary)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Clients ({clientsList.length})
                        </button>
                      </div>

                      {mgmtTab === 'editors' && (
                        <button
                          className="vel-btn-solid"
                          onClick={() => setShowAddEditorModal(true)}
                          style={{ padding: '7px 16px', fontSize: '0.8rem' }}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add New Editor</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                      <Search className="h-4 w-4" style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--vel-text-tertiary)' }} />
                      <input
                        type="text"
                        placeholder={mgmtTab === 'editors' ? "Search editors by name, role (e.g. AI, Motion, Graphics), or skill..." : "Search clients by company or contact..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="vel-input"
                        style={{ paddingLeft: '40px' }}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          style={{ position: 'absolute', right: '12px', top: '10px', background: 'transparent', border: 'none', color: 'var(--vel-text-tertiary)', cursor: 'pointer' }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {mgmtTab === 'editors' && (
                      <>
                        <button
                          className={`vel-btn-outline ${editorStatusFilter !== 'ALL' ? 'active' : ''}`}
                          onClick={() => {
                            const next = editorStatusFilter === 'ALL' ? 'AVAILABLE' : editorStatusFilter === 'AVAILABLE' ? 'AT CAPACITY' : 'ALL';
                            setEditorStatusFilter(next);
                            showToast(`Status filter: ${next}`);
                          }}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span>Status: {editorStatusFilter}</span>
                        </button>

                        <div className="vel-sort-container">
                          <button
                            className="vel-btn-outline"
                            onClick={() => setShowSortMenu(!showSortMenu)}
                          >
                            <ArrowUpDown className="h-3.5 w-3.5" />
                            <span>
                              {editorSortBy === 'workload-asc' ? 'Least Busy' :
                               editorSortBy === 'workload-desc' ? 'Most Active' :
                               editorSortBy === 'rating' ? 'Top Rated' : 'Name A-Z'}
                            </span>
                            <ChevronDown className="h-3 w-3 text-white/40" />
                          </button>

                          {showSortMenu && (
                            <div className="vel-sort-menu">
                              {[
                                { key: 'workload-asc', label: 'Lowest Workload (Least Busy)' },
                                { key: 'workload-desc', label: 'Highest Workload (Most Active)' },
                                { key: 'rating', label: 'Highest Rating (★ 5.0)' },
                                { key: 'name-asc', label: 'Alphabetical (A - Z)' },
                              ].map(st => (
                                <button
                                  key={st.key}
                                  className={`vel-sort-item ${editorSortBy === st.key ? 'active' : ''}`}
                                  onClick={() => {
                                    setEditorSortBy(st.key);
                                    setShowSortMenu(false);
                                    showToast(`Sorted by ${st.label}`);
                                  }}
                                >
                                  <span>{st.label}</span>
                                  {editorSortBy === st.key && <Check className="h-3.5 w-3.5 text-blue-400" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Specialty Filter Pills Bar */}
                  {mgmtTab === 'editors' && (
                    <div className="vel-filter-bar">
                      {[
                        { key: 'ALL', label: 'All Specialties' },
                        { key: 'AI Video Editor', label: 'AI Video Editor' },
                        { key: 'Motion Graphics', label: 'Motion Graphics' },
                        { key: 'Graphic Designer', label: 'Graphic Designer' },
                        { key: 'Short-Form Specialist', label: 'Short-Form / Reels' },
                        { key: 'Colorist', label: 'Colorist' },
                      ].map(cat => (
                        <button
                          key={cat.key}
                          className={`vel-filter-pill ${editorCategoryFilter === cat.key ? 'active' : ''}`}
                          onClick={() => setEditorCategoryFilter(cat.key)}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Editors List */}
                  {mgmtTab === 'editors' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {filteredEditors.length === 0 ? (
                        <div className="vel-card" style={{ padding: '40px', textAlign: 'center', alignItems: 'center', gap: '12px' }}>
                          <Users className="h-8 w-8 text-white/30" />
                          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>No editors match your filters</h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--vel-text-secondary)', maxWidth: '380px' }}>
                            Try adjusting your search query "{searchQuery}" or reset the category filter.
                          </p>
                          <button
                            className="vel-btn-solid"
                            style={{ marginTop: '8px' }}
                            onClick={() => { setSearchQuery(''); setEditorCategoryFilter('ALL'); setEditorStatusFilter('ALL'); }}
                          >
                            Reset All Filters
                          </button>
                        </div>
                      ) : (
                        filteredEditors.map((ed) => (
                          <div
                            key={ed.id}
                            style={{
                              background: 'var(--vel-bg-card)',
                              border: '1px solid var(--vel-border)',
                              borderRadius: '12px',
                              padding: '18px 22px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '14px',
                              cursor: 'pointer',
                              transition: 'border-color 0.15s, background 0.15s'
                            }}
                            onClick={() => setExpandedEditor(expandedEditor === ed.id ? null : ed.id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <img
                                  src={ed.avatar}
                                  alt={ed.name}
                                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--vel-border)' }}
                                />
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF' }}>{ed.name}</span>
                                    <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: '#161622', color: '#60A5FA', border: '1px solid rgba(96, 165, 250, 0.25)', fontWeight: 600 }}>
                                      {ed.category}
                                    </span>
                                    {ed.rating && (
                                      <span style={{ fontSize: '0.72rem', color: '#EAB308', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                                        ★ {ed.rating}
                                      </span>
                                    )}
                                  </div>
                                  <div className="vel-editor-tagline">{ed.tagline || ed.role}</div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.72rem', color: ed.statusColor, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontWeight: 700 }}>
                                    <span>•</span>
                                    <span>{ed.status}</span>
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: 'var(--vel-text-secondary)', marginTop: '2px' }}>
                                    WORKLOAD: <strong style={{ color: '#FFFFFF' }}>{ed.activeOrders} / {ed.maxOrders} Active</strong>
                                  </div>
                                </div>

                                <ChevronDown
                                  className="h-4 w-4 text-white/40"
                                  style={{ transform: expandedEditor === ed.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                                />
                              </div>
                            </div>

                            {/* Expanded Details Drawer */}
                            {expandedEditor === ed.id && (
                              <div style={{ paddingTop: '14px', borderTop: '1px solid var(--vel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--vel-text-tertiary)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    PRIMARY DESIGN SPECIALIZATION & ROLE
                                  </span>
                                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF' }}>{ed.role}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  {ed.skills.map((sk, i) => (
                                    <span key={i} className="vel-tag-skill">
                                      {sk}
                                    </span>
                                  ))}
                                </div>

                                <button
                                  className="vel-btn-solid"
                                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAssignForm(prev => ({ ...prev, editor: ed.name }));
                                    handleNavClick('assign');
                                  }}
                                >
                                  Assign Project
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Clients List */}
                  {mgmtTab === 'clients' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filteredClients.length === 0 ? (
                        <div className="vel-card" style={{ padding: '40px', textAlign: 'center', alignItems: 'center', gap: '12px' }}>
                          <Handshake className="h-8 w-8 text-white/30" />
                          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>No clients found</h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--vel-text-secondary)' }}>
                            No clients match your search query "{searchQuery}".
                          </p>
                        </div>
                      ) : (
                        filteredClients.map((cl) => (
                          <div
                            key={cl.id}
                            style={{
                              background: 'var(--vel-bg-card)',
                              border: '1px solid var(--vel-border)',
                              borderRadius: '12px',
                              padding: '16px 20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#181824', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#3B82F6' }}>
                                {cl.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{cl.name}</div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--vel-text-secondary)' }}>Contact: {cl.contact} • {cl.tier}</div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--vel-text-secondary)', display: 'block' }}>Active Projects</span>
                                <strong style={{ fontSize: '0.88rem' }}>{cl.activeProjects}</strong>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--vel-text-secondary)', display: 'block' }}>Total Spend</span>
                                <strong style={{ fontSize: '0.88rem', color: '#22C55E' }}>{cl.spend}</strong>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 5: CURRENT ORDERS / ACTIVE PIPELINE                       */}
              {/* ============================================================== */}
              {activeNav === 'orders' && (
                <>
                  <div className="vel-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h1 className="vel-page-h1">Active Pipeline</h1>
                      <p className="vel-page-sub">Managing {activePipelineOrders.length} projects currently in production.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="vel-btn-outline" onClick={() => setStatusFilter(statusFilter === 'ALL' ? 'IN PROGRESS' : 'ALL')}>
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span>{statusFilter === 'ALL' ? 'Filter: All' : `Filter: ${statusFilter}`}</span>
                      </button>
                      <button className="vel-btn-solid" onClick={() => handleNavClick('create')}>
                        <Plus className="h-3.5 w-3.5" />
                        <span>New Order</span>
                      </button>
                    </div>
                  </div>

                  <div className="vel-pipeline-layout">
                    {/* Left: Orders Table */}
                    <div className="vel-card" style={{ padding: '0', overflow: 'hidden' }}>
                      <table className="vel-order-table">
                        <thead>
                          <tr>
                            <th>ORDER ID</th>
                            <th>PROJECT / CLIENT</th>
                            <th>EDITOR</th>
                            <th>DEADLINE</th>
                            <th>STATUS</th>
                            <th>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((ord) => (
                            <tr
                              key={ord.id}
                              className={`vel-order-row ${selectedOrderId === ord.id ? 'selected' : ''}`}
                              onClick={() => setSelectedOrderId(ord.id)}
                            >
                              <td style={{ fontWeight: 700, color: '#93C5FD', letterSpacing: '0.04em', fontFamily: 'monospace' }}>{ord.displayId}</td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: 700 }}>{ord.title}</span>
                                    {ord.additionalLink && (
                                      ord.clientLinkVisible ? (
                                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                                          ACCESS: GRANTED
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                                          ACCESS: RESTRICTED
                                        </span>
                                      )
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)' }}>{ord.client}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {ord.editor.avatar ? (
                                    <img src={ord.editor.avatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                                  ) : (
                                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#262633', display: 'inline-block' }} />
                                  )}
                                  <span style={{ fontStyle: ord.editor.name === 'Unassigned' ? 'italic' : 'normal', color: ord.editor.name === 'Unassigned' ? '#F59E0B' : 'inherit' }}>
                                    {ord.editor.name}
                                  </span>
                                </div>
                              </td>
                              <td style={{ color: 'var(--vel-text-secondary)' }}>{ord.deadline}</td>
                              <td>
                                <span className={ord.badgeClass}>
                                  {ord.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {(!ord.editor.id || ord.editor.name === 'Unassigned') && ord.dbStatus !== 'delivered' && (
                                    <button
                                      type="button"
                                      className="vel-btn-solid"
                                      style={{
                                        padding: '3px 8px',
                                        fontSize: '0.66rem',
                                        fontWeight: 700,
                                        background: '#3B82F6',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRedirectToAssign(ord);
                                      }}
                                      title="Assign this order to an editor"
                                    >
                                      <UserCheck className="h-3 w-3" />
                                      <span>Assign</span>
                                    </button>
                                  )}
                                  <ChevronRight className="h-4 w-4 text-white/30" />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Right: Order Detail & Admin Controls Drawer */}
                    <div className="vel-card" style={{ gap: '20px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#93C5FD', letterSpacing: '0.04em', fontFamily: 'monospace' }}>{selectedOrder.displayId}</span>
                          <span className={selectedOrder.badgeClass}>{selectedOrder.status}</span>
                          {selectedOrder.dbStatus === 'delivered' ? (
                            (() => {
                              const perf = getDeliveryPerformance(selectedOrder, statusHistoryMap);
                              return perf.isOnTime ? (
                                <span style={{ fontSize: '0.72rem', color: '#4ADE80', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(34, 197, 94, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.25)', fontWeight: 700 }}>
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Delivered On Time</span>
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#F87171', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)', fontWeight: 700 }}>
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Delivered {perf.label}</span>
                                </span>
                              );
                            })()
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#FCD34D', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.25)', fontWeight: 600 }}>
                              <Calendar className="h-3 w-3" />
                              <span>Expected Delivery: {getExpectedDeliveryDate(selectedOrder)}</span>
                            </span>
                          )}
                        </div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedOrder.title}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--vel-text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Client: {selectedOrder.client}</span>
                          <span>•</span>
                          <span>{selectedOrder.type}</span>
                          <span>•</span>
                          <span style={{ color: '#93C5FD' }}>Accepted: {getOrderAcceptedDate(selectedOrder, statusHistoryMap)}</span>
                        </div>

                        {(!selectedOrder.editor.id || selectedOrder.editor.name === 'Unassigned') && selectedOrder.dbStatus !== 'delivered' && (
                          <div style={{
                            marginTop: '12px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'rgba(59, 130, 246, 0.08)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            flexWrap: 'wrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <UserCheck className="h-4 w-4 text-blue-400 shrink-0" />
                              <span style={{ fontSize: '0.76rem', color: '#93C5FD', fontWeight: 600 }}>
                                This project is not assigned to an editor yet.
                              </span>
                            </div>
                            <button
                              type="button"
                              className="vel-btn-solid"
                              style={{
                                padding: '6px 14px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleRedirectToAssign(selectedOrder)}
                            >
                              <span>Assign Project to Editor</span>
                              <span>→</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Milestone Stepper */}
                      <div className="vel-stepper-wrap" style={{ padding: '8px 0' }}>
                        <div className="vel-stepper-line" style={{ top: '16px' }} />
                        {[
                          { key: 'received', label: 'RECEIVED', step: 0 },
                          { key: 'accepted', label: 'ACCEPTED', step: 1 },
                          { key: 'in_editing', label: 'IN EDITING', step: 2 },
                          { key: 'in_review', label: 'IN REVIEW', step: 3 },
                          { key: 'delivered', label: 'DELIVERED', step: 4 },
                        ].map((st) => {
                          const isDone = selectedOrder.currentStep > st.step;
                          const isActive = selectedOrder.currentStep === st.step;
                          const stageDate = getOrderStageDate(selectedOrder, st.key, st.step);
                          return (
                            <div key={st.key} className="vel-step-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                              <div className={`vel-step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                                {isDone ? <Check className="h-2.5 w-2.5" /> : isActive ? '◉' : ''}
                              </div>
                              <span className="vel-step-label" style={{ fontWeight: 700, fontSize: '0.65rem', marginTop: '4px' }}>
                                {st.label}
                              </span>
                              <span style={{
                                fontSize: '0.6rem',
                                color: isDone || isActive ? '#9CA3AF' : 'var(--vel-text-secondary)',
                                letterSpacing: '0.02em',
                                marginTop: '2px',
                                fontWeight: isDone || isActive ? 600 : 400
                              }}>
                                {stageDate}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Assigned Editor & Client Contact Cards */}
                      <div className="vel-form-grid-2">
                        <div style={{ padding: '12px 14px', background: 'var(--vel-bg-input)', borderRadius: '8px', border: '1px solid var(--vel-border)' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--vel-text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                            ASSIGNED EDITOR
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {selectedOrder.editor.avatar ? (
                              <img src={selectedOrder.editor.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                            ) : (
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#262633' }} />
                            )}
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: (!selectedOrder.editor.id || selectedOrder.editor.name === 'Unassigned') ? '#F59E0B' : '#FFFFFF' }}>
                                {selectedOrder.editor.name}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)' }}>{selectedOrder.editor.role}</div>
                            </div>
                          </div>

                          {(!selectedOrder.editor.id || selectedOrder.editor.name === 'Unassigned') && selectedOrder.dbStatus !== 'delivered' && (
                            <button
                              type="button"
                              className="vel-btn-solid"
                              style={{
                                marginTop: '10px',
                                width: '100%',
                                padding: '7px 12px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: '#3B82F6',
                                color: '#FFFFFF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleRedirectToAssign(selectedOrder)}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Assign Project →</span>
                            </button>
                          )}
                        </div>

                        <div style={{ padding: '12px 14px', background: 'var(--vel-bg-input)', borderRadius: '8px', border: '1px solid var(--vel-border)' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--vel-text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                            CLIENT CONTACT
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1C1C24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Users className="h-3.5 w-3.5 text-white/60" />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{selectedOrder.clientContact.name}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)' }}>{selectedOrder.clientContact.company}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Project Assets & Submitted Deliverables Section */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--vel-border)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Cloud className="h-3.5 w-3.5 text-blue-400" />
                            <span>Editor Deliverables & Assets</span>
                          </span>

                          {selectedOrder.additionalLink && (
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: selectedOrder.clientLinkVisible ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: selectedOrder.clientLinkVisible ? '#4ADE80' : '#FCD34D',
                              border: selectedOrder.clientLinkVisible ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {selectedOrder.clientLinkVisible ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span>Client Access: Granted</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3" />
                                  <span>Client Access: Restricted (Admin Only)</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Editor Submitted Deliverable Link */}
                        {selectedOrder.additionalLink ? (
                          <div style={{ padding: '14px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <ExternalLink className="h-4 w-4 text-emerald-400" />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ADE80' }}>Editor Deliverables Submitted</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                                    {selectedOrder.additionalLink}
                                  </div>
                                </div>
                              </div>

                              <a
                                href={selectedOrder.additionalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="vel-btn-outline"
                                style={{ padding: '6px 12px', fontSize: '0.74rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                              >
                                <span>Preview Link</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            {/* Client Permission Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', gap: '10px', flexWrap: 'wrap' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF' }}>Client Visibility Permission</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)' }}>
                                  {selectedOrder.clientLinkVisible
                                    ? 'Access is granted! Client can view and open this deliverable on their dashboard.'
                                    : 'Access is restricted. Click "Allow Client to View" to grant the client access (even before delivery).'}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleToggleClientDeliverableAccess}
                                style={{
                                  padding: '6px 14px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  border: 'none',
                                  background: selectedOrder.clientLinkVisible ? '#EF4444' : '#22C55E',
                                  color: selectedOrder.clientLinkVisible ? '#FFFFFF' : '#000000',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {selectedOrder.clientLinkVisible ? (
                                  <>
                                    <EyeOff className="h-3.5 w-3.5" />
                                    <span>Revoke Client Access</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Allow Client to View</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '12px 14px', background: 'var(--vel-bg-input)', borderRadius: '8px', border: '1px dashed var(--vel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                              <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--vel-text-primary)' }}>No Deliverable Submitted Yet</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--vel-text-secondary)', marginTop: '2px' }}>
                                  Expected Delivery: <strong style={{ color: '#FCD34D' }}>{getExpectedDeliveryDate(selectedOrder)}</strong>
                                </div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 600 }}>
                              IN PROGRESS
                            </span>
                          </div>
                        )}

                        {/* Client Raw Footage Link (if provided) */}
                        {selectedOrder.driveLink && (
                          <div style={{ padding: '10px 14px', background: 'var(--vel-bg-input)', borderRadius: '8px', border: '1px solid var(--vel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--vel-text-secondary)' }}>Client Raw Footage</div>
                              <div style={{ fontSize: '0.72rem', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                {selectedOrder.driveLink}
                              </div>
                            </div>
                            <a
                              href={selectedOrder.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="vel-btn-outline"
                              style={{ padding: '5px 10px', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                            >
                              <span>Open Raw</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* ADMIN CONTROLS */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--vel-border)', paddingTop: '16px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          ADMIN CONTROLS
                        </span>

                        <div className="vel-field-group">
                          <label className="vel-label">Update Status</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select
                              className="vel-select"
                              style={{ flex: 1 }}
                              value={stagedStatusMap[selectedOrder.id] || selectedOrder.status || 'RECEIVED'}
                              onChange={(e) => handleOrderFieldChange('status', e.target.value)}
                            >
                              <option value="RECEIVED">Received</option>
                              <option value="ACCEPTED">Accepted</option>
                              <option value="IN PROGRESS">In Progress</option>
                              <option value="REVIEWING">Reviewing</option>
                              <option value="REVISION">Revision Requested</option>
                              <option value="ON HOLD">On Hold</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                            <button
                              type="button"
                              className="vel-btn-solid"
                              style={{
                                padding: '8px 14px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: stagedStatusMap[selectedOrder.id] ? '#22C55E' : 'rgba(255, 255, 255, 0.1)',
                                color: stagedStatusMap[selectedOrder.id] ? '#000000' : '#FFFFFF',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                border: 'none',
                                borderRadius: '6px'
                              }}
                              onClick={() => handleUpdateStatusExplicitly(stagedStatusMap[selectedOrder.id] || selectedOrder.status)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Update</span>
                            </button>
                          </div>
                          {Boolean(stagedStatusMap[selectedOrder.id]) && (
                            <span style={{ fontSize: '0.68rem', color: '#FCD34D', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                              <Clock className="h-3 w-3" />
                              <span>Status ready to save. Click "Update" or "Save Changes" below.</span>
                            </span>
                          )}
                        </div>

                        <div className="vel-form-grid-2">
                          <div className="vel-field-group">
                            <label className="vel-label">Editor Deadline</label>
                            <input
                              type="date"
                              className="vel-input"
                              value={selectedOrder.editorDeadline}
                              onChange={(e) => handleOrderFieldChange('editorDeadline', e.target.value)}
                            />
                          </div>

                          <div className="vel-field-group">
                            <label className="vel-label">Client Deadline</label>
                            <input
                              type="date"
                              className="vel-input"
                              value={selectedOrder.clientDeadline}
                              onChange={(e) => handleOrderFieldChange('clientDeadline', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="vel-field-group">
                          <label className="vel-label">Admin Notes (Internal)</label>
                          <textarea
                            className="vel-textarea"
                            style={{ minHeight: '70px' }}
                            placeholder="Add notes..."
                            value={selectedOrder.notes}
                            onChange={(e) => handleOrderFieldChange('notes', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Bottom Action buttons */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="vel-btn-outline" style={{ flex: 1 }} onClick={handleNotifyEditor}>
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Notify Editor</span>
                        </button>
                        <button
                          className="vel-btn-solid"
                          style={{
                            flex: 1,
                            background: selectedOrder.pendingStatusChange ? '#22C55E' : 'var(--vel-accent)',
                            color: '#000000',
                            fontWeight: 700
                          }}
                          onClick={handleSaveOrderChanges}
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>{selectedOrder.pendingStatusChange ? 'Save Status & Changes' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW: ORDERS HISTORY / DELIVERED PROJECTS                      */}
              {/* ============================================================== */}
              {activeNav === 'history' && (
                <>
                  <div className="vel-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h1 className="vel-page-h1">Orders History</h1>
                      <p className="vel-page-sub">
                        Archived and delivered projects from all clients with verified client ratings and testimonials.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="vel-search-bar" style={{ width: '280px' }}>
                        <Search className="h-3.5 w-3.5 text-white/40" />
                        <input
                          type="text"
                          placeholder="Search orders, clients, editors..."
                          className="vel-search-input"
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="vel-kpi-grid" style={{ marginBottom: '20px' }}>
                    <div className="vel-kpi-card">
                      <div className="vel-kpi-icon-wrap" style={{ background: 'rgba(34, 197, 94, 0.12)' }}>
                        <Archive className="h-5 w-5 text-emerald-400" />
                      </div>
                      <span className="vel-kpi-label">TOTAL DELIVERED</span>
                      <div className="vel-kpi-val">
                        {orders.filter(o => o.dbStatus === 'delivered').length}
                      </div>
                    </div>

                    <div className="vel-kpi-card">
                      <div className="vel-kpi-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.12)' }}>
                        <Star className="h-5 w-5 text-amber-400" fill="#F59E0B" />
                      </div>
                      <span className="vel-kpi-label">AVG CLIENT RATING</span>
                      <div className="vel-kpi-val">
                        {(() => {
                          const ratedOrders = orders.filter(o => o.dbStatus === 'delivered' && adminRatingsMap[o.id]);
                          if (ratedOrders.length === 0) return '5.0 ★';
                          const sum = ratedOrders.reduce((acc, o) => acc + (adminRatingsMap[o.id]?.rating || 5), 0);
                          return (sum / ratedOrders.length).toFixed(1) + ' ★';
                        })()}
                      </div>
                    </div>

                    <div className="vel-kpi-card">
                      <div className="vel-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)' }}>
                        <Award className="h-5 w-5 text-blue-400" />
                      </div>
                      <span className="vel-kpi-label">TESTIMONIALS READY</span>
                      <div className="vel-kpi-val">
                        {orders.filter(o => o.dbStatus === 'delivered' && adminRatingsMap[o.id]?.isTestimonial).length}
                      </div>
                    </div>
                  </div>

                  {/* Orders History Table */}
                  {(() => {
                    const deliveredOrders = orders
                      .filter(o => o.dbStatus === 'delivered')
                      .filter(o => {
                        if (!historySearch.trim()) return true;
                        const query = historySearch.toLowerCase();
                        return (
                          o.title.toLowerCase().includes(query) ||
                          o.client.toLowerCase().includes(query) ||
                          o.editor.name.toLowerCase().includes(query) ||
                          o.id.toLowerCase().includes(query)
                        );
                      });

                    if (deliveredOrders.length === 0) {
                      return (
                        <div className="vel-card" style={{ padding: '60px 20px', textAlign: 'center', alignItems: 'center', gap: '14px' }}>
                          <Archive className="h-10 w-10 text-white/30" />
                          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>No Delivered Orders Found</h2>
                          <p style={{ fontSize: '0.85rem', color: 'var(--vel-text-secondary)', maxWidth: '420px' }}>
                            {historySearch ? 'No delivered projects match your search criteria.' : 'When an active project status is updated to Completed and saved, it will automatically be archived here.'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="vel-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <table className="vel-order-table">
                          <thead>
                            <tr>
                              <th>PROJECT</th>
                              <th>CLIENT</th>
                              <th>ASSIGNED EDITOR</th>
                              <th>ACCEPTED DATE</th>
                              <th>DELIVERY & TIMELINESS</th>
                              <th>CLIENT RATING</th>
                              <th>FEEDBACK & TESTIMONIAL</th>
                              <th>ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deliveredOrders.map((ord) => {
                              const ratingObj = adminRatingsMap[ord.id];
                              const deliveredFormatted = ord.updatedAt
                                ? new Date(ord.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : ord.deadline;
                              const acceptedFormatted = getOrderAcceptedDate(ord, statusHistoryMap);
                              const perf = getDeliveryPerformance(ord, statusHistoryMap);

                              return (
                                <tr key={ord.id} className="vel-order-row">
                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{ord.title}</span>
                                        <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--vel-text-secondary)' }}>
                                          {ord.type}
                                        </span>
                                      </div>
                                      <span style={{ fontSize: '0.68rem', color: '#93C5FD', letterSpacing: '0.03em', fontFamily: 'monospace' }}>
                                        {ord.displayId}
                                      </span>
                                    </div>
                                  </td>

                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                                        {ord.client ? ord.client.charAt(0).toUpperCase() : 'C'}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>{ord.client}</span>
                                        <span style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)' }}>
                                          {ord.clientContact?.company || 'Direct Client'}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {ord.editor.avatar ? (
                                        <img src={ord.editor.avatar} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                                      ) : (
                                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#262633', display: 'inline-block' }} />
                                      )}
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{ord.editor.name}</span>
                                        <span style={{ fontSize: '0.66rem', color: 'var(--vel-text-secondary)' }}>{ord.editor.role || 'Video Editor'}</span>
                                      </div>
                                    </div>
                                  </td>

                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 600 }}>
                                          {acceptedFormatted}
                                        </span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--vel-text-secondary)' }}>Accepted</span>
                                      </div>
                                    </div>
                                  </td>

                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <span style={{ fontSize: '0.8rem', color: '#FFFFFF', fontWeight: 700 }}>
                                        {deliveredFormatted}
                                      </span>
                                      {perf.isOnTime ? (
                                        <span style={{
                                          fontSize: '0.65rem',
                                          fontWeight: 700,
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          background: 'rgba(34, 197, 94, 0.15)',
                                          color: '#4ADE80',
                                          border: '1px solid rgba(34, 197, 94, 0.35)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          width: 'fit-content'
                                        }}>
                                          <CheckCircle2 className="h-3 w-3" />
                                          <span>On Time</span>
                                        </span>
                                      ) : (
                                        <span style={{
                                          fontSize: '0.65rem',
                                          fontWeight: 700,
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          background: 'rgba(239, 68, 68, 0.15)',
                                          color: '#F87171',
                                          border: '1px solid rgba(239, 68, 68, 0.35)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          width: 'fit-content'
                                        }}>
                                          <AlertTriangle className="h-3 w-3" />
                                          <span>{perf.label}</span>
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  <td>
                                    {ratingObj ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <Star
                                            key={s}
                                            className="h-3.5 w-3.5"
                                            fill={s <= ratingObj.rating ? '#F59E0B' : 'transparent'}
                                            color={s <= ratingObj.rating ? '#F59E0B' : '#4B5563'}
                                          />
                                        ))}
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FCD34D', marginLeft: '4px' }}>
                                          {ratingObj.rating}.0
                                        </span>
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', fontStyle: 'italic' }}>
                                        Pending Client Rating
                                      </span>
                                    )}
                                  </td>

                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '280px' }}>
                                      {ratingObj?.cleanFeedback ? (
                                        <span style={{ fontSize: '0.74rem', color: 'var(--vel-text-primary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          "{ratingObj.cleanFeedback}"
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--vel-text-secondary)' }}>No review text</span>
                                      )}

                                      {ratingObj?.isTestimonial && (
                                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#FCD34D', border: '1px solid rgba(234, 179, 8, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '3px', width: 'fit-content' }}>
                                          <Award className="h-3 w-3" />
                                          <span>TESTIMONIAL READY</span>
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {ord.additionalLink && (
                                        <a
                                          href={ord.additionalLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="vel-btn-outline"
                                          style={{ padding: '4px 8px', fontSize: '0.7rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                        >
                                          <span>Drive</span>
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                      <button
                                        className="vel-btn-outline"
                                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                        onClick={() => {
                                          setSelectedOrderId(ord.id);
                                          handleNavClick('orders');
                                        }}
                                      >
                                        <span>Details</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 6: SETTINGS                                               */}
              {/* ============================================================== */}
              {activeNav === 'settings' && (
                <>
                  <div className="vel-page-header">
                    <h1 className="vel-page-h1">Settings</h1>
                    <p className="vel-page-sub">Studio configuration, integration webhooks, and team roles.</p>
                  </div>

                  <div className="vel-card" style={{ maxWidth: '600px' }}>
                    <div className="vel-field-group">
                      <label className="vel-label">Studio Name</label>
                      <input type="text" defaultValue="Velocity Edit Studio" className="vel-input" />
                    </div>

                    <div className="vel-field-group">
                      <label className="vel-label">Admin Contact Email</label>
                      <input type="email" defaultValue="admin@velocitystudio.io" className="vel-input" />
                    </div>

                    <div className="vel-field-group">
                      <label className="vel-label">Slack Notification Webhook</label>
                      <input type="text" defaultValue="https://hooks.slack.com/services/T00/B00/XXXX" className="vel-input" />
                    </div>

                    <button className="vel-btn-solid" style={{ alignSelf: 'flex-start' }} onClick={() => showToast('Studio settings saved.')}>
                      Save Preferences
                    </button>
                  </div>
                </>
              )}
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
    </div>
  );
}
