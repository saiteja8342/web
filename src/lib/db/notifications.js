import { supabase } from '../supabase/client';

/**
 * Notifications Database Operations
 * Matches schema:
 * - id (uuid)
 * - user_id (uuid, FK -> profiles.id)
 * - title (text)
 * - message (text)
 * - is_read (boolean, default false)
 * - created_at (timestamp)
 */

/**
 * Fetch all notifications for a specific user.
 */
export async function getUserNotifications(userId) {
  return await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
}

/**
 * Fetch unread notifications count for a user.
 */
export async function getUnreadNotificationCount(userId) {
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
  return await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId) {
  return await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}

/**
 * Send a notification to a specific user.
 */
export async function sendNotification(userId, title, message) {
  return await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        title,
        message,
        is_read: false,
      },
    ]);
}

/**
 * Format a notification's created_at into a relative time string.
 */
export function formatNotificationTime(createdAt) {
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
