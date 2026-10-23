import React, { useMemo } from 'react';
import { Film, Bell, ChevronRight, MoreVertical, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ClientProjectStatusStepper from './ClientProjectStatusStepper';

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', emoji: '👋' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (hour >= 17 && hour < 22) return { text: 'Good Evening', emoji: '🌆' };
  return { text: 'Good Night', emoji: '🌙' };
};

const getOrderStatusDetails = (status) => {
  const s = (status || '').toLowerCase().trim();
  if (s.includes('delivered') || s.includes('completed')) {
    return { percent: 100, label: 'Delivered', color: '#4ADE80' };
  }
  if (s.includes('review')) {
    return { percent: 85, label: 'Ready for Review', color: '#4ADE80' };
  }
  if (s.includes('editing') || s.includes('progress')) {
    return { percent: 60, label: 'Editing in Progress', color: '#38BDF8' };
  }
  if (s.includes('accepted')) {
    return { percent: 40, label: 'Accepted', color: '#38BDF8' };
  }
  if (s.includes('planning') || s.includes('received')) {
    return { percent: 20, label: 'Planning', color: '#F59E0B' };
  }
  if (s.includes('revision')) {
    return { percent: 75, label: 'Revisions', color: '#A855F7' };
  }
  if (s.includes('cancelled') || s.includes('rejected')) {
    return { percent: 0, label: 'Cancelled', color: '#F87171' };
  }
  return { percent: 25, label: 'In Queue', color: '#94A3B8' };
};

const formatDueDate = (dateStr) => {
  if (!dateStr) return 'Flexible Timeline';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Flexible';
  return `Due: ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

const getOrderThumbnail = (order) => {
  if (order.thumbnail_url) return order.thumbnail_url;
  if (order.cover_image) return order.cover_image;

  const links = [order.drive_link, order.dropbox_link, order.additional_link].filter(Boolean).join(' ');
  const match = links.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }

  const type = (order.video_type || '').toLowerCase();
  if (type.includes('ad') || type.includes('commercial')) {
    return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=240&auto=format&fit=crop&q=80';
  }
  if (type.includes('reel') || type.includes('short')) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80';
  }
  if (type.includes('youtube')) {
    return 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=240&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=240&auto=format&fit=crop&q=80';
};

export default function ClientOverview({
  clientProfile,
  orders = [],
  ordersLoading = false,
  formatOrderCode,
  getStatusBadgeBg,
  getStatusColor,
  getStatusBorder,
  STATUS_MAP,
  runningOrders = [],
  completedOrders = [],
  activeOrder,
  setSelectedActiveOrderId,
  setSelectedHistoryId,
  handleNavClick,
  activeStepIdx: _activeStepIdx,
  getStageDate,
  accountAvatar,
  notifications = [],
  showToast
}) {
  const greeting = useMemo(() => getTimeGreeting(), []);
  const activeCount = runningOrders.length;
  const inReviewCount = useMemo(() => {
    return orders.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s.includes('review') || s.includes('revision');
    }).length;
  }, [orders]);
  const completedCount = completedOrders.length;
  const inQueueCount = useMemo(() => {
    return orders.filter(o => {
      const s = (o.status || '').toLowerCase();
      return ['received', 'accepted', 'planning', 'on_hold'].includes(s);
    }).length;
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);
  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* MOBILE APP VIEW (Screens <= 768px): Reference Image Match     */}
      {/* ------------------------------------------------------------- */}
      <div className="cp-overview-mobile">
        {/* Mobile Header: Time Greeting, Dynamic Client Name, Bell & Avatar */}
        <div className="cp-mob-header">
          <div className="cp-mob-greeting-box">
            <div className="cp-mob-greeting-sub">
              <span>{greeting.text}</span>
              <span className="cp-mob-greeting-emoji">{greeting.emoji}</span>
            </div>
            <h1 className="cp-mob-client-name">
              {clientProfile?.full_name || clientProfile?.username || 'Client'}
            </h1>
          </div>

          <div className="cp-mob-header-actions">
            <button
              type="button"
              className="cp-mob-bell-btn"
              onClick={() => {
                if (notifications && notifications.length > 0) {
                  showToast?.(`You have ${notifications.length} notification${notifications.length > 1 ? 's' : ''}`);
                } else {
                  showToast?.('All caught up! No unread notifications');
                }
              }}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications && notifications.length > 0 && (
                <span className="cp-mob-bell-dot" />
              )}
            </button>

            <button
              type="button"
              className="cp-mob-avatar-btn"
              onClick={() => handleNavClick('profile')}
              aria-label="Open profile settings"
            >
              <img
                src={accountAvatar || '/image/mne_logo.png'}
                alt="Account Avatar"
                className="cp-mob-avatar-img"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231E1E28"/><circle cx="50" cy="40" r="20" fill="%234A4A5A"/><path d="M20 90 C20 65 35 60 50 60 C65 60 80 65 80 90 Z" fill="%234A4A5A"/></svg>';
                }}
              />
            </button>
          </div>
        </div>

        {/* 2x2 Stats Grid: Active Projects, In Review, Completed, In Queue */}
        <div className="cp-mob-stats-grid">
          <motion.div
            className="cp-mob-stat-card"
            onClick={() => handleNavClick('current')}
            role="button"
            tabIndex={0}
            whileTap={{ scale: 0.95 }}
          >
            <div className="cp-mob-stat-num">{activeCount}</div>
            <div className="cp-mob-stat-label">Active Projects</div>
          </motion.div>

          <motion.div
            className="cp-mob-stat-card"
            onClick={() => handleNavClick('current')}
            role="button"
            tabIndex={0}
            whileTap={{ scale: 0.95 }}
          >
            <div className="cp-mob-stat-num">{inReviewCount}</div>
            <div className="cp-mob-stat-label">In Review</div>
          </motion.div>

          <motion.div
            className="cp-mob-stat-card"
            onClick={() => handleNavClick('history')}
            role="button"
            tabIndex={0}
            whileTap={{ scale: 0.95 }}
          >
            <div className="cp-mob-stat-num">{completedCount}</div>
            <div className="cp-mob-stat-label">Completed</div>
          </motion.div>

          <motion.div
            className="cp-mob-stat-card"
            onClick={() => handleNavClick('current')}
            role="button"
            tabIndex={0}
            whileTap={{ scale: 0.95 }}
          >
            <div className="cp-mob-stat-num">{inQueueCount}</div>
            <div className="cp-mob-stat-label">In Queue</div>
          </motion.div>
        </div>

        {/* Recent Projects Section */}
        <div className="cp-mob-recent-section">
          <div className="cp-mob-recent-header">
            <h2 className="cp-mob-recent-title">Recent Projects</h2>
            <button
              type="button"
              className="cp-mob-view-all-btn"
              onClick={() => handleNavClick('current')}
            >
              <span>View All</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {ordersLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="cp-skeleton" style={{ height: '74px', borderRadius: '14px' }} />
              <div className="cp-skeleton" style={{ height: '74px', borderRadius: '14px' }} />
              <div className="cp-skeleton" style={{ height: '74px', borderRadius: '14px' }} />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="cp-mob-empty-card">
              <Film className="h-7 w-7 text-white/50" />
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FFFFFF', marginTop: '8px' }}>
                No Orders Placed Yet
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px', maxWidth: '280px' }}>
                Your production cuts, status progress, and deliverables will appear here.
              </div>
              <a
                href="https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I'd%20like%20to%20discuss%20a%20video%20project."
                target="_blank"
                rel="noopener noreferrer"
                className="cp-mob-start-btn"
              >
                <span>Launch a Project</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <div className="cp-mob-project-list">
              {recentOrders.map((order) => {
                const statusInfo = getOrderStatusDetails(order.status);
                const thumbUrl = getOrderThumbnail(order);
                const dueDateText = formatDueDate(order.client_deadline || order.updated_at);
                const displayStatusLabel = STATUS_MAP[order.status]?.label ? STATUS_MAP[order.status].label : statusInfo.label;

                return (
                  <motion.div
                    key={order.id}
                    className="cp-mob-project-card"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (order.status === 'delivered') {
                        setSelectedHistoryId(order.id);
                        handleNavClick('history');
                      } else {
                        setSelectedActiveOrderId(order.id);
                        handleNavClick('current');
                      }
                    }}
                  >
                    <div className="cp-mob-thumb-wrap">
                      <img
                        src={thumbUrl}
                        alt={order.order_name || 'Project thumbnail'}
                        className="cp-mob-thumb-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="cp-mob-thumb-fallback" style={{ display: 'none' }}>
                        <Film className="h-5 w-5 text-white/40" />
                      </div>
                    </div>

                    <div className="cp-mob-project-info">
                      <div className="cp-mob-project-title">
                        {order.order_name || order.title || 'Untitled Project'}
                      </div>

                      <div
                        className="cp-mob-project-status"
                        style={{ color: statusInfo.color }}
                      >
                        {displayStatusLabel}
                      </div>

                      <div className="cp-mob-progress-row">
                        <div className="cp-mob-progress-track">
                          <div
                            className="cp-mob-progress-fill"
                            style={{
                              width: `${statusInfo.percent}%`,
                              background: statusInfo.color,
                            }}
                          />
                        </div>
                        <span className="cp-mob-progress-pct">{statusInfo.percent}%</span>
                      </div>

                      <div className="cp-mob-project-due">{dueDateText}</div>
                    </div>

                    <button
                      type="button"
                      className="cp-mob-card-action"
                      aria-label="Project details"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (order.status === 'delivered') {
                          setSelectedHistoryId(order.id);
                          handleNavClick('history');
                        } else {
                          setSelectedActiveOrderId(order.id);
                          handleNavClick('current');
                        }
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Milestone Stepper Telemetry (if active order is running) */}
        {activeOrder && (
          <div className="cp-mob-stepper-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  LIVE TELEMETRY
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  {activeOrder.order_name}
                </div>
              </div>
              <span className="cp-badge-pill" style={{ fontSize: '0.7rem' }}>
                {formatOrderCode(activeOrder)}
              </span>
            </div>
            <ClientProjectStatusStepper
              status={activeOrder?.status}
              cancellationReason={activeOrder?.cancellation_reason}
              orderCreatedAt={activeOrder?.created_at}
              orderUpdatedAt={activeOrder?.updated_at}
              getStageDate={getStageDate}
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP VIEW (Screens > 768px): Original Full Layout          */}
      {/* ------------------------------------------------------------- */}
      <div className="cp-overview-desktop">
        <div className="cp-header-block">
          <h1 className="cp-title-h1">
            Welcome Back{clientProfile?.full_name ? `, ${clientProfile.full_name}` : ''}
          </h1>
          <p className="cp-subtext">Here is the latest overview of your video productions & orders.</p>
        </div>

      {/* Supabase Orders Section */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.12rem', fontWeight: 700, color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film className="h-4 w-4 text-pink-400" />
            <span>Your Orders</span>
          </h2>
          {!ordersLoading && orders.length > 0 && (
            <span className="cp-badge-pill" style={{ fontSize: '0.75rem' }}>
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </span>
          )}
        </div>

        {ordersLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="cp-skeleton" style={{ height: '140px', borderRadius: '12px' }} />
            <div className="cp-skeleton" style={{ height: '140px', borderRadius: '12px' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="cp-empty-state-card">
            <div className="cp-empty-state-icon">
              <Film className="h-7 w-7 text-white/60" />
            </div>
            <h3 className="cp-empty-state-title">
              Welcome! You have no orders yet.
            </h3>
            <p className="cp-empty-state-desc">
              When a video production or editing brief is placed, your project milestones, live render telemetry, and deliverable cuts will appear here in real-time.
            </p>
            <div className="cp-empty-state-actions">
              <a
                href="https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I'd%20like%20to%20discuss%20a%20video%20project."
                target="_blank"
                rel="noopener noreferrer"
                className="cp-mob-start-btn"
                style={{ margin: 0, padding: '10px 20px', fontSize: '0.84rem' }}
              >
                <span>Launch a Project</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                className="cp-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--cp-border)',
                  background: 'var(--cp-bg-card)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (order.status === 'delivered') {
                    setSelectedHistoryId(order.id);
                    handleNavClick('history');
                  } else {
                    handleNavClick('current');
                  }
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--cp-accent-silver)', fontFamily: 'monospace', letterSpacing: '0.03em', display: 'block', marginBottom: '4px' }}>
                        {formatOrderCode(order)}
                      </span>
                      <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
                        {order.order_name || order.title || 'Untitled Project'}
                      </h3>
                    </div>
                    <span
                      className="cp-badge-pill"
                      style={{
                        padding: '3px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        borderRadius: '20px',
                        background: getStatusBadgeBg(order.status),
                        color: getStatusColor(order.status),
                        border: `1px solid ${getStatusBorder(order.status)}`,
                        flexShrink: 0
                      }}
                    >
                      {STATUS_MAP[order.status]?.label || order.status}
                    </span>
                  </div>

                  {order.brief && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--cp-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {order.brief.slice(0, 90)}{order.brief.length > 90 ? '...' : ''}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--cp-text-secondary)' }}>Delivery Deadline</span>
                  <span style={{ fontSize: '0.8rem', color: '#FFFFFF', fontWeight: 500 }}>
                    {order.client_deadline ? new Date(order.client_deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Flexible'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cp-home-grid">
        {/* 1. Current Project Status Card */}
        <div className="cp-card" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('current')}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>Current Project Status</h3>
                  {runningOrders.length > 1 && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.22)' }}>
                      {runningOrders.length} Running
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--cp-text-secondary)', marginTop: '2px' }}>
                  {activeOrder ? activeOrder.order_name : 'No active project in editing'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="cp-badge-pill">
                  {activeOrder?.client_deadline ? `Due ${new Date(activeOrder.client_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'In Queue'}
                </span>
                {activeOrder?.editor && (
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--cp-text-secondary)', marginTop: '4px' }}>
                    Editor: <strong style={{ color: '#FFFFFF' }}>{activeOrder.editor.full_name}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Project Switcher Pills when multiple projects are running */}
            {runningOrders.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                {runningOrders.map((ord) => {
                  const isSelected = ord.id === activeOrder?.id;
                  const ordCode = formatOrderCode(ord);
                  return (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedActiveOrderId(ord.id);
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? '#FFFFFF' : 'var(--cp-text-secondary)',
                        border: isSelected ? '1px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: isSelected ? '0 0 12px rgba(255, 255, 255, 0.2)' : 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{ord.order_name}</span>
                      <span style={{ opacity: 0.75, fontFamily: 'monospace', fontSize: '0.65rem' }}>({ordCode})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Milestone Stepper */}
            <div style={{ marginTop: '20px' }}>
              <ClientProjectStatusStepper
                status={activeOrder?.status}
                cancellationReason={activeOrder?.cancellation_reason}
                orderCreatedAt={activeOrder?.created_at}
                orderUpdatedAt={activeOrder?.updated_at}
                getStageDate={getStageDate}
              />
            </div>
          </div>
        </div>

        {/* 2. Projects Done With Us Card */}
        <div className="cp-card" style={{ alignItems: 'center', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleNavClick('history')}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', alignSelf: 'flex-start' }}>
            Projects Done With Us
          </h3>

          <div className="cp-ring-container">
            <div className="cp-ring-outer">
              <span className="cp-ring-inner-num">{completedOrders.length}</span>
            </div>
          </div>

          <span className="cp-badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span>🏆</span>
            <span>{completedOrders.length >= 5 ? 'VIP Client' : 'Valued Client'}</span>
          </span>
        </div>
      </div>
      </div>
    </>
  );
}
