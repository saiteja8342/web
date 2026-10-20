import React from 'react';
import {
  SlidersHorizontal,
  Plus,
  ChevronRight,
  UserCheck,
  Clapperboard,
  Archive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Check,
  Users,
  Cloud,
  Lock,
  ExternalLink,
  Copy,
  EyeOff,
  Eye,
  Clock,
  MessageSquare,
  Save,
  Sparkles,
  TrendingUp,
  Globe,
  Star,
  Award,
  Search,
  Quote,
  Ban
} from 'lucide-react';
import GoogleDriveVideoPlayer from '../GoogleDriveVideoPlayer';

export default function AdminOrdersTable({
  activeNav,
  activePipelineOrders = [],
  orders = [],
  statusFilter,
  setStatusFilter,
  handleNavClick,
  filteredOrders = [],
  selectedOrderId,
  setSelectedOrderId,
  selectedOrder,
  handleRedirectToAssign,
  getDeliveryPerformance,
  statusHistoryMap = {},
  getExpectedDeliveryDate,
  getOrderAcceptedDate,
  getOrderStageDate,
  safeHref,
  showActionToast,
  handleToggleClientDeliverableAccess,
  stagedStatusMap = {},
  handleOrderFieldChange,
  handleUpdateStatusExplicitly,
  handleNotifyEditor,
  handleSaveOrderChanges,
  editorsList = [],
  historyFilter,
  setHistoryFilter,
  historySearch,
  setHistorySearch,
  adminRatingsMap = {},
  adminProfile,
  handleOpenCancelModal,
  isCancelModalOpen,
  orderToCancel,
  cancelReason,
  setCancelReason,
  cancelReasonError,
  setCancelReasonError,
  isCancelling,
  handleCloseCancelModal,
  handleConfirmCancelOrder
}) {
  return (
    <>
      {/* ============================================================== */}
      {/* VIEW 5: CURRENT ORDERS / ACTIVE PIPELINE                       */}
      {/* ============================================================== */}
      {activeNav === 'orders' && (
        <>
          <div className="vel-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <h1 className="vel-page-h1">Active Pipeline</h1>
                <span className="vel-studio-pill">
                  <span className="vel-rec-dot" />
                  <span>LIVE HUD</span>
                </span>
              </div>
              <p className="vel-page-sub">
                Managing {activePipelineOrders.length} {activePipelineOrders.length === 1 ? 'project' : 'projects'} currently in production pipeline.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
              <div style={{
                display: 'flex',
                gap: '4px',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid var(--vel-border)',
                overflowX: 'auto',
                maxWidth: '100%',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none'
              }}>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'RECEIVED', label: 'Received' },
                  { id: 'ACCEPTED', label: 'Accepted' },
                  { id: 'IN PROGRESS', label: 'In Progress' },
                  { id: 'REVIEWING', label: 'Reviewing' },
                  { id: 'REVISION', label: 'Revision' },
                  { id: 'ON HOLD', label: 'On Hold' },
                ].map(st => {
                  const isActive = statusFilter === st.id;
                  const count = st.id === 'ALL'
                    ? activePipelineOrders.length
                    : activePipelineOrders.filter(o => o.status === st.id).length;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setStatusFilter(st.id)}
                      style={{
                        background: isActive ? '#FFFFFF' : 'transparent',
                        color: isActive ? '#050507' : 'var(--vel-text-secondary)',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{st.label}</span>
                      {count > 0 && (
                        <span style={{
                          fontSize: '0.64rem',
                          padding: '1px 5px',
                          borderRadius: '10px',
                          background: isActive ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                          fontWeight: 700
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button className="vel-btn-solid" onClick={() => handleNavClick('create')}>
                <Plus className="h-3.5 w-3.5" />
                <span>New Order</span>
              </button>
            </div>
          </div>

          <div className="vel-pipeline-layout">
            {/* Left: Orders Table or Motion Graphics Radar Empty State */}
            <div className="vel-card" style={{ padding: '0', overflow: 'hidden' }}>
              {filteredOrders.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="vel-order-table">
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>PROJECT / CLIENT</th>
                        <th>EDITOR</th>
                        <th>DEADLINE</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((ord) => (
                        <tr
                          key={ord.id}
                          className={`vel-order-row ${selectedOrderId === ord.id ? 'selected' : ''}`}
                          onClick={() => setSelectedOrderId(ord.id)}
                        >
                          <td>
                            <span className="vel-order-id-tag">{ord.displayId}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{ord.title}</span>
                                {ord.additionalLink && (
                                  ord.clientLinkVisible ? (
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                                      ACCESS: GRANTED
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                                      ACCESS: RESTRICTED
                                    </span>
                                  )
                                )}
                              </div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)' }}>{ord.client}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {ord.editor.avatar ? (
                                <img src={ord.editor.avatar} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
                              ) : (
                                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#262633', display: 'inline-block' }} />
                              )}
                              <span style={{ fontStyle: ord.editor.name === 'Unassigned' ? 'italic' : 'normal', color: ord.editor.name === 'Unassigned' ? '#F59E0B' : 'inherit' }}>
                                {ord.editor.name}
                              </span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--vel-text-secondary)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem' }}>{ord.deadline}</td>
                          <td>
                            <span className={ord.badgeClass}>
                              <span className="vel-badge-pip" />
                              {ord.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {(!ord.editor.id || ord.editor.name === 'Unassigned') && ord.dbStatus !== 'delivered' && ord.dbStatus !== 'cancelled' && (
                                <button
                                  type="button"
                                  className="vel-btn-solid"
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)',
                                    color: '#000000',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRedirectToAssign(ord);
                                  }}
                                  title="Assign this order to an editor"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  <span>Assign</span>
                                </button>
                              )}
                              {ord.dbStatus !== 'cancelled' && ord.dbStatus !== 'delivered' && (
                                <button
                                  type="button"
                                  className="vel-btn-outline"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    color: '#F87171',
                                    borderColor: 'rgba(239, 68, 68, 0.35)',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCancelModal(ord);
                                  }}
                                  title="Cancel this order (Admin only)"
                                >
                                  <Ban className="h-3 w-3" />
                                  <span>Cancel</span>
                                </button>
                              )}
                              <ChevronRight className="h-4 w-4 text-white/40" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* CLEAN CINEMATIC EMPTY STATE */
                <div className="vel-empty-radar-pane">
                  <div className="vel-empty-icon-wrap">
                    <Clapperboard className="h-7 w-7 text-white/80" />
                  </div>

                  <div style={{ textAlign: 'center', maxWidth: '380px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {statusFilter !== 'ALL' ? 'No Matching Orders' : 'Pipeline Standing By'}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--vel-text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
                      {statusFilter !== 'ALL'
                        ? `No active projects currently match status "${statusFilter}". Reset your filter or create a new order.`
                        : 'There are currently no projects in the active pipeline. Create an order to begin production.'}
                    </p>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button className="vel-btn-solid" onClick={() => handleNavClick('create')}>
                        <Plus className="h-4 w-4" />
                        <span>Launch New Order</span>
                      </button>
                      {orders.filter(o => o.dbStatus === 'delivered').length > 0 && (
                        <button className="vel-btn-outline" onClick={() => handleNavClick('history')}>
                          <Archive className="h-4 w-4" />
                          <span>Delivered Archive ({orders.filter(o => o.dbStatus === 'delivered').length})</span>
                        </button>
                      )}
                      {statusFilter !== 'ALL' && (
                        <button className="vel-btn-outline" onClick={() => setStatusFilter('ALL')}>
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Reset Filter</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Order Detail or Studio Mission Control Console */}
            {selectedOrder && selectedOrder.id ? (
              <div className="vel-card" style={{ gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span className="vel-order-id-tag">{selectedOrder.displayId}</span>
                    <span className={selectedOrder.badgeClass}>
                      <span className="vel-badge-pip" />
                      {selectedOrder.status}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.66rem',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#94a3b8'
                    }}>
                      {selectedOrder.type || 'Standard Format'}
                    </span>
                    {selectedOrder.dbStatus === 'delivered' ? (
                      (() => {
                        const perf = getDeliveryPerformance(selectedOrder, statusHistoryMap);
                        return perf.isOnTime ? (
                          <span style={{ fontSize: '0.72rem', color: '#4ADE80', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(34, 197, 94, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.25)', fontWeight: 700 }}>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Delivered On Time</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#F87171', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)', fontWeight: 700 }}>
                            <AlertTriangle className="h-3 w-3" />
                            <span>Delivered {perf.label}</span>
                          </span>
                        );
                      })()
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#FCD34D', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.25)', fontWeight: 600 }}>
                        <Calendar className="h-3 w-3" />
                        <span>Expected: {getExpectedDeliveryDate(selectedOrder)}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>{selectedOrder.title}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--vel-text-secondary)', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Client: {selectedOrder.client}</span>
                        <span>•</span>
                        <span style={{ color: '#E2E8F0' }}>{selectedOrder.type}</span>
                        <span>•</span>
                        <span style={{ color: '#FCD34D' }}>Accepted: {getOrderAcceptedDate(selectedOrder, statusHistoryMap)}</span>
                      </div>
                    </div>

                    {selectedOrder.dbStatus !== 'cancelled' && selectedOrder.dbStatus !== 'delivered' && (
                      <button
                        type="button"
                        onClick={() => handleOpenCancelModal(selectedOrder)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: '1px solid rgba(239, 68, 68, 0.45)',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#F87171',
                          boxShadow: '0 2px 10px rgba(239, 68, 68, 0.15)',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.28)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.7)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        title="Cancel this order (Admin only)"
                      >
                        <Ban className="h-4 w-4 text-red-400" />
                        <span>Cancel Order</span>
                      </button>
                    )}
                  </div>

                  {selectedOrder.dbStatus === 'cancelled' && (
                    <div style={{
                      marginTop: '14px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}>
                      <Ban className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F87171', letterSpacing: '0.04em' }}>ORDER CANCELLED</div>
                        <div style={{ fontSize: '0.74rem', color: '#E2E8F0', marginTop: '3px' }}>
                          <strong style={{ color: '#FCA5A5' }}>Reason:</strong> {selectedOrder.cancellationReason || 'No detailed reason specified.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {(!selectedOrder.editor.id || selectedOrder.editor.name === 'Unassigned') && selectedOrder.dbStatus !== 'delivered' && (
                    <div style={{
                      marginTop: '14px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCheck className="h-4 w-4 text-amber-400 shrink-0" />
                        <span style={{ fontSize: '0.78rem', color: '#FCD34D', fontWeight: 600 }}>
                          This project is not assigned to an editor yet.
                        </span>
                      </div>
                      <button
                        type="button"
                        className="vel-btn-solid"
                        style={{
                          padding: '6px 14px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleRedirectToAssign(selectedOrder)}
                      >
                        <span>Assign Project to Editor</span>
                        <span>→</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Milestone Stepper with Laser Glow Track */}
                <div className="vel-stepper-wrap">
                  <div className="vel-stepper-line" />
                  <div
                    className="vel-stepper-progress"
                    style={{
                      width: `${Math.min(100, Math.max(0, (selectedOrder.currentStep / 4) * 100))}%`
                    }}
                  />
                  {[
                    { key: 'received', label: 'RECEIVED', step: 0 },
                    { key: 'accepted', label: 'ACCEPTED', step: 1 },
                    { key: 'in_editing', label: 'IN EDITING', step: 2 },
                    { key: 'in_review', label: 'IN REVIEW', step: 3 },
                    { key: 'delivered', label: 'DELIVERED', step: 4 },
                  ].map((st) => {
                    const isDone = selectedOrder.currentStep > st.step;
                    const isActive = selectedOrder.currentStep === st.step;
                    const stageDate = getOrderStageDate(selectedOrder, st.key, st.step);
                    return (
                      <div key={st.key} className="vel-step-item">
                        <div className={`vel-step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                          {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : isActive ? <span className="vel-badge-pip" /> : <span style={{ fontSize: '0.62rem', color: '#64748b' }}>{st.step + 1}</span>}
                        </div>
                        <span className="vel-step-label" style={{ marginTop: '4px' }}>
                          {st.label}
                        </span>
                        <span style={{
                          fontSize: '0.6rem',
                          color: isDone || isActive ? '#94A3B8' : 'var(--vel-text-secondary)',
                          letterSpacing: '0.02em',
                          marginTop: '2px',
                          fontWeight: isDone || isActive ? 600 : 400
                        }}>
                          {stageDate}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Assigned Editor & Client Contact Cards */}
                <div className="vel-form-grid-2">
                  <div style={{ padding: '14px 16px', background: 'var(--vel-bg-input)', borderRadius: '10px', border: '1px solid var(--vel-border)' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--vel-text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      ASSIGNED EDITOR
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {selectedOrder.editor.avatar ? (
                        <img src={selectedOrder.editor.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.2)' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#262633', border: '1px solid rgba(255,255,255,0.1)' }} />
                      )}
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: (!selectedOrder.editor.id || selectedOrder.editor.name === 'Unassigned') ? '#F59E0B' : '#FFFFFF' }}>
                          {selectedOrder.editor.name}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)' }}>{selectedOrder.editor.role}</div>
                      </div>
                    </div>

                    {(!selectedOrder.editor.id || selectedOrder.editor.name === 'Unassigned') && selectedOrder.dbStatus !== 'delivered' && (
                      <button
                        type="button"
                        className="vel-btn-solid"
                        style={{
                          marginTop: '12px',
                          width: '100%',
                          padding: '7px 12px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)',
                          color: '#000000',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleRedirectToAssign(selectedOrder)}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Assign Project →</span>
                      </button>
                    )}
                  </div>

                  <div style={{ padding: '14px 16px', background: 'var(--vel-bg-input)', borderRadius: '10px', border: '1px solid var(--vel-border)' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--vel-text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      CLIENT CONTACT
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1A1C28', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Users className="h-4 w-4 text-white/70" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{selectedOrder.clientContact.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)' }}>{selectedOrder.clientContact.company}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Assets & Submitted Deliverables Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--vel-border)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cloud className="h-3.5 w-3.5 text-white/70" />
                      <span>Editor Deliverables & Assets</span>
                    </span>

                    {selectedOrder.additionalLink && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: selectedOrder.clientLinkVisible ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: selectedOrder.clientLinkVisible ? '#4ADE80' : '#FCD34D',
                        border: selectedOrder.clientLinkVisible ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {selectedOrder.clientLinkVisible ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Client Access: Granted</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" />
                            <span>Client Access: Restricted (Admin Only)</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Editor Submitted Deliverable Link & Google Drive Preview */}
                  {selectedOrder.additionalLink ? (
                    <div style={{ padding: '14px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ExternalLink className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ADE80' }}>Editor Deliverables Submitted</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                              {selectedOrder.additionalLink}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            className="vel-btn-outline"
                            style={{ padding: '5px 9px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => {
                              navigator.clipboard?.writeText(selectedOrder.additionalLink);
                              showActionToast('Deliverable link copied to clipboard!');
                            }}
                            title="Copy link"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </button>
                          <a
                            href={safeHref(selectedOrder.additionalLink)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="vel-btn-solid"
                            style={{ padding: '5px 10px', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#22C55E', color: '#000000' }}
                          >
                            <span>Preview</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      {/* Embedded Google Drive Video Preview Player (Render only if deliverable link is present) */}
                      {selectedOrder.additionalLink ? (
                        <div style={{ marginTop: '10px' }}>
                          <GoogleDriveVideoPlayer
                            driveUrl={selectedOrder.additionalLink}
                            title={selectedOrder.title}
                          />
                        </div>
                      ) : null}

                      {/* Client Permission Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', gap: '10px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF' }}>Client Visibility Permission</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)' }}>
                            {selectedOrder.clientLinkVisible
                              ? 'Access is granted! Client can view and open this deliverable on their dashboard.'
                              : 'Access is restricted. Click "Allow Client to View" to grant the client access.'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleToggleClientDeliverableAccess}
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: 'none',
                            background: selectedOrder.clientLinkVisible ? '#EF4444' : '#22C55E',
                            color: selectedOrder.clientLinkVisible ? '#FFFFFF' : '#000000',
                            transition: 'all 0.2s'
                          }}
                        >
                          {selectedOrder.clientLinkVisible ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              <span>Revoke Client Access</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>Allow Client to View</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '14px 16px', background: 'var(--vel-bg-input)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--vel-text-primary)' }}>No Deliverable Submitted Yet</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--vel-text-secondary)', marginTop: '2px' }}>
                            Expected Delivery: <strong style={{ color: '#FCD34D' }}>{getExpectedDeliveryDate(selectedOrder)}</strong>
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 700 }}>
                        IN PROGRESS
                      </span>
                    </div>
                  )}

                  {/* Client Raw Footage Link (if provided) */}
                  {selectedOrder.driveLink && (
                    <div style={{ padding: '12px 14px', background: 'var(--vel-bg-input)', borderRadius: '10px', border: '1px solid var(--vel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--vel-text-secondary)' }}>Client Raw Footage</div>
                        <div style={{ fontSize: '0.72rem', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                          {selectedOrder.driveLink}
                        </div>
                      </div>
                      <a
                        href={safeHref(selectedOrder.driveLink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vel-btn-outline"
                        style={{ padding: '5px 10px', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                      >
                        <span>Open Raw</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* ADMIN CONTROLS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--vel-border)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    ADMIN CONTROLS
                  </span>

                  <div className="vel-field-group">
                    <label className="vel-label">Update Status</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        className="vel-select"
                        style={{ flex: 1 }}
                        value={
                          stagedStatusMap[selectedOrder.id] || (
                            selectedOrder.status === 'IN PROGRESS' ? 'IN EDITING' :
                            selectedOrder.status === 'REVIEWING' ? 'IN REVIEW' :
                            selectedOrder.status === 'COMPLETED' ? 'DELIVERED' :
                            selectedOrder.status
                          ) || 'RECEIVED'
                        }
                        onChange={(e) => {
                          handleOrderFieldChange('status', e.target.value);
                        }}
                      >
                        <option value="RECEIVED">Received</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="IN EDITING">In Editing</option>
                        <option value="IN REVIEW">In Review</option>
                        <option value="DELIVERED">Delivered</option>
                      </select>
                      <button
                        type="button"
                        className="vel-btn-solid"
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: stagedStatusMap[selectedOrder.id] ? '#22C55E' : 'rgba(255, 255, 255, 0.1)',
                          color: stagedStatusMap[selectedOrder.id] ? '#000000' : '#FFFFFF',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          border: 'none',
                          borderRadius: '6px'
                        }}
                        onClick={() => handleUpdateStatusExplicitly(stagedStatusMap[selectedOrder.id] || selectedOrder.status)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Update</span>
                      </button>
                    </div>
                    {Boolean(stagedStatusMap[selectedOrder.id]) && (
                      <span style={{ fontSize: '0.68rem', color: '#FCD34D', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Clock className="h-3 w-3" />
                        <span>Status ready to save. Click "Update" or "Save Changes" below.</span>
                      </span>
                    )}
                  </div>

                  <div className="vel-form-grid-2">
                    <div className="vel-field-group">
                      <label className="vel-label">Editor Deadline</label>
                      <input
                        type="date"
                        className="vel-input"
                        value={selectedOrder.editorDeadline}
                        onChange={(e) => handleOrderFieldChange('editorDeadline', e.target.value)}
                      />
                    </div>

                    <div className="vel-field-group">
                      <label className="vel-label">Client Deadline</label>
                      <input
                        type="date"
                        className="vel-input"
                        value={selectedOrder.clientDeadline}
                        onChange={(e) => handleOrderFieldChange('clientDeadline', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="vel-field-group">
                    <label className="vel-label">Admin Notes (Internal)</label>
                    <textarea
                      className="vel-textarea"
                      style={{ minHeight: '70px' }}
                      placeholder="Add internal notes for production team..."
                      value={selectedOrder.notes || ''}
                      onChange={(e) => handleOrderFieldChange('notes', e.target.value)}
                    />
                  </div>
                </div>

                {/* Bottom Action buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="vel-btn-outline" style={{ flex: 1 }} onClick={handleNotifyEditor}>
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Notify Editor</span>
                  </button>
                  <button
                    className="vel-btn-solid"
                    style={{
                      flex: 1,
                      background: selectedOrder.pendingStatusChange ? '#22C55E' : 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)',
                      color: '#000000',
                      fontWeight: 700
                    }}
                    onClick={handleSaveOrderChanges}
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{selectedOrder.pendingStatusChange ? 'Save Status & Changes' : 'Save Changes'}</span>
                  </button>
                </div>

                {selectedOrder.dbStatus !== 'cancelled' && selectedOrder.dbStatus !== 'delivered' && (
                  <button
                    type="button"
                    className="vel-btn-outline"
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      color: '#F87171',
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      padding: '10px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleOpenCancelModal(selectedOrder)}
                    title="Cancel this order (Admin only)"
                  >
                    <Ban className="h-4 w-4" />
                    <span>Cancel Order</span>
                  </button>
                )}

                {selectedOrder.dbStatus === 'cancelled' && (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F87171', fontWeight: 800, fontSize: '0.76rem' }}>
                      <Ban className="h-4 w-4" />
                      <span>ORDER CANCELLED</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#E2E8F0' }}>
                      <strong style={{ color: '#FCA5A5' }}>Reason:</strong> {selectedOrder.cancellationReason || 'No detailed reason specified.'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* STUDIO MISSION CONTROL TELEMETRY CONSOLE (WHEN 0 ORDERS OR NONE SELECTED) */
              <div className="vel-card" style={{ gap: '22px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span className="vel-studio-pill">
                      <span className="vel-rec-dot" style={{ background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                      <span>STUDIO MISSION CONTROL</span>
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.68rem',
                      color: '#FCD34D'
                    }}>
                      NODES: 100% HEALTH
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
                    Studio Production Telemetry
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--vel-text-secondary)', marginTop: '4px' }}>
                    Live telemetry overview of creative editing suites, GPU render nodes, and project delivery velocity.
                  </p>
                </div>

                {/* Telemetry Stat Cards */}
                <div className="vel-telemetry-grid">
                  <div className="vel-telemetry-stat">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--vel-text-secondary)', textTransform: 'uppercase' }}>GPU Nodes</span>
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', fontFamily: "'Space Grotesk', sans-serif" }}>12 Active</span>
                    <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 600 }}>Topaz AI & Gen-3 Online</span>
                  </div>

                  <div className="vel-telemetry-stat">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--vel-text-secondary)', textTransform: 'uppercase' }}>Editors Ready</span>
                      <Users className="h-3.5 w-3.5 text-white/70" />
                    </div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {editorsList.filter(e => e.status === 'approved').length} Active
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#FCD34D', fontWeight: 600 }}>Ready for Dispatch</span>
                  </div>

                  <div className="vel-telemetry-stat">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--vel-text-secondary)', textTransform: 'uppercase' }}>Historical Jobs</span>
                      <Archive className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {orders.filter(o => o.dbStatus === 'delivered').length} Delivered
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#FCD34D', fontWeight: 600 }}>Verified Testimonials</span>
                  </div>

                  <div className="vel-telemetry-stat">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--vel-text-secondary)', textTransform: 'uppercase' }}>Turnaround SLA</span>
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', fontFamily: "'Space Grotesk', sans-serif" }}>99.4%</span>
                    <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 600 }}>48h Target SLA Met</span>
                  </div>
                </div>

                {/* Live Frequency Spectrum & Visualizer */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(10, 11, 16, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clapperboard className="h-3.5 w-3.5 text-white/70" />
                      <span>AUDIO/VIDEO RENDER SPECTRUM</span>
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#E2E8F0' }}>
                      23.976 FPS // DCI-P3
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '36px', gap: '3px' }}>
                    {[12, 18, 24, 16, 32, 28, 14, 20, 36, 22, 18, 30, 24, 16, 28, 34, 20, 14, 22, 10, 18, 26, 30, 16].map((h, i) => (
                      <span
                        key={i}
                        className="vel-eq-bar"
                        style={{
                          height: `${h}px`,
                          flex: 1,
                          animationDelay: `${i * 0.05}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Action Dispatch Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    className="vel-btn-solid"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)',
                      color: '#000000',
                      fontWeight: 700
                    }}
                    onClick={() => handleNavClick('create')}>
                    <Plus className="h-4 w-4" />
                    <span>Create New Client Order</span>
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      className="vel-btn-outline"
                      onClick={() => handleNavClick('editors')}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Manage Editors</span>
                    </button>
                    <button
                      className="vel-btn-outline"
                      onClick={() => handleNavClick('cms')}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Website CMS</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* VIEW: ORDERS HISTORY / DELIVERED PROJECTS                      */}
      {/* ============================================================== */}
      {activeNav === 'history' && (
        <>
          <div className="vel-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="vel-page-h1" style={{ margin: 0 }}>Orders History</h1>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', background: 'rgba(34, 197, 94, 0.12)', color: '#4ADE80', border: '1px solid rgba(34, 197, 94, 0.28)' }}>
                  {orders.filter(o => o.dbStatus === 'delivered').length} Completed
                </span>
                {orders.filter(o => o.dbStatus === 'cancelled').length > 0 && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.12)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.28)' }}>
                    {orders.filter(o => o.dbStatus === 'cancelled').length} Cancelled
                  </span>
                )}
              </div>
              <p className="vel-page-sub" style={{ margin: 0 }}>
                Archived projects, delivered cut reels, and cancelled production logs with full audit trail.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Interactive Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className={`history-filter-pill ${historyFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('all')}
                >
                  All Completed ({orders.filter(o => o.dbStatus === 'delivered').length})
                </button>
                <button
                  type="button"
                  className={`history-filter-pill ${historyFilter === 'top-rated' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter(historyFilter === 'top-rated' ? 'all' : 'top-rated')}
                >
                  <Star className="h-3 w-3" fill={historyFilter === 'top-rated' ? '#000000' : '#F59E0B'} color={historyFilter === 'top-rated' ? '#000000' : '#F59E0B'} />
                  Top Rated
                </button>
                <button
                  type="button"
                  className={`history-filter-pill ${historyFilter === 'testimonials' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter(historyFilter === 'testimonials' ? 'all' : 'testimonials')}
                >
                  <Award className="h-3 w-3" />
                  Testimonials ({orders.filter(o => o.dbStatus === 'delivered' && adminRatingsMap[o.id]?.isTestimonial).length})
                </button>
                <button
                  type="button"
                  className={`history-filter-pill ${historyFilter === 'cancelled' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter(historyFilter === 'cancelled' ? 'all' : 'cancelled')}
                  style={historyFilter === 'cancelled' ? { background: '#EF4444', color: '#FFFFFF', borderColor: '#EF4444' } : {}}
                >
                  <Ban className="h-3 w-3" />
                  Cancelled ({orders.filter(o => o.dbStatus === 'cancelled').length})
                </button>
              </div>

              {/* Search Bar with inline icon and clear button */}
              <div className="vel-search-pill" style={{ width: '280px', position: 'relative' }}>
                <Search className="h-3.5 w-3.5" style={{ position: 'absolute', left: '12px', color: 'var(--vel-text-tertiary)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search orders, clients, editors..."
                  className="vel-search-input"
                  style={{ paddingLeft: '34px', paddingRight: historySearch ? '30px' : '14px' }}
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
                {historySearch && (
                  <button
                    type="button"
                    onClick={() => setHistorySearch('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--vel-text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      padding: '2px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Summary Metric Cards (Interactive, Animated & Glassmorphic) */}
          <div className="vel-kpi-grid">
            {/* Card 1: TOTAL DELIVERED */}
            <div 
              className={`vel-kpi-card kpi-emerald ${historyFilter === 'all' ? 'active' : ''}`}
              onClick={() => setHistoryFilter('all')}
              title="Click to view all delivered orders"
            >
              <div className="vel-kpi-top">
                <span className="vel-kpi-label">
                  <span className="vel-kpi-pulse-dot" style={{ background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                  TOTAL DELIVERED
                </span>
                <div className="vel-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' }}>
                  <Archive className="h-5 w-5" />
                </div>
              </div>
              <div className="vel-kpi-bottom">
                <div className="vel-kpi-val" style={{ background: 'linear-gradient(180deg, #FFFFFF 30%, #A7F3D0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {orders.filter(o => o.dbStatus === 'delivered').length}
                </div>
                <span className="vel-kpi-badge kpi-badge-emerald">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>100% Completed</span>
                </span>
              </div>
            </div>

            {/* Card 2: AVG CLIENT RATING */}
            <div 
              className={`vel-kpi-card kpi-amber ${historyFilter === 'top-rated' ? 'active' : ''}`}
              onClick={() => setHistoryFilter(historyFilter === 'top-rated' ? 'all' : 'top-rated')}
              title="Click to filter top rated orders"
            >
              <div className="vel-kpi-top">
                <span className="vel-kpi-label">
                  <span className="vel-kpi-pulse-dot" style={{ background: '#F59E0B', boxShadow: '0 0 8px #F59E0B' }} />
                  AVG CLIENT RATING
                </span>
                <div className="vel-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#FBBF24', boxShadow: '0 0 15px rgba(245, 158, 11, 0.15)' }}>
                  <Star className="h-5 w-5" fill="#F59E0B" />
                </div>
              </div>
              <div className="vel-kpi-bottom">
                <div className="vel-kpi-val" style={{ background: 'linear-gradient(180deg, #FFFFFF 30%, #FDE68A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {(() => {
                    const ratedOrders = orders.filter(o => o.dbStatus === 'delivered' && adminRatingsMap[o.id]);
                    if (ratedOrders.length === 0) return '5.0 ★';
                    const sum = ratedOrders.reduce((acc, o) => acc + (adminRatingsMap[o.id]?.rating || 5), 0);
                    return (sum / ratedOrders.length).toFixed(1) + ' ★';
                  })()}
                </div>
                <span className="vel-kpi-badge kpi-badge-amber">
                  <Sparkles className="h-3 w-3" />
                  <span>Top Satisfaction</span>
                </span>
              </div>
            </div>

            {/* Card 3: TESTIMONIALS READY */}
            <div 
              className={`vel-kpi-card kpi-silver ${historyFilter === 'testimonials' ? 'active' : ''}`}
              onClick={() => setHistoryFilter(historyFilter === 'testimonials' ? 'all' : 'testimonials')}
              title="Click to filter orders with testimonials"
            >
              <div className="vel-kpi-top">
                <span className="vel-kpi-label">
                  <span className="vel-kpi-pulse-dot" style={{ background: '#FFFFFF', boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)' }} />
                  TESTIMONIALS READY
                </span>
                <div className="vel-kpi-icon-wrap" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', boxShadow: '0 0 15px rgba(255, 255, 255, 0.12)' }}>
                  <Award className="h-5 w-5" />
                </div>
              </div>
              <div className="vel-kpi-bottom">
                <div className="vel-kpi-val" style={{ background: 'linear-gradient(180deg, #FFFFFF 30%, #D1D5DB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {orders.filter(o => o.dbStatus === 'delivered' && adminRatingsMap[o.id]?.isTestimonial).length}
                </div>
                <span className="vel-kpi-badge kpi-badge-silver">
                  <Quote className="h-3 w-3" />
                  <span>Showcase Ready</span>
                </span>
              </div>
            </div>

            {/* Card 4: CANCELLED ORDERS */}
            <div 
              className={`vel-kpi-card ${historyFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setHistoryFilter(historyFilter === 'cancelled' ? 'all' : 'cancelled')}
              style={{ cursor: 'pointer', border: historyFilter === 'cancelled' ? '1.5px solid #EF4444' : undefined }}
              title="Click to view all cancelled orders"
            >
              <div className="vel-kpi-top">
                <span className="vel-kpi-label">
                  <span className="vel-kpi-pulse-dot" style={{ background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
                  CANCELLED ORDERS
                </span>
                <div className="vel-kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#F87171', boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)' }}>
                  <Ban className="h-5 w-5" />
                </div>
              </div>
              <div className="vel-kpi-bottom">
                <div className="vel-kpi-val" style={{ background: 'linear-gradient(180deg, #FFFFFF 30%, #FCA5A5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {orders.filter(o => o.dbStatus === 'cancelled').length}
                </div>
                <span className="vel-kpi-badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <Ban className="h-3 w-3" />
                  <span>Terminated</span>
                </span>
              </div>
            </div>
          </div>

          {/* Orders History Table */}
          {(() => {
            if (historyFilter === 'cancelled') {
              const cancelledOrdersList = orders
                .filter(o => o.dbStatus === 'cancelled')
                .filter(o => {
                  if (!historySearch.trim()) return true;
                  const query = historySearch.toLowerCase();
                  return (
                    o.title.toLowerCase().includes(query) ||
                    o.client.toLowerCase().includes(query) ||
                    o.editor.name.toLowerCase().includes(query) ||
                    o.id.toLowerCase().includes(query) ||
                    (o.cancellationReason && o.cancellationReason.toLowerCase().includes(query))
                  );
                });

              if (cancelledOrdersList.length === 0) {
                return (
                  <div className="vel-card" style={{ padding: '60px 20px', textAlign: 'center', alignItems: 'center', gap: '14px' }}>
                    <Ban className="h-10 w-10 text-red-400/40" />
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>No Cancelled Orders Found</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--vel-text-secondary)', maxWidth: '420px' }}>
                      {historySearch ? 'No cancelled projects match your search query.' : 'There are currently no cancelled projects in your studio archive.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="vel-card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table className="vel-order-table">
                    <thead>
                      <tr>
                        <th>PROJECT / ORDER</th>
                        <th>CLIENT</th>
                        <th>ASSIGNED EDITOR</th>
                        <th>CANCELLATION DATE</th>
                        <th>STATUS</th>
                        <th>CANCELLATION REASON / DESCRIPTION</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelledOrdersList.map((ord) => {
                        const cancelDate = ord.cancelledAt
                          ? new Date(ord.cancelledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : (ord.updatedAt ? new Date(ord.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently');

                        return (
                          <tr key={ord.id} className="vel-order-row">
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{ord.title}</span>
                                  <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--vel-text-secondary)' }}>
                                    {ord.type}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.68rem', color: '#CBD5E1', letterSpacing: '0.03em', fontFamily: 'monospace' }}>
                                  {ord.displayId}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                                  {ord.client ? ord.client.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>{ord.client}</span>
                              </div>
                            </td>

                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {ord.editor.avatar ? (
                                  <img src={ord.editor.avatar} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#262633', display: 'inline-block' }} />
                                )}
                                <span style={{ fontSize: '0.8rem', color: ord.editor.name === 'Unassigned' ? '#F59E0B' : 'inherit' }}>
                                  {ord.editor.name}
                                </span>
                              </div>
                            </td>

                            <td style={{ color: 'var(--vel-text-secondary)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem' }}>
                              {cancelDate}
                            </td>

                            <td>
                              <span className="vel-badge-cancelled">
                                <span className="vel-badge-pip" />
                                CANCELLED
                              </span>
                            </td>

                            <td style={{ maxWidth: '340px' }}>
                              <div style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#FECACA',
                                fontSize: '0.76rem',
                                lineHeight: 1.45,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px'
                              }}>
                                <Quote className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                                <span>{ord.cancellationReason || 'No detailed reason provided.'}</span>
                              </div>
                            </td>

                            <td>
                              <button
                                className="vel-btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                onClick={() => {
                                  setSelectedOrderId(ord.id);
                                  handleNavClick('orders');
                                }}
                              >
                                <span>View Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
            }

            const deliveredOrders = orders
              .filter(o => o.dbStatus === 'delivered')
              .filter(o => {
                if (historyFilter === 'top-rated') {
                  const rating = adminRatingsMap[o.id]?.rating;
                  return (rating && rating >= 4.5) || (!rating);
                }
                if (historyFilter === 'testimonials') {
                  return adminRatingsMap[o.id]?.isTestimonial;
                }
                return true;
              })
              .filter(o => {
                if (!historySearch.trim()) return true;
                const query = historySearch.toLowerCase();
                return (
                  o.title.toLowerCase().includes(query) ||
                  o.client.toLowerCase().includes(query) ||
                  o.editor.name.toLowerCase().includes(query) ||
                  o.id.toLowerCase().includes(query)
                );
              });

            if (deliveredOrders.length === 0) {
              return (
                <div className="vel-card" style={{ padding: '60px 20px', textAlign: 'center', alignItems: 'center', gap: '14px' }}>
                  <Archive className="h-10 w-10 text-white/30" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>No Delivered Orders Found</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--vel-text-secondary)', maxWidth: '420px' }}>
                    {historySearch || historyFilter !== 'all' ? 'No delivered projects match your filter or search criteria.' : 'When an active project status is updated to Completed and saved, it will automatically be archived here.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="vel-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="vel-order-table">
                  <thead>
                    <tr>
                      <th>PROJECT</th>
                      <th>CLIENT</th>
                      <th>ASSIGNED EDITOR</th>
                      <th>ACCEPTED DATE</th>
                      <th>DELIVERY & TIMELINESS</th>
                      <th>CLIENT RATING</th>
                      <th>FEEDBACK & TESTIMONIAL</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveredOrders.map((ord) => {
                      const ratingObj = adminRatingsMap[ord.id];
                      const deliveredFormatted = ord.updatedAt
                        ? new Date(ord.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : ord.deadline;
                      const acceptedFormatted = getOrderAcceptedDate(ord, statusHistoryMap);
                      const perf = getDeliveryPerformance(ord, statusHistoryMap);

                      return (
                        <tr key={ord.id} className="vel-order-row">
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{ord.title}</span>
                                <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--vel-text-secondary)' }}>
                                  {ord.type}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.68rem', color: '#CBD5E1', letterSpacing: '0.03em', fontFamily: 'monospace' }}>
                                {ord.displayId}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                                {ord.client ? ord.client.charAt(0).toUpperCase() : 'C'}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>{ord.client}</span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)' }}>
                                  {ord.clientContact?.company || 'Direct Client'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {ord.editor.avatar ? (
                                <img src={ord.editor.avatar} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                              ) : (
                                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#262633', display: 'inline-block' }} />
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{ord.editor.name}</span>
                                <span style={{ fontSize: '0.66rem', color: 'var(--vel-text-secondary)' }}>{ord.editor.role || 'Video Editor'}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 600 }}>
                                  {acceptedFormatted}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--vel-text-secondary)' }}>Accepted</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '0.8rem', color: '#FFFFFF', fontWeight: 700 }}>
                                {deliveredFormatted}
                              </span>
                              {perf.isOnTime ? (
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: 'rgba(34, 197, 94, 0.15)',
                                  color: '#4ADE80',
                                  border: '1px solid rgba(34, 197, 94, 0.35)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  width: 'fit-content'
                                }}>
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>On Time</span>
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#F87171',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  width: 'fit-content'
                                }}>
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>{perf.label}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            {ratingObj ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className="h-3.5 w-3.5"
                                    fill={s <= ratingObj.rating ? '#F59E0B' : 'transparent'}
                                    color={s <= ratingObj.rating ? '#F59E0B' : '#4B5563'}
                                  />
                                ))}
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FCD34D', marginLeft: '4px' }}>
                                  {ratingObj.rating}.0
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', fontStyle: 'italic' }}>
                                Pending Client Rating
                              </span>
                            )}
                          </td>

                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '280px' }}>
                              {ratingObj?.cleanFeedback ? (
                                <span style={{ fontSize: '0.74rem', color: 'var(--vel-text-primary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  "{ratingObj.cleanFeedback}"
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.7rem', color: 'var(--vel-text-secondary)' }}>No review text</span>
                              )}

                              {ratingObj?.isTestimonial && (
                                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#FCD34D', border: '1px solid rgba(234, 179, 8, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '3px', width: 'fit-content' }}>
                                  <Award className="h-3 w-3" />
                                  <span>TESTIMONIAL READY</span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {ord.additionalLink && (
                                <a
                                  href={safeHref(ord.additionalLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="vel-btn-outline"
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <span>Drive</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              <button
                                className="vel-btn-outline"
                                style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                onClick={() => {
                                  setSelectedOrderId(ord.id);
                                  handleNavClick('orders');
                                }}
                              >
                                <span>Details</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
          })()}
        </>
      )}

      {/* ============================================================== */}
      {/* CANCEL ORDER MODAL (ADMIN ONLY)                                */}
      {/* ============================================================== */}
      {isCancelModalOpen && orderToCancel && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCancelling) {
              handleCloseCancelModal();
            }
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #181822 0%, #101017 100%)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(239, 68, 68, 0.15)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'velModalFadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(239, 68, 68, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F87171'
                }}>
                  <Ban className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Cancel Client Order
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>
                    {orderToCancel.displayId || orderToCancel.orderCode}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCloseCancelModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.25rem',
                  cursor: isCancelling ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Admin Exclusivity Warning Callout */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.09)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}>
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div style={{ fontSize: '0.76rem', color: '#E2E8F0', lineHeight: 1.5 }}>
                  <strong style={{ color: '#F87171' }}>Admin Authorization Only:</strong> Only studio administrators can cancel client orders. This action will halt active editing production, notify the client & editor, and archive the project.
                </div>
              </div>

              {/* Order Target Summary */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Target Project & Client
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {orderToCancel.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#CBD5E1', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>Client: <strong style={{ color: '#FFFFFF' }}>{orderToCancel.client}</strong></span>
                  <span>Editor: <strong style={{ color: '#FFFFFF' }}>{orderToCancel.editor?.name || 'Unassigned'}</strong></span>
                </div>
              </div>

              {/* Cancellation Reason / Description Textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    Description / Reason for Cancellation <span style={{ color: '#F87171' }}>*</span>
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Required</span>
                </label>
                <textarea
                  value={cancelReason}
                  disabled={isCancelling}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    if (cancelReasonError) setCancelReasonError('');
                  }}
                  placeholder="Please state the specific reason for cancelling this order (e.g., Client requested termination, duplicate order, invalid brief, raw footage unreadable, billing dispute)..."
                  rows={4}
                  className="vel-textarea"
                  style={{
                    width: '100%',
                    minHeight: '110px',
                    padding: '12px',
                    borderRadius: '8px',
                    borderColor: cancelReasonError ? '#EF4444' : undefined,
                    boxShadow: cancelReasonError ? '0 0 0 1px #EF4444' : undefined
                  }}
                />
                {cancelReasonError && (
                  <span style={{ fontSize: '0.74rem', color: '#F87171', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{cancelReasonError}</span>
                  </span>
                )}
                <span style={{ fontSize: '0.7rem', color: 'var(--vel-text-secondary)' }}>
                  This reason will be recorded on the order's permanent audit trail and shared with the client.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: 'rgba(0, 0, 0, 0.28)'
            }}>
              <button
                type="button"
                className="vel-btn-outline"
                disabled={isCancelling}
                onClick={handleCloseCancelModal}
                style={{ padding: '9px 18px', fontSize: '0.8rem' }}
              >
                Nevermind, Keep Order
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancelOrder}
                style={{
                  background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 22px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: isCancelling ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(220, 38, 38, 0.45)'
                }}
              >
                {isCancelling ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Cancelling Order...</span>
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    <span>Confirm & Cancel Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
