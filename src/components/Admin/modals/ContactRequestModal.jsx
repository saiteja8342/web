import React, { useEffect } from 'react';
import { X, Save, MessageSquare, Mail } from 'lucide-react';
import { PROJECT_TYPE_LABELS } from '../../../lib/db/contactRequests';

export default function ContactRequestModal({
  selectedContactRequest,
  setSelectedContactRequest,
  handleUpdateContactStatus,
  tempContactNotes,
  setTempContactNotes,
  isSavingNotes,
  handleSaveContactNotes,
  getWhatsAppUrl
}) {
  useEffect(() => {
    if (!selectedContactRequest) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedContactRequest(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedContactRequest, setSelectedContactRequest]);

  if (!selectedContactRequest) return null;

  return (
    <div className="vel-modal-backdrop" onClick={() => setSelectedContactRequest(null)}>
      <div
        className="vel-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-request-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div className="vel-modal-head">
          <div>
            <h3 id="contact-request-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
              Contact Request Details
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--vel-text-secondary)', marginTop: '2px' }}>
              Submitted on {selectedContactRequest.created_at ? new Date(selectedContactRequest.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedContactRequest(null)}
            aria-label="Close modal"
            style={{ background: 'transparent', border: 'none', color: 'var(--vel-text-tertiary)', cursor: 'pointer' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="vel-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Contact Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="vel-field-group">
              <label className="vel-label">Client Name</label>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF' }}>{selectedContactRequest.name}</div>
            </div>

            <div className="vel-field-group">
              <label className="vel-label">Project Type</label>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#C084FC' }}>
                {PROJECT_TYPE_LABELS[selectedContactRequest.project_type] || selectedContactRequest.project_type}
              </div>
            </div>

            <div className="vel-field-group">
              <label className="vel-label">Email Address</label>
              <a href={`mailto:${selectedContactRequest.email}`} style={{ fontSize: '0.85rem', color: '#FFFFFF', textDecoration: 'none' }}>
                {selectedContactRequest.email}
              </a>
            </div>

            <div className="vel-field-group">
              <label className="vel-label">Phone Number</label>
              <div style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>
                {selectedContactRequest.phone || 'Not provided'}
              </div>
            </div>
          </div>

          {/* Status Selector */}
          <div className="vel-field-group">
            <label className="vel-label">Inquiry Status</label>
            <select
              value={selectedContactRequest.status || 'new'}
              onChange={(e) => handleUpdateContactStatus(selectedContactRequest.id, e.target.value)}
              className="vel-select"
            >
              <option value="new">New (Uncontacted)</option>
              <option value="contacted">Contacted</option>
              <option value="in_discussion">In Discussion</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Full Project Details */}
          <div className="vel-field-group">
            <label className="vel-label">Project Details / Message</label>
            <div style={{
              background: 'var(--vel-bg-input)',
              border: '1px solid var(--vel-border)',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              color: '#FFFFFF',
              whiteSpace: 'pre-wrap',
              maxHeight: '220px',
              overflowY: 'auto'
            }}>
              {selectedContactRequest.message}
            </div>
          </div>

          {/* Internal Admin Notes */}
          <div className="vel-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="vel-label" style={{ margin: 0 }}>Internal Admin Notes</label>
              <span style={{ fontSize: '0.68rem', color: 'var(--vel-text-tertiary)' }}>Private to admin team</span>
            </div>
            <textarea
              rows={3}
              placeholder="Add notes about pricing discussed, follow-up timeline, client preferences..."
              className="vel-input"
              style={{ resize: 'vertical' }}
              value={tempContactNotes}
              onChange={(e) => setTempContactNotes(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                disabled={isSavingNotes}
                onClick={() => handleSaveContactNotes(selectedContactRequest.id)}
                className="vel-btn-outline"
                style={{ fontSize: '0.76rem', padding: '4px 12px' }}
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="vel-modal-foot">
          <div style={{ display: 'flex', gap: '8px' }}>
            {getWhatsAppUrl && getWhatsAppUrl(selectedContactRequest.phone, selectedContactRequest.name, selectedContactRequest.project_type) && (
              <a
                href={getWhatsAppUrl(selectedContactRequest.phone, selectedContactRequest.name, selectedContactRequest.project_type)}
                target="_blank"
                rel="noopener noreferrer"
                className="vel-btn-solid"
                style={{ background: '#25D366', borderColor: '#25D366', color: '#000000', textDecoration: 'none', fontSize: '0.8rem' }}
              >
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            )}
            <a
              href={`mailto:${selectedContactRequest.email}`}
              className="vel-btn-outline"
              style={{ textDecoration: 'none', fontSize: '0.8rem' }}
            >
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </a>
          </div>

          <button
            type="button"
            className="vel-btn-outline"
            onClick={() => setSelectedContactRequest(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
