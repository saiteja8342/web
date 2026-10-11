import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Film, 
  MessageSquare, 
  Star, 
  Sparkles, 
  Clock, 
  X, 
  ExternalLink,
  Laptop,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  formatNotificationTime,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification
} from '../lib/db/notifications';
import { subscribeToUserNotifications, unsubscribeChannel } from '../lib/supabase/realtime';

export default function NotificationBell({ sessionUser, userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [browserPerm, setBrowserPerm] = useState('default');
  const [toastNotification, setToastNotification] = useState(null);

  const dropdownRef = useRef(null);

  // Determine dashboard link based on role
  const dashboardUrl = (userRole === 'admin') 
    ? '/dashboard/admin' 
    : (userRole === 'editor') 
      ? '/dashboard/editor' 
      : '/dashboard/client';

  // Load notifications from database
  const loadNotifications = useCallback(async () => {
    if (!sessionUser?.id) return;
    try {
      const { data, error } = await getUserNotifications(sessionUser.id);
      if (!error && Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.warn('[NotificationBell] Error loading notifications:', err);
    }
  }, [sessionUser?.id]);

  // Initial load, browser permission check, and Realtime subscription
  useEffect(() => {
    if (!sessionUser?.id) return;

    loadNotifications();
    setBrowserPerm(getBrowserNotificationPermission());

    // Subscribe to Supabase realtime notifications for this user
    const realtimeChannel = subscribeToUserNotifications(
      sessionUser.id,
      (newNotif) => {
        // On new notification insert
        setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
        setUnreadCount((prev) => prev + 1);

        // Show live popup toast banner
        setToastNotification(newNotif);

        // Show browser desktop notification if granted
        showBrowserNotification(newNotif.title, {
          body: newNotif.message,
          url: dashboardUrl,
        });
      },
      (updatedNotif) => {
        // On notification update (e.g. read status change)
        setNotifications((prev) =>
          prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
        );
        setUnreadCount((prev) => {
          const list = prev ? notifications.map((n) => (n.id === updatedNotif.id ? updatedNotif : n)) : [];
          return list.filter((n) => !n.is_read).length;
        });
      }
    );

    // Cross-tab broadcast channel listener
    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('mne-notifications-channel');
        bc.onmessage = (e) => {
          if (e.data?.type === 'ALL_READ') {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
          } else if (e.data?.type === 'NOTIFICATION_READ') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === e.data.id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
          } else if (e.data?.type === 'NEW_NOTIFICATION' && e.data.notification?.user_id === sessionUser.id) {
            setNotifications((prev) => [e.data.notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            setToastNotification(e.data.notification);
          } else if (e.data?.type === 'ADMIN_ALERT' && userRole === 'admin') {
            loadNotifications();
          }
        };
      } catch {}
    }

    return () => {
      unsubscribeChannel(realtimeChannel);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [sessionUser?.id, userRole, dashboardUrl, loadNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle Mark Single As Read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('[NotificationBell] Mark as read error:', err);
    }
  };

  // Handle Mark All As Read
  const handleMarkAllRead = async () => {
    if (!sessionUser?.id) return;
    try {
      await markAllNotificationsAsRead(sessionUser.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('[NotificationBell] Mark all read error:', err);
    }
  };

  // Handle Delete Notification
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn('[NotificationBell] Delete error:', err);
    }
  };

  // Request browser push notification permission
  const handleEnableBrowserNotifications = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPerm(res);
    if (res === 'granted') {
      showBrowserNotification('Notifications Activated!', {
        body: 'You will receive Chrome alerts for order updates and revisions.',
      });
    }
  };

  // Get appropriate category icon
  const getNotificationIcon = (title = '', message = '') => {
    const t = (title + ' ' + message).toLowerCase();
    if (t.includes('order') || t.includes('project') || t.includes('video') || t.includes('deliverable')) {
      return <Film className="h-4 w-4 text-sky-400" />;
    }
    if (t.includes('revision') || t.includes('note') || t.includes('change')) {
      return <MessageSquare className="h-4 w-4 text-amber-400" />;
    }
    if (t.includes('review') || t.includes('rating') || t.includes('star') || t.includes('testimonial')) {
      return <Star className="h-4 w-4 text-yellow-400" />;
    }
    if (t.includes('lead') || t.includes('contact') || t.includes('user') || t.includes('assigned')) {
      return <Sparkles className="h-4 w-4 text-violet-400" />;
    }
    return <Bell className="h-4 w-4 text-blue-400" />;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    return true;
  });

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* BELL TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 rounded-xl text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-500/40"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="h-4 w-4 transition-transform duration-200 hover:scale-110" />

        {/* Pulse unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-[10px] font-bold text-white shadow-lg shadow-blue-500/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#090A0F]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/80 z-50 overflow-hidden text-white"
            style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-wide text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-neutral-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-white/5 bg-black/20 text-xs px-3 pt-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-2 px-3 font-medium transition-all relative ${
                  activeTab === 'all' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All ({notifications.length})
                {activeTab === 'all' && (
                  <motion.div
                    layoutId="notifActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`pb-2 px-3 font-medium transition-all relative ${
                  activeTab === 'unread' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Unread ({unreadCount})
                {activeTab === 'unread' && (
                  <motion.div
                    layoutId="notifActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}
              </button>
            </div>

            {/* Chrome Push Notification Permission Banner */}
            {browserPerm === 'default' && (
              <div className="px-4 py-2.5 bg-blue-950/40 border-b border-blue-500/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-blue-200">
                  <Laptop className="h-4 w-4 shrink-0 text-blue-400" />
                  <span>Get Chrome desktop alerts</span>
                </div>
                <button
                  onClick={handleEnableBrowserNotifications}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition-colors whitespace-nowrap shadow-sm"
                >
                  Enable
                </button>
              </div>
            )}

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[380px] divide-y divide-white/5 flex-1 p-1">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="mx-auto w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 mb-3 border border-white/10">
                    <Bell className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-neutral-300">No notifications yet</p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-[220px] mx-auto">
                    {activeTab === 'unread'
                      ? 'You have caught up with all updates!'
                      : 'Project status updates, revisions, and messages will appear here.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.is_read) handleMarkAsRead(item.id);
                      window.location.href = dashboardUrl;
                    }}
                    className={`group relative p-3.5 rounded-xl transition-all duration-150 cursor-pointer flex gap-3 ${
                      item.is_read
                        ? 'hover:bg-white/[0.03] opacity-75'
                        : 'bg-white/[0.04] hover:bg-white/[0.07] border border-blue-500/20'
                    }`}
                  >
                    {/* Icon container */}
                    <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      {getNotificationIcon(item.title, item.message)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4
                          className={`text-xs font-semibold leading-snug line-clamp-1 ${
                            item.is_read ? 'text-neutral-300' : 'text-white'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {!item.is_read && (
                          <span
                            className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1"
                            title="Unread"
                          />
                        )}
                      </div>

                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatNotificationTime(item.created_at)}
                        </span>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!item.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(item.id, e)}
                              className="text-neutral-400 hover:text-white flex items-center gap-0.5"
                              title="Mark read"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="text-neutral-400 hover:text-rose-400 flex items-center gap-0.5"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
              <a
                href={dashboardUrl}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-medium text-center flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
              >
                <span>Open {userRole ? userRole.toUpperCase() : 'STUDIO'} Workspace</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REAL-TIME FLOATING TOAST POPUP WHEN NOTIFICATION ARRIVES ON PAGE */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="fixed top-20 right-5 z-[9999] max-w-sm w-full p-4 rounded-2xl bg-[#0B0D14]/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-black/80 flex items-start gap-3 text-white"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-blue-400 animate-spin" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase">
                  MotionNode Alert
                </span>
                <button
                  onClick={() => setToastNotification(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <h5 className="text-xs font-semibold text-white mt-0.5 line-clamp-1">
                {toastNotification.title}
              </h5>
              <p className="text-[11px] text-neutral-300 mt-1 line-clamp-2">
                {toastNotification.message}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <a
                  href={dashboardUrl}
                  onClick={() => {
                    handleMarkAsRead(toastNotification.id);
                    setToastNotification(null);
                  }}
                  className="text-[11px] font-medium text-white px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors inline-flex items-center gap-1"
                >
                  <span>View Project</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  onClick={() => {
                    handleMarkAsRead(toastNotification.id);
                    setToastNotification(null);
                  }}
                  className="text-[11px] text-neutral-400 hover:text-white px-2 py-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
