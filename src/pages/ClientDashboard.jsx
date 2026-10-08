import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home,
  Film,
  History,
  User,
  LogOut,
  Bell,
  Download,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Check,
  Eye,
  Send,
  StickyNote,
  Menu,
  X,
  Calendar,
  Clock,
  Star,
  Award,
  Lock,
  ShieldCheck,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Headphones,
  Mail,
  MessageSquare
} from 'lucide-react';
import CustomCursor from '../components/CustomCursor';

import { supabase } from '../supabaseClient';
import { checkRouteAuth } from '../lib/middleware/authGuard';
import { isGoogleUser } from '../lib/auth/authUtils';
import { getClientOrders, formatOrderCode, STATUS_MAP, VIDEO_TYPE_MAP } from '../lib/db/orders';
import { getProfile, updateProfile } from '../lib/db/profiles';
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendNotification, notifyAdmins, formatNotificationTime } from '../lib/db/notifications';
import { submitRevisionRequest, getOrderRevisions } from '../lib/db/revisions';
import { submitOrderRating, stripTestimonialTag, parseIsTestimonial } from '../lib/db/ratings';
import { subscribeToOrders, subscribeToUserNotifications, unsubscribeChannel } from '../lib/supabase/realtime';
import ClientOverview from '../components/Client/ClientOverview';
import ClientActiveProjects from '../components/Client/ClientActiveProjects';
import ClientProjectHistory from '../components/Client/ClientProjectHistory';
import ClientProfileSettings from '../components/Client/ClientProfileSettings';
import ClientFAQ from '../components/Client/ClientFAQ';
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




export default function ClientDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedActiveOrderId, setSelectedActiveOrderId] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [activeNav, setActiveNav] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mne_sidebar_collapsed') === 'true';
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
          localStorage.setItem('mne_sidebar_collapsed', String(next));
        } catch (_) {}
        return next;
      });
    }
  };

  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [newNote, setNewNote] = useState('');
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

  // Profile Management State
  const [profileSubTab, setProfileSubTab] = useState('profile'); // 'profile' | 'password'
  const [profileForm, setProfileForm] = useState({
    username: '',
    full_name: '',
    company_name: '',
    phone: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Management State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Synchronize profileForm whenever clientProfile is loaded or updated
  useEffect(() => {
    if (clientProfile) {
      setProfileForm({
        username: clientProfile.username || (clientProfile.email ? clientProfile.email.split('@')[0] : ''),
        full_name: clientProfile.full_name || '',
        company_name: clientProfile.company_name || '',
        phone: clientProfile.phone || '',
      });
    }
  }, [clientProfile]);

  // Check whether user made any edits to their profile details
  const hasProfileChanges = Boolean(
    clientProfile && (
      (profileForm.username || '').trim() !== (clientProfile.username || '').trim() ||
      (profileForm.full_name || '').trim() !== (clientProfile.full_name || '').trim() ||
      (profileForm.company_name || '').trim() !== (clientProfile.company_name || '').trim() ||
      (profileForm.phone || '').trim() !== (clientProfile.phone || '').trim()
    )
  );

  // Check whether user entered all fields for password update
  const hasPasswordChanges = Boolean(
    passwordForm.currentPassword.trim() &&
    passwordForm.newPassword.trim() &&
    passwordForm.confirmPassword.trim()
  );

  // Helper to retrieve user avatar: Google OAuth photo if available, custom avatar if uploaded, or guaranteed male cartoon avatar for website accounts
  const getAccountAvatar = useCallback(() => {
    if (isGoogleUser(currentUser)) {
      const googlePic = clientProfile?.avatar_url || currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture;
      if (googlePic && (googlePic.includes('googleusercontent.com') || googlePic.includes('google.com'))) {
        return googlePic;
      }
    }
    // If the user uploaded a custom avatar image (not a default dicebear url)
    if (clientProfile?.avatar_url && clientProfile.avatar_url.startsWith('http') && !clientProfile.avatar_url.includes('dicebear.com')) {
      return clientProfile.avatar_url;
    }
    // If user already has an updated male dicebear avatar with short hair
    if (clientProfile?.avatar_url && clientProfile.avatar_url.includes('dicebear.com') && clientProfile.avatar_url.includes('hair=short')) {
      return clientProfile.avatar_url;
    }
    // By default, generate a handsome male cartoon avatar with short hair and natural masculine tones
    const rawSeed = (clientProfile?.username || clientProfile?.email || currentUser?.email || 'Alex').trim();
    const cleanSeed = rawSeed.replace(/[^a-zA-Z0-9]/g, '') || 'Alex';
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=male-${encodeURIComponent(cleanSeed)}&hair=short01,short02,short03,short04,short05,short06,short07,short08,short09,short10,short11,short12,short13,short14,short15,short16&hairColor=0e0e0e,2c1b18,4a312c,6a4e42,85461e&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }, [clientProfile, currentUser]);

  // Auto-upgrade any old default dicebear avatar to the male avatar in the database
  useEffect(() => {
    if (clientProfile?.id && clientProfile.avatar_url && clientProfile.avatar_url.includes('dicebear.com') && !clientProfile.avatar_url.includes('hair=short')) {
      const maleAvatar = getAccountAvatar();
      supabase
        .from('profiles')
        .update({ avatar_url: maleAvatar })
        .eq('id', clientProfile.id)
        .then(() => {
          setClientProfile(prev => prev ? { ...prev, avatar_url: maleAvatar } : prev);
        });
    }
  }, [clientProfile?.id, clientProfile?.avatar_url, getAccountAvatar]);

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
    const confirmed = window.confirm('Are you sure you want to sign out of this account?');
    if (!confirmed) return;
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // ─── Profile & Password Security Handlers ─────────────────────────
  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser?.id) return;

    const trimmedUsername = (profileForm.username || '').trim();
    const trimmedName = (profileForm.full_name || '').trim();
    const trimmedCompany = (profileForm.company_name || '').trim();
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
      // 1. Update public.profiles table (protected by RLS & privilege escalation trigger)
      const isNameChanged = trimmedName && trimmedName !== (clientProfile?.full_name || '').trim();
      const payload = {
        company_name: trimmedCompany,
        phone: trimmedPhone,
      };
      if (trimmedUsername) {
        payload.username = trimmedUsername;
      }
      if (trimmedName) {
        payload.full_name = trimmedName;
      }
      if (isNameChanged && clientProfile?.full_name) {
        payload.previous_name = clientProfile.full_name;
      }

      const { data: updatedProfile, error: dbError } = await updateProfile(currentUser.id, payload);

      if (dbError) {
        console.error('[ClientDashboard] Profile update DB error:', dbError);
        showToast(dbError.message || 'Failed to update profile.');
        setIsSavingProfile(false);
        return;
      }

      // 2. Synchronize auth.users user_metadata
      try {
        await supabase.auth.updateUser({
          data: {
            username: trimmedUsername || clientProfile?.username,
            full_name: trimmedName || clientProfile?.full_name,
            company_name: trimmedCompany,
            phone: trimmedPhone,
            previous_name: payload.previous_name || clientProfile?.previous_name || null,
          },
        });
      } catch (authErr) {
        console.warn('[ClientDashboard] Auth metadata sync warning:', authErr);
      }

      // 3. Update local state
      setClientProfile(prev => ({
        ...prev,
        ...updatedProfile,
        username: trimmedUsername || prev?.username,
        full_name: trimmedName || prev?.full_name,
        company_name: trimmedCompany,
        phone: trimmedPhone,
        previous_name: payload.previous_name || prev?.previous_name || null,
      }));

      showToast('Profile updated successfully!');
    } catch (err) {
      console.error('[ClientDashboard] Profile update unexpected error:', err);
      showToast(err.message || 'Error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser) return;

    // Security Check 1: Check if user is authenticated via Google OAuth
    if (isGoogleUser(currentUser)) {
      showToast('Google OAuth accounts cannot change password here. Manage via Google.');
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    // Validation
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
      // Security Check 2: Verify current password first by re-authenticating with Supabase
      const userEmail = currentUser.email || clientProfile?.email;
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

      // Security Check 3: Update password via official Supabase auth API
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('[ClientDashboard] Password update error:', updateError);
        showToast(updateError.message || 'Failed to update password.');
        setIsChangingPassword(false);
        return;
      }

      // Clear password form on success
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      showToast('Password changed successfully!');
    } catch (err) {
      console.error('[ClientDashboard] Password update exception:', err);
      showToast(err.message || 'Unexpected error updating password.');
    } finally {
      setIsChangingPassword(false);
    }
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
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !session || !session.user) {
        window.location.href = '/login';
        return;
      }

      const { authorized, profile } = await checkRouteAuth({
        requiredRole: 'client',
        redirectOnFail: '/login',
      });

      if (authorized && profile) {
        setIsAuthenticated(true);
        setCurrentUser(session.user);
        setClientProfile(profile);
        await fetchClientData(session.user.id);
      }
    }
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.location.href = '/login';
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
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

  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const handleRequestRevisionWithTimestamp = async (noteContent) => {
    const textToSubmit = (typeof noteContent === 'string' ? noteContent : newNote) || '';
    if (!textToSubmit.trim()) return;
    if (!activeOrder) {
      showToast('No active project to send note for.');
      return;
    }

    setIsSubmittingRevision(true);
    const { error } = await submitRevisionRequest(activeOrder.id, currentUser.id, textToSubmit);
    setIsSubmittingRevision(false);
    if (error) {
      showToast('Error sending revision note: ' + error.message);
      return;
    }

    // Notify admin
    try {
      await notifyAdmins(
        `Revision Requested: ${activeOrder.order_name}`,
        `${clientProfile?.full_name || 'Client'} requested revision on "${activeOrder.order_name}": "${textToSubmit.slice(0, 80)}..."`
      );
    } catch (_) {}

    // Notify assigned editor
    if (activeOrder.editor_id) {
      try {
        await sendNotification(
          activeOrder.editor_id,
          `Revision Note: ${activeOrder.order_name}`,
          `Client requested revision on "${activeOrder.order_name}": "${textToSubmit.slice(0, 80)}..."`
        );
      } catch (_) {}
    }

    setEditorNotes(prev => [
      {
        id: Date.now(),
        badge: 'REVISION REQUEST',
        time: 'Just now',
        highlight: true,
        text: textToSubmit,
      },
      ...prev,
    ]);

    showToast('Revision request sent to studio admin & editor.');
    setNewNote('');
  };

  const handleAddNote = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await handleRequestRevisionWithTimestamp(newNote);
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
        showToast('Thank you! Your review has been sent to our studio admin team.');
      } else {
        showToast('Thank you for rating your project experience!');
      }

      // Notify Admin and assigned Editor
      try {
        await notifyAdmins(
          `Client Rating: ${ratingStars}★ on ${targetProject.order_name || targetProject.title}`,
          `${clientProfile?.full_name || 'Client'} gave a ${ratingStars}-star rating${cleanFeedback ? ': "' + cleanFeedback.slice(0, 80) + '..."' : '.'}`
        );
      } catch (_) {}

      if (targetProject.editorId && targetProject.editorId !== currentUser.id) {
        try {
          await sendNotification(
            targetProject.editorId,
            `Client Rated Your Work: ${ratingStars}★!`,
            `The client rated "${targetProject.order_name || targetProject.title}" with ${ratingStars} stars${cleanFeedback ? ': "' + cleanFeedback.slice(0, 80) + '..."' : '!'}`
          );
        } catch (_) {}
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
      {/* SIDEBAR NAVIGATION (Redesigned matching reference)                 */}
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
                <div className="cp-brand-sub">CLIENT HUB</div>
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
          <div className="cp-sidebar-section-title">MEMBER</div>

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
              className={`cp-nav-item ${activeNav === 'current' ? 'active' : ''}`}
              onClick={() => handleNavClick('current')}
              title="Current Projects"
            >
              <Film className="h-4 w-4 shrink-0" />
              <span>{runningOrders.length > 1 ? `Current Projects (${runningOrders.length})` : 'Current Project'}</span>
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
                {clientProfile?.username || clientProfile?.full_name || currentUser?.email?.split('@')[0] || 'Client'}
              </span>
              <span className="cp-sidebar-user-email">
                {clientProfile?.email || currentUser?.email || ''}
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
            <span className="cp-topbar-title">Client Portal</span>
          </div>

          <div className="cp-topbar-actions">

            {/* WhatsApp Contact Us Button */}
            <a
              href="https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I%20have%20a%20question%20regarding%20my%20dashboard%20project"
              target="_blank"
              rel="noopener noreferrer"
              className="cp-topbar-wp-btn"
              title="Contact us on WhatsApp"
            >
              <svg className="cp-topbar-wp-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>Contact us WP</span>
            </a>


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
                aria-label="User profile menu"
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
                  {/* Top card with user details */}
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
                          {clientProfile?.full_name || currentUser?.user_metadata?.full_name || 'Client User'}
                        </span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-white/70 flex-shrink-0" title="Verified Client" />
                      </div>
                      <span className="cp-dropdown-email">
                        {clientProfile?.company_name || currentUser?.email || 'MotionNode Client'}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                  </div>

                  {/* Quick Summary Pill inspired by reference design */}
                  <div className="cp-dropdown-summary-pill">
                    <span className="cp-dropdown-summary-title">Active Projects</span>
                    <span className="cp-dropdown-summary-val">{runningOrders.length} In Progress</span>
                  </div>

                  {/* Navigation Shortcuts */}
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
                      className={`cp-dropdown-btn ${activeNav === 'current' ? 'active' : ''}`}
                      onClick={() => {
                        handleNavClick('current');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <div className="cp-dropdown-btn-left">
                        <Film className="h-4 w-4 text-white/70" />
                        <span>Current Projects</span>
                      </div>
                      {runningOrders.length > 0 && (
                        <span className="cp-dropdown-pill">{runningOrders.length}</span>
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
                        <LogOut className="h-4 w-4 text-red-400" />
                        <span>Log out</span>
                      </div>
                    </button>
                  </div>
                </div>
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
                <ClientOverview
                  clientProfile={clientProfile}
                  orders={orders}
                  ordersLoading={ordersLoading}
                  formatOrderCode={formatOrderCode}
                  getStatusBadgeBg={getStatusBadgeBg}
                  getStatusColor={getStatusColor}
                  getStatusBorder={getStatusBorder}
                  STATUS_MAP={STATUS_MAP}
                  runningOrders={runningOrders}
                  completedOrders={completedOrders}
                  activeOrder={activeOrder}
                  setSelectedActiveOrderId={setSelectedActiveOrderId}
                  setSelectedHistoryId={setSelectedHistoryId}
                  handleNavClick={handleNavClick}
                  activeStepIdx={activeStepIdx}
                  getStageDate={getStageDate}
                />
              )}

              {/* ============================================================== */}
              {/* VIEW 2: CURRENT PROJECT / ACTIVE PIPELINE                      */}
              {/* ============================================================== */}
              {activeNav === 'current' && (
                <ClientActiveProjects
                  runningOrders={runningOrders}
                  activeOrder={activeOrder}
                  setSelectedActiveOrderId={setSelectedActiveOrderId}
                  isDeliverablePermitted={isDeliverablePermitted}
                  activeOrderExp={activeOrderExp}
                  editorNotes={editorNotes}
                  onSendRevisionNote={handleRequestRevisionWithTimestamp}
                  isSubmittingNote={isSubmittingRevision}
                  safeOpenUrl={safeOpenUrl}
                  getExpectedDeliveryDate={getExpectedDeliveryDate}
                  STATUS_MAP={STATUS_MAP}
                  formatOrderCode={formatOrderCode}
                />
              )}

              {/* ============================================================== */}
              {/* VIEW 3: PROJECT HISTORY (Reference Image 4)                    */}
              {/* ============================================================== */}
              {activeNav === 'history' && (
                <ClientProjectHistory
                  historyProjects={historyProjects}
                  selectedProject={selectedProject}
                  setSelectedHistoryId={setSelectedHistoryId}
                  ratingsMap={ratingsMap}
                  handleSubmitRating={handleSubmitRating}
                  ratingStars={ratingStars}
                  setRatingStars={setRatingStars}
                  hoverStars={hoverStars}
                  setHoverStars={setHoverStars}
                  feedbackText={feedbackText}
                  setFeedbackText={setFeedbackText}
                  isTestimonialConsent={isTestimonialConsent}
                  setIsTestimonialConsent={setIsTestimonialConsent}
                  isSubmittingRating={isSubmittingRating}
                  safeOpenUrl={safeOpenUrl}
                />
              )}

              {/* ============================================================== */}
              {/* VIEW 4: PROFILE & SECURITY                                     */}
              {/* ============================================================== */}
              {activeNav === 'profile' && (
                <ClientProfileSettings
                  clientProfile={clientProfile}
                  currentUser={currentUser}
                  getAccountAvatar={getAccountAvatar}
                  defaultAvatar={DEFAULT_CARTOON_AVATAR}
                  profileSubTab={profileSubTab}
                  setProfileSubTab={setProfileSubTab}
                  profileForm={profileForm}
                  setProfileForm={setProfileForm}
                  handleUpdateProfile={handleUpdateProfile}
                  isSavingProfile={isSavingProfile}
                  hasProfileChanges={hasProfileChanges}
                  handleChangePassword={handleChangePassword}
                  passwordForm={passwordForm}
                  setPasswordForm={setPasswordForm}
                  showCurrentPassword={showCurrentPassword}
                  setShowCurrentPassword={setShowCurrentPassword}
                  showNewPassword={showNewPassword}
                  setShowNewPassword={setShowNewPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                  isChangingPassword={isChangingPassword}
                  hasPasswordChanges={hasPasswordChanges}
                />
              )}

              {/* ============================================================== */}
              {/* VIEW 5: SUPPORT & FREQUENTLY ASKED QUESTIONS                   */}
              {/* ============================================================== */}
              {activeNav === 'faq' && (
                <ClientFAQ />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
