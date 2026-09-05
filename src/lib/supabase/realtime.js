import { supabase } from './client';

/**
 * Supabase Realtime Manager
 * Provides centralized channels and subscription helpers for live updates across dashboards.
 */

/**
 * Subscribe to changes on the orders table.
 */
export function subscribeToOrders({ filter, onInsert, onUpdate, onDelete }) {
  const channelName = filter ? `orders-${filter}` : 'orders-all';

  const channelConfig = {
    event: '*',
    schema: 'public',
    table: 'orders',
  };

  if (filter) {
    channelConfig.filter = filter;
  }

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', channelConfig, (payload) => {
      if (payload.eventType === 'INSERT' && onInsert) {
        onInsert(payload.new);
      } else if (payload.eventType === 'UPDATE' && onUpdate) {
        onUpdate(payload.new, payload.old);
      } else if (payload.eventType === 'DELETE' && onDelete) {
        onDelete(payload.old);
      }
    })
    .subscribe();

  return channel;
}

/**
 * Subscribe to changes on the profiles table (e.g. client/editor registration).
 */
export function subscribeToProfiles({ onInsert, onUpdate, onDelete }) {
  const channel = supabase
    .channel('profiles-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
      },
      (payload) => {
        if (payload.eventType === 'INSERT' && onInsert) {
          onInsert(payload.new);
        } else if (payload.eventType === 'UPDATE' && onUpdate) {
          onUpdate(payload.new, payload.old);
        } else if (payload.eventType === 'DELETE' && onDelete) {
          onDelete(payload.old);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to user-specific notifications.
 */
export function subscribeToUserNotifications(userId, onNewNotification, onNotificationUpdate) {
  if (!userId) return null;

  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT' && onNewNotification) {
          onNewNotification(payload.new);
        } else if (payload.eventType === 'UPDATE' && onNotificationUpdate) {
          onNotificationUpdate(payload.new);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to revision requests on orders.
 */
export function subscribeToRevisionRequests({ orderId, onChange }) {
  const channelName = orderId ? `revisions-${orderId}` : 'revisions-all';

  const channelConfig = {
    event: '*',
    schema: 'public',
    table: 'revision_requests',
  };

  if (orderId) {
    channelConfig.filter = `order_id=eq.${orderId}`;
  }

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', channelConfig, (payload) => {
      if (onChange) {
        onChange(payload);
      }
    })
    .subscribe();

  return channel;
}

/**
 * Subscribe to changes on the contact_requests table.
 */
export function subscribeToContactRequests({ onInsert, onUpdate, onDelete }) {
  const channel = supabase
    .channel('contact-requests-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'contact_requests',
      },
      (payload) => {
        if (payload.eventType === 'INSERT' && onInsert) {
          onInsert(payload.new);
        } else if (payload.eventType === 'UPDATE' && onUpdate) {
          onUpdate(payload.new, payload.old);
        } else if (payload.eventType === 'DELETE' && onDelete) {
          onDelete(payload.old);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe and clean up an active Realtime channel.
 */
export function unsubscribeChannel(channel) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}

