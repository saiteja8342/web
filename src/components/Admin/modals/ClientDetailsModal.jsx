import React from 'react';
import { X, MessageSquare, Mail, Package, Calendar, CheckCircle2, Clock, DollarSign, User, ExternalLink, Sparkles } from 'lucide-react';

export default function ClientDetailsModal({
  selectedClientModal,
  setSelectedClientModal,
  orders = []
}) {
  if (!selectedClientModal) return null;

  // Find all past and active orders for this client
  const clientOrders = (orders || []).filter((o) => {
    if (!selectedClientModal) return false;
    const clId = selectedClientModal.id;
    const clEmail = (selectedClientModal.email || '').toLowerCase();
    const clName = (selectedClientModal.name || '').toLowerCase();

    return (
      o.clientId === clId ||
      (clEmail && o.clientContact?.email?.toLowerCase() === clEmail) ||
      (clEmail && o.rawAdminNotes?.toLowerCase().includes(`[offline_client_email:${clEmail}]`)) ||
      (clName && o.client?.toLowerCase() === clName)
    );
  });

  const activeOrdersCount = clientOrders.filter(o => o.dbStatus !== 'delivered' && o.dbStatus !== 'cancelled').length;
  const deliveredOrdersCount = clientOrders.filter(o => o.dbStatus === 'delivered').length;
  const totalRevenue = clientOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const currencySymbol = clientOrders[0]?.currencySymbol || '₹';

  return (
    <div className="vel-modal-backdrop" onClick={() => setSelectedClientModal(null)}>
      <div
        className="vel-modal"
        style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vel-modal-head">
          <div>
            <h3 className="vel-modal-title">Client Account & Order History</h3>
            <p className="vel-subtext" style={{ fontSize: '0.78rem', marginTop: '2px' }}>
              Client identity, contact details, and complete project order history.
            </p>
          </div>
          <button
            type="button"
            className="vel-icon-btn"
            onClick={() => setSelectedClientModal(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="vel-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* Profile Overview Header Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid var(--vel-border)' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#181824',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#FFFFFF'
            }}>
              {selectedClientModal.name ? selectedClientModal.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {selectedClientModal.name}
                </h4>
                {selectedClientModal.isGoogle && (
                  <span style={{ fontSize: '0.66rem', padding: '2px 7px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.18)', fontWeight: 600 }}>
                    Google Auth
                  </span>
                )}
                <span style={{
                  fontSize: '0.66rem',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: selectedClientModal.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.12)',
                  color: selectedClientModal.status === 'rejected' ? '#F87171' : '#4ADE80',
                  border: selectedClientModal.status === 'rejected' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.25)',
                  fontWeight: 600
                }}>
                  {selectedClientModal.status === 'rejected' ? 'Suspended / Blocked' : 'Active Client'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--vel-text-secondary)', marginTop: '3px', margin: 0 }}>
                Email: <span style={{ color: '#E2E8F0' }}>{selectedClientModal.email}</span>
                {selectedClientModal.phone && <span> • Phone: <span style={{ color: '#4ADE80' }}>{selectedClientModal.phone}</span></span>}
              </p>
            </div>
          </div>

          {/* Quick Orders & Invoicing Stats Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Total Orders</span>
              <strong style={{ fontSize: '1.05rem', color: '#FFFFFF', marginTop: '2px', display: 'block' }}>{clientOrders.length}</strong>
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
              <span style={{ fontSize: '0.68rem', color: '#C084FC', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Total Value</span>
              <strong style={{ fontSize: '0.98rem', color: '#C084FC', marginTop: '2px', display: 'block' }}>
                {totalRevenue > 0 ? `${currencySymbol}${totalRevenue.toLocaleString()}` : '—'}
              </strong>
            </div>
          </div>

          {/* Details Key-Value Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '10px 12px' }}>
              <label style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Company / Brand
              </label>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF', marginTop: '2px' }}>
                {selectedClientModal.company_name || 'Not provided'}
              </div>
            </div>

            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '10px 12px' }}>
              <label style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Registered On
              </label>
              <div style={{ fontSize: '0.84rem', color: '#FFFFFF', marginTop: '2px' }}>
                {selectedClientModal.created_at ? new Date(selectedClientModal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </div>
            </div>

            {selectedClientModal.previous_name && (
              <div style={{ background: '#121218', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
                <label style={{ fontSize: '0.68rem', color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Previous Name
                </label>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FDE047', marginTop: '2px' }}>
                  {selectedClientModal.previous_name}
                </div>
              </div>
            )}
          </div>

          {/* Client Order History Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package className="h-4 w-4 text-purple-400" />
                <span>Client Orders & Projects ({clientOrders.length})</span>
              </span>
            </div>

            {clientOrders.length === 0 ? (
              <div style={{ padding: '24px', background: '#0E0E14', borderRadius: '8px', border: '1px solid var(--vel-border)', textAlign: 'center' }}>
                <Package className="h-6 w-6 text-white/20" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.82rem', color: 'var(--vel-text-secondary)', margin: 0 }}>
                  No orders have been initialized for this client yet.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {clientOrders.map((ord) => (
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

                    {/* Order Details Grid: Created Date, Delivered Date, Price, Editor */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.74rem', color: 'var(--vel-text-secondary)' }}>
                      <div>
                        <span style={{ color: 'var(--vel-text-tertiary)', display: 'block', fontSize: '0.66rem' }}>CREATED DATE</span>
                        <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{ord.formattedCreatedAt || '—'}</span>
                      </div>

                      <div>
                        <span style={{ color: 'var(--vel-text-tertiary)', display: 'block', fontSize: '0.66rem' }}>
                          {ord.isDelivered ? 'DELIVERED DATE' : 'DEADLINE'}
                        </span>
                        <span style={{ color: ord.isDelivered ? '#4ADE80' : '#FCD34D', fontWeight: 600 }}>
                          {ord.isDelivered ? (ord.formattedDeliveredAt || 'Delivered') : (ord.deadline || ord.clientDeadline || 'In Progress')}
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

                      <div>
                        <span style={{ color: 'var(--vel-text-tertiary)', display: 'block', fontSize: '0.66rem' }}>ASSIGNED EDITOR</span>
                        <span style={{ color: ord.editor?.name === 'Unassigned' ? '#F59E0B' : '#E2E8F0', fontWeight: 600 }}>
                          {ord.editor?.name || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="vel-modal-foot">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedClientModal.phone && (
              <a
                href={`https://wa.me/${selectedClientModal.phone.replace(/[^\d+]/g, '').replace(/^0+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="vel-btn-solid"
                style={{ background: '#25D366', borderColor: '#25D366', color: '#000000', textDecoration: 'none', fontSize: '0.8rem' }}
              >
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            )}
            {selectedClientModal.email && (
              <a
                href={`mailto:${selectedClientModal.email}`}
                className="vel-btn-outline"
                style={{ textDecoration: 'none', fontSize: '0.8rem' }}
              >
                <Mail className="h-4 w-4" />
                <span>Send Email</span>
              </a>
            )}
          </div>

          <button
            type="button"
            className="vel-btn-outline"
            onClick={() => setSelectedClientModal(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
