import React from 'react';
import { Film } from 'lucide-react';
import ClientProjectStatusStepper from './ClientProjectStatusStepper';

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
  getStageDate
}) {
  return (
    <>
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
          <div
            className="cp-card"
            style={{
              padding: '50px 24px',
              textAlign: 'center',
              alignItems: 'center'
            }}
          >
            <div className="cp-radar-container">
              <div className="cp-radar-sweep" />
              <div className="cp-radar-ring-2" />
              <div className="cp-radar-ring-3" />
              <Film className="h-7 w-7 text-white/80 relative z-10" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
              <span className="cp-studio-pill">
                <span className="cp-rec-dot" style={{ background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                <span>STUDIO READY</span>
              </span>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>BUFFER: READY</span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
              Welcome! You have no orders yet.
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--cp-text-secondary)', maxWidth: '420px', lineHeight: 1.5, margin: '0 auto 20px' }}>
              When a video production or editing brief is placed, your project milestones, live render telemetry, and deliverable cuts will appear here in real-time.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '3px', height: '24px' }}>
              {[12, 18, 8, 22, 14, 24, 10, 20, 16, 22, 12, 18].map((h, i) => (
                <span
                  key={i}
                  className="cp-eq-bar"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }}
                />
              ))}
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
    </>
  );
}
