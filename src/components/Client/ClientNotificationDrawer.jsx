import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Clock, 
  Film, 
  MessageSquare, 
  CheckCircle2, 
  Ban, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNotificationTime } from '../../lib/db/notifications';

export default function ClientNotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllRead,
  onMarkRead,
  onSelectOrder
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filterTab === 'unread') return !n.is_read;
    return true;
  });

  const getNotificationIcon = (title = '', message = '') => {
    const text = `${title} ${message}`.toLowerCase();
    if (text.includes('cancel')) {
      return <Ban className="h-4 w-4 text-red-400" />;
    }
    if (text.includes('deliver') || text.includes('complete')) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    }
    if (text.includes('revision') || text.includes('feedback')) {
      return <MessageSquare className="h-4 w-4 text-purple-400" />;
    }
    if (text.includes('order') || text.includes('project')) {
      return <Film className="h-4 w-4 text-blue-400" />;
    }
    return <Sparkles className="h-4 w-4 text-amber-400" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="cp-notif-drawer-backdrop"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="cp-notif-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Client Notifications Drawer"
          >
            {/* Header */}
            <div className="cp-notif-drawer-header">
              <div className="flex items-center gap-3">
                <div className="cp-notif-header-icon-wrap">
                  <Bell className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="cp-notif-drawer-title">Notifications</h2>
                  <span className="cp-notif-drawer-sub">
                    {unreadCount > 0 
                      ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` 
                      : 'All caught up'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && onMarkAllRead && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="cp-notif-mark-all-btn"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="cp-notif-close-btn"
                  aria-label="Close notification panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="cp-notif-tabs-bar">
              <button
                type="button"
                className={`cp-notif-tab ${filterTab === 'all' ? 'active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                className={`cp-notif-tab ${filterTab === 'unread' ? 'active' : ''}`}
                onClick={() => setFilterTab('unread')}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notification Body List */}
            <div className="cp-notif-drawer-body">
              {filteredNotifications.length === 0 ? (
                <div className="cp-notif-empty-state">
                  <div className="cp-notif-empty-icon">
                    <Bell className="h-8 w-8 text-white/30" />
                  </div>
                  <h3 className="cp-notif-empty-title">
                    {filterTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </h3>
                  <p className="cp-notif-empty-desc">
                    {filterTab === 'unread'
                      ? 'You have read all updates! Switch to All to see past activity.'
                      : 'Real-time production updates, revisions, and deliverable alerts will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="cp-notif-list">
                  {filteredNotifications.map((notif) => {
                    const timeStr = formatNotificationTime(notif.created_at);
                    const icon = getNotificationIcon(notif.title, notif.message);

                    return (
                      <div
                        key={notif.id}
                        className={`cp-notif-item ${notif.is_read ? 'read' : 'unread'}`}
                        onClick={() => {
                          if (!notif.is_read && onMarkRead) {
                            onMarkRead(notif.id);
                          }
                          if (notif.order_id && onSelectOrder) {
                            onSelectOrder(notif.order_id);
                          }
                        }}
                      >
                        <div className="cp-notif-item-icon">
                          {icon}
                        </div>

                        <div className="cp-notif-item-content">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="cp-notif-item-title">
                              {notif.title}
                            </h4>
                            {!notif.is_read && (
                              <span className="cp-notif-unread-dot" title="Unread" />
                            )}
                          </div>

                          <p className="cp-notif-item-message">
                            {notif.message}
                          </p>

                          <div className="cp-notif-item-footer">
                            <span className="cp-notif-item-time flex items-center gap-1">
                              <Clock className="h-3 w-3 opacity-60" />
                              {timeStr}
                            </span>

                            {notif.order_id && (
                              <span className="cp-notif-item-link flex items-center gap-1">
                                View Order <ExternalLink className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
