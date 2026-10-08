import React from 'react';
import { Film, Check } from 'lucide-react';

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
  activeStepIdx,
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
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '48px 24px',
              border: '1px dashed var(--cp-border)',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}
            >
              <Film className="h-6 w-6 text-white/40" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
              Welcome! You have no orders yet.
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--cp-text-secondary)', maxWidth: '420px', lineHeight: 1.5, margin: 0 }}>
              When a video production or editing brief is placed, your project milestones and status will appear here in real-time.
            </p>
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
                      <span style={{ fontSize: '0.68rem', color: '#93C5FD', fontFamily: 'monospace', letterSpacing: '0.03em', display: 'block', marginBottom: '4px' }}>
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
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
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
                        background: isSelected ? '#3B82F6' : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? '#FFFFFF' : 'var(--cp-text-secondary)',
                        border: isSelected ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
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
            <div className="cp-stepper-wrap" style={{ marginTop: '20px' }}>
              <div className="cp-stepper-line" />
              {[
                { key: 'received', label: 'RECEIVED', step: 0 },
                { key: 'accepted', label: 'ACCEPTED', step: 1 },
                { key: 'in_editing', label: 'IN EDITING', step: 2 },
                { key: 'in_review', label: 'IN REVIEW', step: 3 },
                { key: 'delivered', label: 'DELIVERED', step: 4 },
              ].map((s, idx) => {
                const isDone = activeStepIdx > s.step;
                const isActive = activeStepIdx === s.step;
                const stageDate = getStageDate(s.key, s.step);
                return (
                  <div key={idx} className={`cp-step-item ${isActive ? 'active' : ''}`}>
                    <div className={`cp-step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                      {isDone ? <Check className="h-2.5 w-2.5" /> : isActive ? '◉' : ''}
                    </div>
                    <span className="cp-step-name">{s.label}</span>
                    <span style={{ fontSize: '0.62rem', color: isDone || isActive ? '#9CA3AF' : 'var(--cp-text-tertiary)', marginTop: '2px' }}>
                      {stageDate}
                    </span>
                  </div>
                );
              })}
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
