import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ExternalLink,
  Menu,
  X,
  CheckCircle2,
  Lock,
  ShieldCheck,
  EyeOff,
  Eye,
  ChevronDown,
  ChevronRight,
  Headphones,
  Mail,
  MessageSquare,
  Award
} from 'lucide-react';
import CustomCursor from '../components/CustomCursor';
import { supabase } from '../supabaseClient';
import { checkRouteAuth } from '../lib/middleware/authGuard';
import { isGoogleUser } from '../lib/auth/authUtils';
import { updateProfile } from '../lib/db/profiles';
import { getEditorActiveProject, getEditorProjectHistory, getEditorStats, updateOrderStatus, updateOrder, formatOrderCode } from '../lib/db/orders';
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendNotification, formatNotificationTime } from '../lib/db/notifications';
import { getEditorRatingStats } from '../lib/db/ratings';
import { subscribeToOrders, subscribeToUserNotifications, unsubscribeChannel } from '../lib/supabase/realtime';
import './client.css';
import './editor.css';

const isGoogleDriveLink = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com');
};

// SECURITY FIX: Protect against reverse tabnabbing and untrusted protocols (e.g. javascript:)
const safeOpenUrl = (url) => {
  if (!url || typeof url !== 'string') return;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    window.open(trimmed, '_blank', 'noopener,noreferrer');
  }
};

// Fallback male cartoon avatar SVG data URI (short dark hair, handsome smile, stylish shirt)
const DEFAULT_CARTOON_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23B6E3F4"/><circle cx="50" cy="48" r="22" fill="%23FFD8B3"/><path d="M28 42 C28 20 72 20 72 42 C68 32 60 26 50 26 C40 26 32 32 28 42 Z" fill="%232C1B18"/><circle cx="43" cy="48" r="2.5" fill="%231E1E28"/><circle cx="57" cy="48" r="2.5" fill="%231E1E28"/><path d="M44 56 Q50 62 56 56" stroke="%231E1E28" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M24 88 C24 72 38 68 50 68 C62 68 76 72 76 88 Z" fill="%232563EB"/><polygon points="46,68 54,68 50,75" fill="%23FFFFFF"/></svg>`;

// Parses markdown-style inline backticks (`tag`) into sleek badge tags
const renderFaqTextWithTags = (text) => {
  if (!text || typeof text !== 'string') return text;
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <span key={index} className="cp-faq-code-tag">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
};

// Editor Knowledge Base & FAQs
const EDITOR_FAQS = [
  {
    q: 'How are project assignments and deadlines managed?',
    a: 'Project assignments are dispatched directly by the production supervisor through your workspace:',
    points: [
      'When an assignment is allocated, you will receive an in-app notification and an instant alert on the topbar.',
      'Open the `Present Project` tab to review the creative brief, footage drive link, target duration, aspect ratio, and editing guidelines.',
      'Click `Update to In Progress` when you start editing. This locks the timer and informs the client and producer that production is underway.'
    ]
  },
  {
    q: 'What are the master deliverable specs and folder guidelines?',
    a: 'All completed project cuts must adhere to MotionNodeEdits studio delivery specifications:',
    points: [
      '`Resolution & Codec`: Master renders should be uploaded in `ProRes 422HQ` or `H.264/H.265 4K` at full bit-depth (minimum 50 Mbps bitrate for 4K).',
      '`Google Drive Links`: Upload finished cuts and clean master exports to your designated Google Drive deliverable folder with link sharing set to `Anyone with the link can view`.',
      '`Timestamped Versions`: Label exports cleanly as `[ProjectCode]_V1_Master.mp4` or `[ProjectCode]_V2_Revision.mp4` to ensure seamless client review.'
    ]
  },
  {
    q: 'How do client revision requests work?',
    a: 'Clients review your submitted cut directly in their workspace and provide timestamped revision notes:',
    points: [
      'Check your `Present Project` tab for revision notes or updated creative direction.',
      'Address each revision point methodically, update the cut, and re-submit the updated Google Drive link.',
      'Turnaround for standard revision cycles is typically within `12 to 24 hours`.'
    ]
  },
  {
    q: 'What should I do if raw footage or asset links are broken or missing permissions?',
    a: 'If a client footage link is inaccessible, password-protected, or missing required creative assets (such as logo vectors or audio stems), click `Contact Producer on WhatsApp` or message your production coordinator immediately. We will contact the client within 30 minutes to grant access.'
  },
  {
    q: 'How is editor performance and turnaround tracked?',
    a: 'Your turnaround speed, on-time delivery rate, and client satisfaction stars are automatically computed in your `Project History` ledger. Editors maintaining an on-time score above 95% receive priority allocations for premium tier and retainer campaigns.'
  },
  {
    q: 'Need coordinator or producer support?',
    a: 'For urgent project blockers, render pipeline assistance, or deadline extensions, reach out to the lead producer directly:',
    points: [
      '`WhatsApp Coordinator`: Instant 24/7 direct messaging for urgent project questions and render issues',
      '`Production Email`: hello@motionnodeedits.com for formal briefs and asset queries',
      '`Feedback Channel`: Suggest workflow improvements or software plugin requests'
    ],
    actions: [
      {
        label: 'WhatsApp Producer',
        href: 'https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I%20am%20an%20editor%20working%20on%20a%20project%20and%20need%20producer%20assistance',
        external: true,
        primary: true,
        type: 'whatsapp'
      },
      {
        label: 'Production Desk',
        href: 'mailto:hello@motionnodeedits.com?subject=Editor%20Production%20Inquiry%20-%20MotionNodeEdits',
        external: false,
        primary: false,
        type: 'email'
      },
      {
        label: 'Feedback Portal',
        href: '/feedback',
        external: false,
        primary: false,
        type: 'feedback'
      }
    ]
  }
];

export default function EditorDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editorProfile, setEditorProfile] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !session || !session.user) {
        window.location.href = '/login';
        return;
      }

      const { authorized, profile } = await checkRouteAuth({
        requiredRole: 'editor',
        redirectOnFail: '/login',
      });

      if (authorized && profile) {
        setIsAuthenticated(true);
        setCurrentUser(session.user);
        setEditorProfile(profile);
      }
    }
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.location.href = '/login';
      } else if (session?.user) {
        setCurrentUser(session.user);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const [activeNav, setActiveNav] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mne_editor_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleSidebarCollapse = () => {
    if (window.innerWidth < 900) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('mne_editor_sidebar_collapsed', String(next));
        } catch (_) {}
        return next;
      });
    }
  };

  const [historyFilter, setHistoryFilter] = useState('all');
  const [projectStatus, setProjectStatus] = useState('Editing in Process');
  const [deliverableLink, setDeliverableLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Close notifications or profile dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // ─── Profile Management State ─────────────────────────────────────
  const [profileSubTab, setProfileSubTab] = useState('profile'); // 'profile' | 'password'
  const [profileForm, setProfileForm] = useState({
    username: '',
    full_name: '',
    editor_title: '',
    phone: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ─── Password Management State ────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Synchronize profileForm whenever editorProfile is loaded or updated
  useEffect(() => {
    if (editorProfile) {
      setProfileForm({
        username: editorProfile.username || (editorProfile.email ? editorProfile.email.split('@')[0] : ''),
        full_name: editorProfile.full_name || '',
        editor_title: editorProfile.editor_title || '',
        phone: editorProfile.phone || '',
      });
    }
  }, [editorProfile]);

  const hasProfileChanges = Boolean(
    editorProfile && (
      (profileForm.username || '').trim() !== (editorProfile.username || '').trim() ||
      (profileForm.full_name || '').trim() !== (editorProfile.full_name || '').trim() ||
      (profileForm.editor_title || '').trim() !== (editorProfile.editor_title || '').trim() ||
      (profileForm.phone || '').trim() !== (editorProfile.phone || '').trim()
    )
  );

  const hasPasswordChanges = Boolean(
    passwordForm.currentPassword.trim() &&
    passwordForm.newPassword.trim() &&
    passwordForm.confirmPassword.trim()
  );

  // Guaranteed male cartoon avatar helper
  const getAccountAvatar = useCallback(() => {
    if (isGoogleUser(currentUser)) {
      const googlePic = editorProfile?.avatar_url || currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture;
      if (googlePic && (googlePic.includes('googleusercontent.com') || googlePic.includes('google.com'))) {
        return googlePic;
      }
    }
    if (editorProfile?.avatar_url && editorProfile.avatar_url.startsWith('http') && !editorProfile.avatar_url.includes('dicebear.com')) {
      return editorProfile.avatar_url;
    }
    if (editorProfile?.avatar_url && editorProfile.avatar_url.includes('dicebear.com') && editorProfile.avatar_url.includes('hair=short')) {
      return editorProfile.avatar_url;
    }
    const rawSeed = (editorProfile?.username || editorProfile?.email || currentUser?.email || 'Editor').trim();
    const cleanSeed = rawSeed.replace(/[^a-zA-Z0-9]/g, '') || 'Editor';
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=male-${encodeURIComponent(cleanSeed)}&hair=short01,short02,short03,short04,short05,short06,short07,short08,short09,short10,short11,short12,short13,short14,short15,short16&hairColor=0e0e0e,2c1b18,4a312c,6a4e42,85461e&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }, [editorProfile, currentUser]);

  // Auto-upgrade any old default dicebear avatar to the male avatar in the database
  useEffect(() => {
    if (editorProfile?.id && editorProfile.avatar_url && editorProfile.avatar_url.includes('dicebear.com') && !editorProfile.avatar_url.includes('hair=short')) {
      const maleAvatar = getAccountAvatar();
      supabase
        .from('profiles')
        .update({ avatar_url: maleAvatar })
        .eq('id', editorProfile.id)
        .then(() => {
          setEditorProfile(prev => prev ? { ...prev, avatar_url: maleAvatar } : prev);
        });
    }
  }, [editorProfile?.id, editorProfile?.avatar_url, getAccountAvatar]);

  // ─── Profile & Password Handlers ──────────────────────────────────
  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser?.id) return;

    const trimmedUsername = (profileForm.username || '').trim();
    const trimmedName = (profileForm.full_name || '').trim();
    const trimmedTitle = (profileForm.editor_title || '').trim();
    const trimmedPhone = (profileForm.phone || '').trim();

    if (!hasProfileChanges) {
      showToast('No changes detected to save.');
      return;
    }

    if (trimmedUsername && trimmedUsername.length < 2) {
      showToast('Username must be at least 2 characters.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const isNameChanged = trimmedName && trimmedName !== (editorProfile?.full_name || '').trim();
      const payload = {
        editor_title: trimmedTitle,
        phone: trimmedPhone,
      };
      if (trimmedUsername) payload.username = trimmedUsername;
      if (trimmedName) payload.full_name = trimmedName;
      if (isNameChanged && editorProfile?.full_name) {
        payload.previous_name = editorProfile.full_name;
      }

      const { data: updatedProfile, error: dbError } = await updateProfile(currentUser.id, payload);

      if (dbError) {
        console.error('[EditorDashboard] Profile update DB error:', dbError);
        showToast(dbError.message || 'Failed to update profile.');
        setIsSavingProfile(false);
        return;
      }

      try {
        await supabase.auth.updateUser({
          data: {
            username: trimmedUsername || editorProfile?.username,
            full_name: trimmedName || editorProfile?.full_name,
            editor_title: trimmedTitle,
            phone: trimmedPhone,
            previous_name: payload.previous_name || editorProfile?.previous_name || null,
          },
        });
      } catch (authErr) {
        console.warn('[EditorDashboard] Auth metadata sync warning:', authErr);
      }

      setEditorProfile(prev => ({
        ...prev,
        ...(updatedProfile || {}),
        username: trimmedUsername || prev?.username,
        full_name: trimmedName || prev?.full_name,
        editor_title: trimmedTitle || prev?.editor_title,
        phone: trimmedPhone || prev?.phone,
        previous_name: payload.previous_name || prev?.previous_name || null,
      }));

      showToast('Profile updated successfully!');
    } catch (err) {
      console.error('[EditorDashboard] Profile update unexpected error:', err);
      showToast(err.message || 'Error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser) return;

    if (isGoogleUser(currentUser)) {
      showToast('Google OAuth accounts cannot change password here. Manage via Google.');
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      showToast('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      showToast('Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword === currentPassword) {
      showToast('New password must be different from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match. Please re-enter.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const userEmail = currentUser.email || editorProfile?.email;
      if (!userEmail) {
        showToast('Unable to identify account email.');
        setIsChangingPassword(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (verifyError) {
        showToast('Current password is incorrect.');
        setIsChangingPassword(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('[EditorDashboard] Password update error:', updateError);
        showToast(updateError.message || 'Failed to update password.');
        setIsChangingPassword(false);
        return;
      }

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      showToast('Password updated successfully!');
    } catch (err) {
      console.error('[EditorDashboard] Password update error:', err);
      showToast(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

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
    <div className="cp-layout ed-layout">
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
      {/* SIDEBAR NAVIGATION (Collapsible matching client design)            */}
      {/* ------------------------------------------------------------------ */}
      <aside className={`cp-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div>
          {/* Brand Header */}
          <div className="cp-brand-header-wrapper">
            <div
              className="cp-brand-header"
              style={{ cursor: 'pointer' }}
              onClick={() => handleNavClick('home')}
            >
              <div className="cp-brand-badge">
                <img
                  src="/image/mne_logo.png"
                  alt="MotionNodeEdits"
                  className="cp-brand-logo-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'block';
                    }
                  }}
                />
                <span className="cp-brand-badge-letter" style={{ display: 'none' }}>M</span>
              </div>
              <div className="cp-brand-info">
                <div className="cp-brand-title">MotionNodeEdits</div>
                <div className="cp-brand-sub">EDITOR WORKSPACE</div>
              </div>
            </div>

            <button
              type="button"
              className="cp-sidebar-toggle-btn"
              onClick={toggleSidebarCollapse}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {/* Section Header */}
          <div className="cp-sidebar-section-title">WORKSPACE</div>

          {/* Primary Nav Links */}
          <nav className="cp-nav-list">
            <button
              type="button"
              className={`cp-nav-item ${activeNav === 'home' ? 'active' : ''}`}
              onClick={() => handleNavClick('home')}
              title="Home"
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Home</span>
            </button>

            <button
              type="button"
              className={`cp-nav-item ${activeNav === 'present' ? 'active' : ''}`}
              onClick={() => handleNavClick('present')}
              title="Present Project"
            >
              <Tv2 className="h-4 w-4 shrink-0" />
              <span>{activeProject ? 'Present Project (1)' : 'Present Project'}</span>
            </button>

            <button
              type="button"
              className={`cp-nav-item ${activeNav === 'history' ? 'active' : ''}`}
              onClick={() => handleNavClick('history')}
              title="Project History"
            >
              <History className="h-4 w-4 shrink-0" />
              <span>Project History</span>
            </button>

            <button
              type="button"
              className={`cp-nav-item ${activeNav === 'profile' ? 'active' : ''}`}
              onClick={() => handleNavClick('profile')}
              title="Profile"
            >
              <User className="h-4 w-4 shrink-0" />
              <span>Profile</span>
            </button>

            <button
              type="button"
              className={`cp-nav-item ${activeNav === 'faq' ? 'active' : ''}`}
              onClick={() => handleNavClick('faq')}
              title="Support / FAQ"
            >
              <Headphones className="h-4 w-4 shrink-0" />
              <span>Support / FAQ</span>
            </button>
          </nav>
        </div>

        {/* Footer: User Profile Card & Log Out Button */}
        <div className="cp-sidebar-footer">
          <div
            className="cp-sidebar-user-card"
            onClick={() => handleNavClick('profile')}
            title="Manage Profile Settings"
          >
            <div className="cp-sidebar-user-avatar">
              <img
                src={getAccountAvatar()}
                alt=""
                onError={(e) => { e.currentTarget.src = DEFAULT_CARTOON_AVATAR; }}
              />
            </div>
            <div className="cp-sidebar-user-info">
              <span className="cp-sidebar-user-name">
                {editorProfile?.username || editorProfile?.full_name || currentUser?.email?.split('@')[0] || 'Editor'}
              </span>
              <span className="cp-sidebar-user-email">
                {editorProfile?.editor_title || editorProfile?.email || currentUser?.email || 'Video Editor'}
              </span>
            </div>
            <ChevronRight className="cp-sidebar-user-arrow h-4 w-4" />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="cp-sidebar-logout-btn"
            title="Log Out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Log Out</span>
          </button>
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
              onClick={toggleSidebarCollapse}
              aria-label="Toggle navigation"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="cp-topbar-title">Editor Workspace</span>
          </div>

          <div className="cp-topbar-actions">
            {/* WhatsApp Contact Us Button */}
            <a
              href="https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I%20am%20an%20editor%20working%20on%20a%20project%20and%20need%20producer%20assistance"
              target="_blank"
              rel="noopener noreferrer"
              className="cp-topbar-wp-btn"
              title="Contact Producer on WhatsApp"
            >
              <svg className="cp-topbar-wp-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>Contact us WP</span>
            </a>

            {/* Notification Bell */}
            <div className="notif-wrapper" ref={notifRef}>
              <button
                className={`cp-icon-btn ${notifOpen ? 'active' : ''}`}
                aria-label="Notifications"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileMenuOpen(false);
                }}
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

            {/* Profile Shortcuts Dropdown */}
            <div className="cp-user-menu-wrapper" ref={profileMenuRef}>
              <button
                type="button"
                className={`cp-user-avatar-btn ${profileMenuOpen ? 'active' : ''}`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#1E1E28',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  border: profileMenuOpen ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.15)',
                  padding: 0,
                  transition: 'all 0.15s ease'
                }}
                onClick={() => {
                  setProfileMenuOpen(!profileMenuOpen);
                  setNotifOpen(false);
                }}
                aria-label="Editor profile menu"
              >
                <img
                  src={getAccountAvatar()}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.src = DEFAULT_CARTOON_AVATAR; }}
                />
              </button>

              {profileMenuOpen && (
                <div className="cp-profile-dropdown">
                  <div className="cp-dropdown-header">
                    <div className="cp-dropdown-avatar">
                      <img
                        src={getAccountAvatar()}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.src = DEFAULT_CARTOON_AVATAR; }}
                      />
                    </div>
                    <div className="cp-dropdown-info">
                      <div className="cp-dropdown-name-row">
                        <span className="cp-dropdown-name">
                          {editorProfile?.full_name || currentUser?.user_metadata?.full_name || 'Editor User'}
                        </span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-white/70 flex-shrink-0" title="Verified Editor" />
                      </div>
                      <span className="cp-dropdown-email">
                        {editorProfile?.editor_title || editorProfile?.email || currentUser?.email || 'Video Editor'}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                  </div>

                  <div className="cp-dropdown-summary-pill">
                    <span className="cp-dropdown-summary-title">Active Assignment</span>
                    <span className="cp-dropdown-summary-val">{activeProject ? '1 In Progress' : 'Standby'}</span>
                  </div>

                  <div className="cp-dropdown-menu">
                    <button
                      type="button"
                      className={`cp-dropdown-btn ${activeNav === 'home' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavClick('home');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <div className="cp-dropdown-btn-left">
                        <Home className="h-4 w-4 text-white/70" />
                        <span>Dashboard</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`cp-dropdown-btn ${activeNav === 'present' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavClick('present');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <div className="cp-dropdown-btn-left">
                        <Tv2 className="h-4 w-4 text-white/70" />
                        <span>Present Project</span>
                      </div>
                      {activeProject && (
                        <span className="cp-dropdown-pill">Active</span>
                      )}
                    </button>

                    <button
                      type="button"
                      className={`cp-dropdown-btn ${activeNav === 'history' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavClick('history');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <div className="cp-dropdown-btn-left">
                        <History className="h-4 w-4 text-white/70" />
                        <span>Project History</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`cp-dropdown-btn ${activeNav === 'profile' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavClick('profile');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <div className="cp-dropdown-btn-left">
                        <User className="h-4 w-4 text-white/70" />
                        <span>Profile & Security</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`cp-dropdown-btn ${activeNav === 'faq' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavClick('faq');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <div className="cp-dropdown-btn-left">
                        <Headphones className="h-4 w-4 text-white/70" />
                        <span>Support / FAQ</span>
                      </div>
                    </button>

                    <div className="cp-dropdown-hr" />

                    <button
                      type="button"
                      className="cp-dropdown-btn logout"
                      onClick={(e) => {
                        setProfileMenuOpen(false);
                        handleLogout(e);
                      }}
                    >
                      <div className="cp-dropdown-btn-left">
                        <LogOut className="h-4 w-4 text-rose-400" />
                        <span>Log Out</span>
                      </div>
                    </button>
                  </div>
                </div>
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
                            onClick={() => safeOpenUrl(activeProject.drive_link)}
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
                                  onClick={() => safeOpenUrl(activeProject.drive_link)}
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
                                  onClick={() => safeOpenUrl(activeProject.dropbox_link)}
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
                                  onClick={() => safeOpenUrl(activeProject.additional_link)}
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

              {/* ============================================================== */}
              {/* VIEW 4: PROFILE & SECURITY (2-Column Layout)                   */}
              {/* ============================================================== */}
              {activeNav === 'profile' && (
                <>
                  <div className="cp-header-block">
                    <h1 className="cp-title-h1">Profile & Security</h1>
                    <p className="cp-subtext">Manage your profile, personal details, and account security.</p>
                  </div>

                  <div className="cp-profile-layout">
                    {/* Left Column: Summary Card & Navigation Tabs */}
                    <div className="cp-profile-left-col">
                      {/* Top Card: Account Profile Settings Summary */}
                      <div className="cp-profile-summary-card">
                        <div className="cp-avatar-wrap">
                          <img
                            src={getAccountAvatar()}
                            alt={editorProfile?.full_name || 'Editor'}
                            className="cp-avatar-img"
                            onError={(e) => { e.currentTarget.src = DEFAULT_CARTOON_AVATAR; }}
                          />
                        </div>

                        <div>
                          <span className="cp-profile-card-label">WORKSPACE</span>
                          <h2 className="cp-profile-card-title">Editor Settings</h2>
                          <p className="cp-profile-card-desc">
                            Update your editor profile details, change your password, and manage account security.
                          </p>
                        </div>
                      </div>

                      {/* Bottom Card: Navigation Menu */}
                      <div className="cp-profile-subnav-card">
                        <button
                          type="button"
                          className={`cp-profile-subnav-btn ${profileSubTab === 'profile' ? 'active' : ''}`}
                          onClick={() => setProfileSubTab('profile')}
                        >
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </button>
                        <button
                          type="button"
                          className={`cp-profile-subnav-btn ${profileSubTab === 'password' ? 'active' : ''}`}
                          onClick={() => setProfileSubTab('password')}
                        >
                          <Eye className="h-4 w-4" />
                          <span>Change Password</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Active Tab Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <div className="cp-profile-main-card">
                        {profileSubTab === 'profile' ? (
                          /* TAB 1: Personal Information */
                          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div className="cp-profile-main-header">
                              <span className="cp-profile-tag">PROFILE</span>
                              <h2 className="cp-profile-main-title">Personal Information</h2>
                              <p className="cp-profile-main-subtext">
                                Keep your editor credentials up to date so administration and project coordination stay aligned.
                              </p>
                            </div>

                            <div className="cp-form-group">
                              <label className="cp-form-label">
                                <span className="cp-form-required">*</span> Username
                              </label>
                              <input
                                type="text"
                                value={profileForm.username}
                                onChange={(e) => setProfileForm(p => ({ ...p, username: e.target.value }))}
                                placeholder="Username"
                                className="cp-form-input"
                                required
                              />
                            </div>

                            <div className="cp-form-group">
                              <label className="cp-form-label">
                                <span className="cp-form-required">*</span> Email
                              </label>
                              <div className="cp-form-input-wrap">
                                <input
                                  type="email"
                                  value={editorProfile?.email || currentUser?.email || ''}
                                  disabled
                                  className="cp-form-input"
                                  style={{ paddingRight: '36px' }}
                                />
                                <Lock className="h-4 w-4" style={{ position: 'absolute', right: '12px', color: 'var(--cp-text-tertiary)' }} />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                              <div className="cp-form-group">
                                <label className="cp-form-label">Full Name</label>
                                <input
                                  type="text"
                                  value={profileForm.full_name}
                                  onChange={(e) => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                                  placeholder="Your full name"
                                  className="cp-form-input"
                                />
                              </div>

                              <div className="cp-form-group">
                                <label className="cp-form-label">Editor Role / Title</label>
                                <input
                                  type="text"
                                  value={profileForm.editor_title}
                                  onChange={(e) => setProfileForm(p => ({ ...p, editor_title: e.target.value }))}
                                  placeholder="e.g. Senior Video Editor"
                                  className="cp-form-input"
                                />
                              </div>
                            </div>

                            <div className="cp-form-group">
                              <label className="cp-form-label">Phone Number</label>
                              <input
                                type="tel"
                                value={profileForm.phone}
                                onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                                placeholder="e.g. +91 89853 51756"
                                className="cp-form-input"
                              />
                            </div>

                            <div className="cp-profile-helper-box">
                              Your email is used for account verification, system alerts, and project dispatches.
                            </div>

                            <button
                              type="submit"
                              disabled={isSavingProfile || !hasProfileChanges}
                              className="cp-btn-primary-action"
                            >
                              {isSavingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                          </form>
                        ) : (
                          /* TAB 2: Change Password */
                          <div>
                            <div className="cp-profile-main-header" style={{ marginBottom: '18px' }}>
                              <span className="cp-profile-tag">SECURITY</span>
                              <h2 className="cp-profile-main-title">Change Password</h2>
                              <p className="cp-profile-main-subtext">
                                Choose a strong password you do not reuse on other services.
                              </p>
                            </div>

                            {isGoogleUser(currentUser) ? (
                              <div style={{ background: 'var(--cp-bg-card-inner)', border: '1px solid var(--cp-border)', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: '#FFFFFF', marginTop: '2px' }} />
                                <div>
                                  <p style={{ fontSize: '0.86rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                                    Signed in with Google
                                  </p>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--cp-text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                                    Your account is authenticated securely via Google OAuth. To update your password or login security, manage your settings directly in your Google Account.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div className="cp-form-group">
                                  <label className="cp-form-label">
                                    <span className="cp-form-required">*</span> Current Password
                                  </label>
                                  <div className="cp-form-input-wrap">
                                    <input
                                      type={showCurrentPassword ? 'text' : 'password'}
                                      value={passwordForm.currentPassword}
                                      onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                                      placeholder="Current password"
                                      className="cp-form-input"
                                      style={{ paddingRight: '40px' }}
                                      required
                                    />
                                    <button
                                      type="button"
                                      className="cp-input-eye-btn"
                                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                      tabIndex={-1}
                                      aria-label="Toggle current password visibility"
                                    >
                                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="cp-form-group">
                                  <label className="cp-form-label">
                                    <span className="cp-form-required">*</span> New Password
                                  </label>
                                  <div className="cp-form-input-wrap">
                                    <input
                                      type={showNewPassword ? 'text' : 'password'}
                                      value={passwordForm.newPassword}
                                      onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                                      placeholder="New password"
                                      className="cp-form-input"
                                      style={{ paddingRight: '40px' }}
                                      required
                                    />
                                    <button
                                      type="button"
                                      className="cp-input-eye-btn"
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                      tabIndex={-1}
                                      aria-label="Toggle new password visibility"
                                    >
                                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="cp-form-group">
                                  <label className="cp-form-label">
                                    <span className="cp-form-required">*</span> Confirm Password
                                  </label>
                                  <div className="cp-form-input-wrap">
                                    <input
                                      type={showConfirmPassword ? 'text' : 'password'}
                                      value={passwordForm.confirmPassword}
                                      onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                      placeholder="Confirm password"
                                      className="cp-form-input"
                                      style={{ paddingRight: '40px' }}
                                      required
                                    />
                                    <button
                                      type="button"
                                      className="cp-input-eye-btn"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      tabIndex={-1}
                                      aria-label="Toggle confirm password visibility"
                                    >
                                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="cp-profile-helper-box">
                                  Use at least one unique password for MotionNodeEdits and rotate it if you share device access.
                                </div>

                                <button
                                  type="submit"
                                  disabled={isChangingPassword || !hasPasswordChanges}
                                  className="cp-btn-primary-action"
                                >
                                  {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Centered Brand Copyright Footer */}
                      <div className="cp-profile-footer">
                        MotionNodeEdits 2026
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ============================================================== */}
              {/* VIEW 5: SUPPORT & FREQUENTLY ASKED QUESTIONS                   */}
              {/* ============================================================== */}
              {activeNav === 'faq' && (
                <div className="cp-faq-view">
                  <div className="cp-faq-header">
                    <span className="cp-faq-category">HELP</span>
                    <h1 className="cp-faq-title">Frequently Asked Questions</h1>
                    <p className="cp-faq-subtitle">
                      Guidelines for project deliverables, master render specs, and producer coordination.
                    </p>
                  </div>

                  <div className="cp-faq-list">
                    {EDITOR_FAQS.map((faq, idx) => (
                      <div key={idx} className="cp-faq-card">
                        <h3 className="cp-faq-card-title">{faq.q}</h3>
                        {faq.a && (
                          <p className="cp-faq-card-body">
                            {renderFaqTextWithTags(faq.a)}
                          </p>
                        )}
                        {faq.points && faq.points.length > 0 && (
                          <ul className="cp-faq-bullet-list">
                            {faq.points.map((pt, pIdx) => (
                              <li key={pIdx} className="cp-faq-bullet-item">
                                <span className="cp-faq-bullet-dot" />
                                <div>{renderFaqTextWithTags(pt)}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                        {faq.actions && faq.actions.length > 0 && (
                          <div className="cp-faq-actions-row">
                            {faq.actions.map((act, aIdx) => (
                              <a
                                key={aIdx}
                                href={act.href}
                                target={act.external ? '_blank' : '_self'}
                                rel={act.external ? 'noopener noreferrer' : undefined}
                                className={`cp-faq-action-btn ${act.primary ? 'primary' : ''}`}
                              >
                                {act.type === 'whatsapp' && <MessageSquare className="h-3.5 w-3.5" />}
                                {act.type === 'email' && <Mail className="h-3.5 w-3.5" />}
                                {act.type === 'feedback' && <Send className="h-3.5 w-3.5" />}
                                <span>{act.label}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Centered Brand Copyright Footer */}
                  <div className="cp-profile-footer">
                    MotionNodeEdits 2026
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
