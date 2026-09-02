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
  Sparkles
} from 'lucide-react';
import CustomCursor from '../components/CustomCursor';
import { supabase } from '../supabaseClient';
import { getAdminAllOrders, getAdminOrderCounts, createOrder, updateOrder, updateOrderStatus, assignEditorToOrder, getEditorActiveOrderCounts, getUnassignedOrders, STATUS_MAP, VIDEO_TYPE_MAP, UI_TO_DB_STATUS, UI_TO_VIDEO_TYPE } from '../lib/db/orders';
import { getProfile, getApprovedEditors, getApprovedClients } from '../lib/db/profiles';
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendNotification, formatNotificationTime } from '../lib/db/notifications';
import { getEditorRatingStats } from '../lib/db/ratings';
import { subscribeToOrders, subscribeToProfiles, subscribeToUserNotifications, unsubscribeChannel } from '../lib/supabase/realtime';
import './admin.css';

// ─── Helpers ────────────────────────────────────────────────────────
/** Transform a Supabase order row into the shape the existing UI expects. */
function transformOrder(dbOrder) {
  const sm = STATUS_MAP[dbOrder.status] || STATUS_MAP.received;
  const editorProfile = dbOrder.editor;
  const clientProfile = dbOrder.client;

  return {
    id: dbOrder.id,
    dbId: dbOrder.id,
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
    notes: dbOrder.admin_notes || '',
    brief: dbOrder.brief || '',
    driveLink: dbOrder.drive_link || '',
    dropboxLink: dbOrder.dropbox_link || '',
    additionalLink: dbOrder.additional_link || '',
    clientId: dbOrder.client_id,
    editorId: dbOrder.editor_id,
    adminId: dbOrder.admin_id,
    createdAt: dbOrder.created_at,
  };
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
      setOrders(data.map(transformOrder));
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

  // Selected order tracking
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0] || {
    id: '', title: '', client: '', type: '', editor: { name: 'Unassigned', role: '', avatar: '' },
    clientContact: { name: '', company: '' }, deadline: '', status: '', badgeClass: '',
    currentStep: 0, editorDeadline: '', clientDeadline: '', notes: '', dbStatus: 'received',
  };

  // Auto-select first order when orders load
  useEffect(() => {
    if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

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
    newClient: '',
    nomenclature: '',
    format: 'YouTube Longform (16:9)',
    brief: '',
    rawFootageLink: '',
    brandAssetsLink: '',
    internalDeadline: '',
    clientDeadline: ''
  });

  // ─── Handlers (Supabase-backed) ───────────────────────────────────

  const handleOrderFieldChange = async (field, val) => {
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;

    if (field === 'status') {
      // Map UI label to DB enum
      const dbStatus = UI_TO_DB_STATUS[val];
      if (!dbStatus) return;

      // Optimistic update
      const sm = STATUS_MAP[dbStatus];
      setOrders(prev => prev.map(o => {
        if (o.id === selectedOrderId) {
          return { ...o, status: sm.label, dbStatus, badgeClass: sm.badgeClass, currentStep: sm.step };
        }
        return o;
      }));

      // Persist to Supabase
      const { error } = await updateOrderStatus(
        order.dbId || order.id, dbStatus, adminProfile?.id, order.dbStatus, null
      );
      if (error) {
        showToast('Error updating status: ' + error.message);
        fetchOrders(); // Revert on failure
      }
    } else {
      // Other field updates (notes, deadlines)
      const dbField = field === 'editorDeadline' ? 'editor_deadline'
        : field === 'clientDeadline' ? 'client_deadline'
        : field === 'notes' ? 'admin_notes'
        : field;

      setOrders(prev => prev.map(o => {
        if (o.id === selectedOrderId) return { ...o, [field]: val };
        return o;
      }));

      // Debounced persist for text fields will be handled by Save button
    }
  };

  const handleSaveOrderChanges = async () => {
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;

    const { error } = await updateOrder(order.dbId || order.id, {
      editor_deadline: order.editorDeadline ? new Date(order.editorDeadline).toISOString() : null,
      client_deadline: order.clientDeadline ? new Date(order.clientDeadline).toISOString() : null,
      admin_notes: order.notes || null,
    });

    if (error) {
      showToast('Error saving: ' + error.message);
    } else {
      showToast(`Changes to order saved successfully!`);
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

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.nomenclature) {
      showToast('Please enter a project nomenclature.');
      return;
    }

    // Find the selected client
    const selectedClient = clientsList.find(cl =>
      cl.name === (createForm.newClient || createForm.existingClient)
    );

    if (!selectedClient && !createForm.newClient) {
      showToast('Please select or create a client.');
      return;
    }

    const videoType = UI_TO_VIDEO_TYPE[createForm.format] || 'youtube_longform';

    const payload = {
      order_name: createForm.nomenclature,
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

    showToast(`Order created successfully!`);

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
      newClient: '', nomenclature: '', format: 'YouTube Longform (16:9)',
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

    const { error } = await assignEditorToOrder(
      assignForm.orderId, assignForm.editorId, adminProfile?.id
    );

    if (error) {
      showToast('Error assigning: ' + error.message);
      return;
    }

    // Notify the editor
    if (assignForm.notifyEditor && assignForm.editorId) {
      await sendNotification(
        assignForm.editorId,
        `New project assigned: ${assignForm.project}`,
        `You have been assigned to "${assignForm.project}". Please review the brief.`
      );
    }

    showToast(`Project assigned to ${assignForm.editor}! Notification dispatched.`);
    await Promise.all([fetchOrders(), fetchEditors()]);
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

  const filteredOrders = orders.filter(o => {
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
          <a href="/" className="vel-brand-header">
            <img
              src="/image/mne_logo.png"
              alt="MotionNodeEdits"
              className="vel-brand-logo-img"
            />
            <div>
              <div className="vel-brand-title">MotionNodeEdits</div>
              <div className="vel-brand-sub">Admin Studio Panel</div>
            </div>
          </a>

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

                        <div className="vel-form-grid-2">
                          <div className="vel-field-group">
                            <label className="vel-label">Select Client</label>
                            <select
                              className="vel-select"
                              value={assignForm.client}
                              onChange={(e) => {
                                const clientName = e.target.value;
                                setAssignForm(prev => ({ ...prev, client: clientName }));
                              }}
                            >
                              <option value="">-- Choose Client --</option>
                              {clientsList.map((cl) => (
                                <option key={cl.id} value={cl.name}>{cl.name}</option>
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
                                const matched = orders.find(o => o.title === selectedTitle);
                                setAssignForm(prev => ({
                                  ...prev,
                                  project: selectedTitle,
                                  orderId: matched?.dbId || matched?.id || '',
                                  client: matched?.client || prev.client,
                                  clientDeadline: matched?.clientDeadline || prev.clientDeadline,
                                  internalDeadline: matched?.editorDeadline || prev.internalDeadline,
                                  brief: matched?.notes || prev.brief,
                                }));
                              }}
                            >
                              <option value="">-- Choose Unassigned Project --</option>
                              {orders.map((ord) => (
                                <option key={ord.id} value={ord.title}>{ord.title} ({ord.client})</option>
                              ))}
                            </select>
                          </div>
                        </div>
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
                            <label className="vel-label">Client Deadline</label>
                            <input
                              type="date"
                              className="vel-input"
                              value={assignForm.clientDeadline}
                              onChange={(e) => setAssignForm({ ...assignForm, clientDeadline: e.target.value })}
                            />
                          </div>

                          <div className="vel-field-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label className="vel-label">Internal Deadline</label>
                              <span style={{ fontSize: '0.62rem', color: 'var(--vel-text-tertiary)', letterSpacing: '0.05em' }}>SUGGESTED</span>
                            </div>
                            <input
                              type="date"
                              className="vel-input"
                              value={assignForm.internalDeadline}
                              onChange={(e) => setAssignForm({ ...assignForm, internalDeadline: e.target.value })}
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

                      <div className="vel-form-grid-2">
                        <div className="vel-field-group">
                          <label className="vel-label">Select Existing Client</label>
                          <select
                            className="vel-select"
                            value={createForm.existingClient}
                            onChange={(e) => setCreateForm({ ...createForm, existingClient: e.target.value, newClient: '' })}
                          >
                            <option value="">-- Choose Client --</option>
                            {clientsList.map((cl) => (
                              <option key={cl.id} value={cl.name}>{cl.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="vel-field-group">
                          <label className="vel-label">Or Create New Entity</label>
                          <input
                            type="text"
                            placeholder="Client / Brand Name"
                            className="vel-input"
                            value={createForm.newClient}
                            onChange={(e) => setCreateForm({ ...createForm, newClient: e.target.value })}
                          />
                        </div>
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
                      <p className="vel-page-sub">Managing {orders.length} projects currently in production.</p>
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
                              <td style={{ fontWeight: 700, color: 'var(--vel-text-secondary)' }}>{ord.id}</td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 700 }}>{ord.title}</span>
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
                                <ChevronRight className="h-4 w-4 text-white/30" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Right: Order Detail & Admin Controls Drawer */}
                    <div className="vel-card" style={{ gap: '20px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--vel-text-secondary)' }}>{selectedOrder.id}</span>
                          <span className={selectedOrder.badgeClass}>{selectedOrder.status}</span>
                        </div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedOrder.title}</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--vel-text-secondary)' }}>
                          {selectedOrder.client} • {selectedOrder.type}
                        </p>
                      </div>

                      {/* Milestone Stepper */}
                      <div className="vel-stepper-wrap">
                        <div className="vel-stepper-line" />
                        {[
                          { key: 'RECV', label: 'RECV', step: 0 },
                          { key: 'ASGN', label: 'ASGN', step: 1 },
                          { key: 'EDIT', label: 'EDIT', step: 2 },
                          { key: 'REV', label: 'REV', step: 3 },
                          { key: 'DELV', label: 'DELV', step: 4 },
                        ].map((st) => {
                          const isDone = selectedOrder.currentStep > st.step;
                          const isActive = selectedOrder.currentStep === st.step;
                          return (
                            <div key={st.key} className="vel-step-item">
                              <div className={`vel-step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                                {isDone ? <Check className="h-2.5 w-2.5" /> : isActive ? '◉' : ''}
                              </div>
                              <span className="vel-step-label">{st.label}</span>
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
                              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{selectedOrder.editor.name}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)' }}>{selectedOrder.editor.role}</div>
                            </div>
                          </div>
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

                      {/* ADMIN CONTROLS */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--vel-border)', paddingTop: '16px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          ADMIN CONTROLS
                        </span>

                        <div className="vel-field-group">
                          <label className="vel-label">Update Status</label>
                          <select
                            className="vel-select"
                            value={selectedOrder.status || 'RECEIVED'}
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
                        <button className="vel-btn-solid" style={{ flex: 1 }} onClick={handleSaveOrderChanges}>
                          <Save className="h-3.5 w-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  </div>
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
