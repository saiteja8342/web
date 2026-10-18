import React, { useEffect } from 'react';
import { X, Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import { formatNotificationTime } from '../../lib/db/notifications';

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllRead,
  onMarkRead,
  onNotificationClick
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <div className="vel-drawer-backdrop" onClick={onClose} />
      <div className="vel-drawer-panel" role="dialog" aria-modal="true" aria-label="Notifications Center">
        <div className="vel-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FBBF24'
            }}>
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Notifications
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)' }}>
                {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && onMarkAllRead && (
              <button
                onClick={onMarkAllRead}
                className="vel-btn-outline"
                style={{
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#94A3B8'
                }}
                title="Mark all notifications as read"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark All Read</span>
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--vel-text-tertiary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Close notification panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="vel-drawer-body">
          {notifications.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--vel-text-secondary)',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--vel-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bell className="h-5 w-5" style={{ opacity: 0.5 }} />
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF' }}>No Notifications Yet</div>
              <p style={{ fontSize: '0.76rem', color: 'var(--vel-text-tertiary)', margin: 0, maxWidth: '260px' }}>
                When clients request revisions, new projects arrive, or users register, alerts will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = !notif.is_read;
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (isUnread && onMarkRead) onMarkRead(notif.id);
                    if (onNotificationClick) onNotificationClick(notif);
                  }}
                  style={{
                    background: isUnread ? 'rgba(245, 158, 11, 0.06)' : 'var(--vel-bg-card)',
                    border: `1px solid ${isUnread ? 'rgba(245, 158, 11, 0.25)' : 'var(--vel-border)'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isUnread ? 'rgba(245, 158, 11, 0.25)' : 'var(--vel-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isUnread && (
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#F59E0B',
                          boxShadow: '0 0 6px #F59E0B'
                        }} />
                      )}
                      <h4 style={{
                        fontSize: '0.82rem',
                        fontWeight: isUnread ? 700 : 600,
                        color: isUnread ? '#FFFFFF' : '#E2E8F0',
                        margin: 0
                      }}>
                        {notif.title}
                      </h4>
                    </div>

                    <span style={{
                      fontSize: '0.68rem',
                      color: 'var(--vel-text-tertiary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      flexShrink: 0
                    }}>
                      <Clock className="h-2.5 w-2.5" />
                      {formatNotificationTime ? formatNotificationTime(notif.created_at) : 'recently'}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '0.76rem',
                    color: 'var(--vel-text-secondary)',
                    margin: '6px 0 0',
                    lineHeight: 1.45,
                    wordBreak: 'break-word'
                  }}>
                    {notif.message}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
