import React from 'react';
import { X, MessageSquare, Mail } from 'lucide-react';

export default function ClientDetailsModal({
  selectedClientModal,
  setSelectedClientModal
}) {
  if (!selectedClientModal) return null;

  return (
    <div className="vel-modal-backdrop" onClick={() => setSelectedClientModal(null)}>
      <div
        className="vel-modal"
        style={{ maxWidth: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vel-modal-head">
          <div>
            <h3 className="vel-modal-title">Client Account Details</h3>
            <p className="vel-subtext" style={{ fontSize: '0.78rem', marginTop: '2px' }}>
              Complete identity, contact, and name modification history.
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

        <div className="vel-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <div>
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
                User ID: <span style={{ fontFamily: 'monospace', fontSize: '0.74rem' }}>{selectedClientModal.id}</span>
              </p>
            </div>
          </div>

          {/* Name Change Notice if client previously altered their name */}
          {selectedClientModal.previous_name && (
            <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '10px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FACC15' }}>
                  ● Client Name Modification Detected
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#E2E8F0', marginTop: '4px', margin: 0 }}>
                This client previously registered under the name: <strong style={{ color: '#FDE047' }}>{selectedClientModal.previous_name}</strong>
              </p>
            </div>
          )}

          {/* Details Key-Value Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Current Display Name
              </label>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF', marginTop: '3px' }}>
                {selectedClientModal.name || 'Not provided'}
              </div>
            </div>

            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Previous Name (Old Name)
              </label>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: selectedClientModal.previous_name ? '#FACC15' : 'var(--vel-text-tertiary)', marginTop: '3px' }}>
                {selectedClientModal.previous_name ? selectedClientModal.previous_name : 'No previous name (never changed)'}
              </div>
            </div>

            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Company / Brand
              </label>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF', marginTop: '3px' }}>
                {selectedClientModal.company_name || 'Not provided'}
              </div>
            </div>

            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Phone Number
              </label>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: selectedClientModal.phone ? '#34D399' : 'var(--vel-text-tertiary)', marginTop: '3px' }}>
                {selectedClientModal.phone || 'Not provided'}
              </div>
            </div>

            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Email Address
              </label>
              <div style={{ fontSize: '0.86rem', color: '#FFFFFF', marginTop: '3px', wordBreak: 'break-all' }}>
                {selectedClientModal.email}
              </div>
            </div>

            <div style={{ background: '#121218', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Registered On
              </label>
              <div style={{ fontSize: '0.84rem', color: '#FFFFFF', marginTop: '3px' }}>
                {selectedClientModal.created_at ? new Date(selectedClientModal.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
            </div>
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
