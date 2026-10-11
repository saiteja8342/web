import { supabase } from '../supabase/client';

/**
 * Enhanced Notifications Engine & Database Operations
 * Supports:
 * - In-app database notifications (user-specific and role-based)
 * - Realtime multi-tab synchronization via BroadcastChannel
 * - Native Browser / Chrome desktop push notifications
 * - Role-targeted helpers: notifyAdmins, notifyUser, notifyRole
 */

// Cross-tab broadcast channel for immediate multi-window sync
const notifBroadcastChannel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('mne-notifications-channel')
    : null;

/**
 * Fetch notifications for a specific user with pagination.
 */
export async function getUserNotifications(userId, limit = 50) {
  if (!userId) return { data: [], error: null };
  return await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
}

/**
 * Fetch unread notifications count for a user.
 */
export async function getUnreadNotificationCount(userId) {
  if (!userId) return 0;
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('[Notifications DB] Error fetching unread count:', error);
    return 0;
  }
  return count || 0;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return { data: null, error: null };
  const res = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  // Broadcast update
  if (notifBroadcastChannel) {
    try {
      notifBroadcastChannel.postMessage({ type: 'NOTIFICATION_READ', id: notificationId });
    } catch {}
  }
  return res;
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId) {
  if (!userId) return { data: null, error: null };
  const res = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (notifBroadcastChannel) {
    try {
      notifBroadcastChannel.postMessage({ type: 'ALL_READ', userId });
    } catch {}
  }
  return res;
}

/**
 * Delete a single notification.
 */
export async function deleteNotification(notificationId) {
  if (!notificationId) return { data: null, error: null };
  const res = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (notifBroadcastChannel) {
    try {
      notifBroadcastChannel.postMessage({ type: 'NOTIFICATION_DELETED', id: notificationId });
    } catch {}
  }
  return res;
}

/**
 * Send a notification to a specific user.
 * Dispatches to Supabase DB, local BroadcastChannel, and triggers browser notification if allowed.
 */
export async function sendNotification(userId, title, message) {
  if (!userId || !title) return { data: null, error: new Error('Missing userId or title') };

  const insertData = {
    user_id: userId,
    title: title.trim(),
    message: (message || '').trim(),
    is_read: false,
    created_at: new Date().toISOString(),
  };

  const res = await supabase.from('notifications').insert([insertData]).select();

  // Broadcast across tabs
  if (notifBroadcastChannel) {
    try {
      notifBroadcastChannel.postMessage({
        type: 'NEW_NOTIFICATION',
        notification: res.data ? res.data[0] : insertData,
      });
    } catch {}
  }

  // If active user is the recipient, show desktop notification if permitted
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id === userId) {
      showBrowserNotification(title, {
        body: message,
        tag: `notif-${Date.now()}`,
      });
    }
  } catch {}

  return res;
}

/**
 * Send a notification to ALL administrators.
 * Used for new client registrations, new contact requests, revision requests, client ratings, etc.
 */
export async function notifyAdmins(title, message) {
  try {
    // 1. Fetch all profiles with role 'admin'
    const { data: adminProfiles, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'admin');

    let adminIds = [];
    if (!error && Array.isArray(adminProfiles) && adminProfiles.length > 0) {
      adminIds = adminProfiles.map((a) => a.id);
    }

    // 2. Fallback: if no admin profile found or error, also check current user if they are admin
    if (adminIds.length === 0) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        adminIds.push(session.user.id);
      }
    }

    if (adminIds.length === 0) {
      console.warn('[Notifications] No admin user IDs found to notify.');
      return { success: false };
    }

    const payload = adminIds.map((adminId) => ({
      user_id: adminId,
      title: title.trim(),
      message: (message || '').trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    const res = await supabase.from('notifications').insert(payload);

    if (notifBroadcastChannel) {
      try {
        notifBroadcastChannel.postMessage({ type: 'ADMIN_ALERT', title, message });
      } catch {}
    }

    return res;
  } catch (err) {
    console.warn('[Notifications] notifyAdmins failed:', err);
    return { error: err };
  }
}

/**
 * Send a notification to all users matching a specific role (e.g. 'editor', 'client').
 */
export async function notifyRole(role, title, message) {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', role);

    if (error || !profiles || profiles.length === 0) {
      return { success: false };
    }

    const payload = profiles.map((p) => ({
      user_id: p.id,
      title: title.trim(),
      message: (message || '').trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    return await supabase.from('notifications').insert(payload);
  } catch (err) {
    console.warn('[Notifications] notifyRole error:', err);
    return { error: err };
  }
}

/**
 * Format a notification's created_at into a human-friendly relative time string.
 */
export function formatNotificationTime(createdAt) {
  if (!createdAt) return 'Just now';
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Native Browser / Desktop Notification Helpers
 */
export function getBrowserNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'granted', 'denied', or 'default'
}

export async function requestBrowserNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('[Notifications] Error requesting permission:', err);
    return 'default';
  }
}

export function showBrowserNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const defaultOptions = {
      icon: '/favicon-192x192.png',
      badge: '/favicon-192x192.png',
      silent: false,
      ...options,
    };

    // If Service Worker is ready, use it for rich persistent notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, defaultOptions);
      });
      return true;
    }

    // Fallback to standard window Notification
    const notif = new Notification(title, defaultOptions);
    notif.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notif.close();
    };
    return notif;
  } catch (err) {
    console.warn('[Notifications] Browser notification error:', err);
    return null;
  }
}
