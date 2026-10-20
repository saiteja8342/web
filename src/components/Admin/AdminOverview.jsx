import React from 'react';
import {
  ShieldCheck,
  Mail,
  TrendingUp,
  CheckSquare,
  AlertTriangle,
  Users,
  Send
} from 'lucide-react';

export default function AdminOverview({
  pendingUsers = [],
  newContactRequestsCount = 0,
  handleNavClick,
  metrics = {},
  contactRequests = [],
  orders = []
}) {
  const now = Date.now();
  const activeOrdersList = orders.filter(o => o.dbStatus === 'in_editing' || o.dbStatus === 'in_review');
  const nearDeadlineCount = activeOrdersList.filter(o => {
    if (!o.clientDeadline) return false;
    const diff = new Date(o.clientDeadline).getTime() - now;
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  }).length;
  const onTrackCount = Math.max(0, activeOrdersList.length - nearDeadlineCount);

  return (
    <>
      <div className="vel-page-header">
        <h1 className="vel-page-h1">Overview</h1>
        <p className="vel-page-sub">Real-time studio production metrics and throughput.</p>
      </div>

      {pendingUsers.length > 0 && (
        <div
          onClick={() => handleNavClick('approvals')}
          className="vel-alert-banner"
          style={{
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.05))',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            cursor: 'pointer',
            transition: 'border-color 0.2s, transform 0.15s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24' }}>
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                {pendingUsers.length} New User Registration{pendingUsers.length > 1 ? 's' : ''} Awaiting Approval
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--vel-text-secondary)' }}>
                New users cannot access their dashboard until approved. Click to review.
              </div>
            </div>
          </div>
          <span className="vel-btn-solid" style={{ padding: '6px 14px', fontSize: '0.75rem', background: '#F59E0B', border: 'none', color: '#000000', fontWeight: 700 }}>
            Review Approvals
          </span>
        </div>
      )}

      {newContactRequestsCount > 0 && (
        <div
          onClick={() => handleNavClick('contact-requests')}
          className="vel-alert-banner"
          style={{
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            cursor: 'pointer',
            transition: 'border-color 0.2s, transform 0.15s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24' }}>
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                {newContactRequestsCount} New Contact / Quote Request{newContactRequestsCount > 1 ? 's' : ''} Received
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--vel-text-secondary)' }}>
                Inbound client inquiries submitted through the website. Click to review and respond.
              </div>
            </div>
          </div>
          <span className="vel-btn-solid" style={{ padding: '6px 14px', fontSize: '0.75rem', background: '#FFFFFF', border: 'none', color: '#050507', fontWeight: 800 }}>
            View Inquiries
          </span>
        </div>
      )}

      <div className="vel-metric-grid">
        {/* 1. Active Orders */}
        <div className="vel-metric-card" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('orders')}>
          <div className="vel-metric-top">
            <span className="vel-metric-label">Active Orders</span>
            <div className="vel-metric-icon">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="vel-metric-bottom">
            <div className="vel-metric-number">{metrics.activeOrders || 0}</div>
            <span className="vel-metric-pill-badge">In Production</span>
          </div>
        </div>

        {/* 2. Accepted Orders */}
        <div className="vel-metric-card">
          <div className="vel-metric-top">
            <span className="vel-metric-label">Accepted Orders</span>
            <div className="vel-metric-icon">
              <CheckSquare className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="vel-metric-bottom">
            <div className="vel-metric-number">{metrics.acceptedOrders || 0}</div>
            <span className="vel-metric-pill-badge">In Queue</span>
          </div>
        </div>

        {/* 3. Completed This Week */}
        <div className="vel-metric-card">
          <div className="vel-metric-top">
            <span className="vel-metric-label">Completed Recently</span>
            <div className="vel-metric-icon">
              <CheckSquare className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="vel-metric-bottom">
            <div className="vel-metric-number">{metrics.completedThisWeek || 0}</div>
            <span style={{ fontSize: '0.72rem', color: '#4ADE80', fontWeight: 600 }}>Archived</span>
          </div>
        </div>

        {/* 4. Pending Orders (Alert Amber) */}
        <div className="vel-metric-card alert-amber" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('orders')}>
          <div className="vel-metric-top">
            <span className="vel-metric-label">Pending Intake</span>
            <div className="vel-metric-icon">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="vel-metric-bottom">
            <div className="vel-metric-number">{metrics.pendingOrders || 0}</div>
            <span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 600 }}>Action Req.</span>
          </div>
        </div>

        {/* 5. With Editor */}
        <div className="vel-metric-card" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('editors')}>
          <div className="vel-metric-top">
            <span className="vel-metric-label">With Editor</span>
            <div className="vel-metric-icon">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="vel-metric-bottom">
            <div className="vel-metric-number">{metrics.withEditorOrders || 0}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.72rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--vel-text-secondary)' }}>
                <span style={{ color: '#EF4444' }}>•</span>
                <span>Near Deadline</span>
                <strong style={{ color: '#FFFFFF', marginLeft: 'auto' }}>{nearDeadlineCount}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--vel-text-secondary)' }}>
                <span style={{ color: '#22C55E' }}>•</span>
                <span>On Track</span>
                <strong style={{ color: '#FFFFFF', marginLeft: 'auto' }}>{onTrackCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Ready for Delivery */}
        <div className="vel-metric-card">
          <div className="vel-metric-top">
            <span className="vel-metric-label">Ready for Delivery</span>
            <div className="vel-metric-icon">
              <Send className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="vel-metric-bottom">
            <div className="vel-metric-number">{metrics.readyForDelivery || 0}</div>
            <button
              className="vel-metric-cta-btn"
              onClick={() => handleNavClick('orders')}
            >
              <span>Review Deliverables</span>
            </button>
          </div>
        </div>

        {/* 7. Contact Requests */}
        <div className="vel-metric-card" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('contact-requests')}>
          <div className="vel-metric-top">
            <span className="vel-metric-label">Contact Requests</span>
            <div className="vel-metric-icon">
              <Mail className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="vel-metric-bottom">
            <div className="vel-metric-number">{contactRequests.length}</div>
            {newContactRequestsCount > 0 ? (
              <span style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 600 }}>{newContactRequestsCount} New</span>
            ) : (
              <span className="vel-metric-pill-badge">All Handled</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
