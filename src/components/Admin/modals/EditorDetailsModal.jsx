import React from 'react';
import { X, Mail, Phone, Package, Calendar, CheckCircle2, Clock, DollarSign, User, ExternalLink, Sparkles, Send } from 'lucide-react';

export default function EditorDetailsModal({
  selectedEditorModal,
  setSelectedEditorModal,
  orders = [],
  handleNavClick,
  setAssignForm
}) {
  if (!selectedEditorModal) return null;

  // Find all orders assigned to or completed by this editor
  const editorOrders = (orders || []).filter((o) => {
    if (!selectedEditorModal) return false;
    const edId = selectedEditorModal.id;
    const edName = (selectedEditorModal.name || '').toLowerCase();

    if (edId && (o.editorId === edId || o.editor?.id === edId)) return true;
    if (edName && o.editor?.name && o.editor.name.toLowerCase() === edName && edName !== 'unassigned') return true;
    return false;
  });

  const activeOrdersCount = editorOrders.filter(o => o.dbStatus !== 'delivered' && o.dbStatus !== 'cancelled').length;
  const deliveredOrdersCount = editorOrders.filter(o => o.dbStatus === 'delivered').length;
  const totalHandledValue = editorOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const currencySymbol = editorOrders[0]?.currencySymbol || '₹';

  return (
    <div className="vel-modal-backdrop" onClick={() => setSelectedEditorModal(null)}>
      <div
        className="vel-modal"
        style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vel-modal-head">
          <div>
            <h3 className="vel-modal-title">Editor Profile & Project History</h3>
            <p className="vel-subtext" style={{ fontSize: '0.78rem', marginTop: '2px' }}>
              Specialization, active workload, completed deliveries, and fee breakdown.
            </p>
          </div>
          <button
            type="button"
            className="vel-icon-btn"
            onClick={() => setSelectedEditorModal(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="vel-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* Profile Overview Header Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid var(--vel-border)' }}>
            <img
              src={selectedEditorModal.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
              alt={selectedEditorModal.name}
              style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {selectedEditorModal.name}
                </h4>
                <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.16)', fontWeight: 600 }}>
                  {selectedEditorModal.category || 'AI Video Editor'}
                </span>
                {selectedEditorModal.rating && (
                  <span style={{ fontSize: '0.72rem', color: '#EAB308', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                    ★ {selectedEditorModal.rating}
                  </span>
                )}
                <span style={{
                  fontSize: '0.66rem',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: selectedEditorModal.status === 'AT CAPACITY' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.12)',
                  color: selectedEditorModal.status === 'AT CAPACITY' ? '#F87171' : '#4ADE80',
                  border: selectedEditorModal.status === 'AT CAPACITY' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.25)',
                  fontWeight: 600
                }}>
                  {selectedEditorModal.status}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--vel-text-secondary)', marginTop: '3px', margin: 0 }}>
                {selectedEditorModal.tagline || selectedEditorModal.role}
                {selectedEditorModal.email && <span> • Email: <span style={{ color: '#E2E8F0' }}>{selectedEditorModal.email}</span></span>}
              </p>
            </div>
          </div>

          {/* Quick Orders & Workload Stats Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Total Projects</span>
              <strong style={{ fontSize: '1.05rem', color: '#60A5FA', marginTop: '2px', display: 'block' }}>{editorOrders.length}</strong>
            </div>

            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: '#FCD34D', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Active</span>
              <strong style={{ fontSize: '1.05rem', color: '#FBBF24', marginTop: '2px', display: 'block' }}>{activeOrdersCount}</strong>
            </div>

            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: '#4ADE80', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Delivered</span>
              <strong style={{ fontSize: '1.05rem', color: '#4ADE80', marginTop: '2px', display: 'block' }}>{deliveredOrdersCount}</strong>
            </div>

            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: '#C084FC', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Project Value</span>
              <strong style={{ fontSize: '0.98rem', color: '#C084FC', marginTop: '2px', display: 'block' }}>
                {totalHandledValue > 0 ? `${currencySymbol}${totalHandledValue.toLocaleString()}` : '—'}
              </strong>
            </div>
          </div>

          {/* Primary Specialization & Skills tags */}
          <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px 14px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--vel-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
              SKILLS & SPECIALIZATION
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {Array.isArray(selectedEditorModal.skills) && selectedEditorModal.skills.map((sk, i) => (
                <span key={i} className="vel-tag-skill">
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Editor Orders & Projects History Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package className="h-4 w-4 text-purple-400" />
                <span>Assigned & Delivered Projects ({editorOrders.length})</span>
              </span>
            </div>

            {editorOrders.length === 0 ? (
              <div style={{ padding: '24px', background: '#0E0E14', borderRadius: '8px', border: '1px solid var(--vel-border)', textAlign: 'center' }}>
                <Package className="h-6 w-6 text-white/20" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.82rem', color: 'var(--vel-text-secondary)', margin: 0 }}>
                  No orders have been assigned to this editor yet.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {editorOrders.map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      background: '#121218',
                      border: '1px solid var(--vel-border)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }}>
                          {ord.displayId}
                        </span>
                        <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{ord.title}</strong>
                      </div>

                      <span className={`vel-badge ${ord.badgeClass}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                        {ord.status}
                      </span>
                    </div>

                    {/* Order Details Grid: Client, Created Date, Delivered Date, Price */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.74rem', color: 'var(--vel-text-secondary)' }}>
                      <div>
                        <span style={{ color: 'var(--vel-text-tertiary)', display: 'block', fontSize: '0.66rem' }}>CLIENT</span>
                        <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{ord.client || 'Direct Client'}</span>
                      </div>

                      <div>
                        <span style={{ color: 'var(--vel-text-tertiary)', display: 'block', fontSize: '0.66rem' }}>CREATED DATE</span>
                        <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{ord.formattedCreatedAt || '—'}</span>
                      </div>

                      <div>
                        <span style={{ color: 'var(--vel-text-tertiary)', display: 'block', fontSize: '0.66rem' }}>
                          {ord.isDelivered ? 'DELIVERED DATE' : 'DEADLINE'}
                        </span>
                        <span style={{ color: ord.isDelivered ? '#4ADE80' : '#FCD34D', fontWeight: 600 }}>
                          {ord.isDelivered ? (ord.formattedDeliveredAt || 'Delivered') : (ord.deadline || ord.editorDeadline || 'In Progress')}
                        </span>
                      </div>

                      <div>
                        <span style={{ color: 'var(--vel-text-tertiary)', display: 'block', fontSize: '0.66rem' }}>PRICE / FEE</span>
                        {ord.totalAmount ? (
                          <span style={{ color: '#C084FC', fontWeight: 700 }}>
                            {ord.currencySymbol}{Number(ord.totalAmount).toLocaleString()}
                            {ord.advancePaid ? ` (Adv: ${ord.currencySymbol}${Number(ord.advancePaid).toLocaleString()})` : ''}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--vel-text-tertiary)' }}>Price not set</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="vel-modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {handleNavClick && setAssignForm && (
              <button
                type="button"
                className="vel-btn-solid"
                style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setAssignForm(prev => ({ ...prev, editor: selectedEditorModal.name }));
                  setSelectedEditorModal(null);
                  handleNavClick('assign');
                }}
              >
                <Send className="h-3.5 w-3.5" />
                <span>Assign New Project</span>
              </button>
            )}
          </div>

          <button
            type="button"
            className="vel-btn-outline"
            onClick={() => setSelectedEditorModal(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
