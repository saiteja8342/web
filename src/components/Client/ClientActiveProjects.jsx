import React from 'react';
import { 
  Film, 
  ArrowRight, 
  Clock, 
  ExternalLink, 
  Calendar, 
  StickyNote, 
  User, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import GoogleDriveVideoPlayer from '../GoogleDriveVideoPlayer';
import TimestampedRevisionComposer, { RevisionNoteBadge } from '../TimestampedRevisionComposer';

export default function ClientActiveProjects({
  runningOrders = [],
  activeOrder,
  setSelectedActiveOrderId,
  isDeliverablePermitted,
  activeOrderExp,
  editorNotes = [],
  onSendRevisionNote,
  isSubmittingNote = false,
  safeOpenUrl,
  getExpectedDeliveryDate,
  STATUS_MAP,
  formatOrderCode
}) {
  if (!activeOrder && runningOrders.length === 0) {
    return (
      <div className="cp-empty-state">
        <Film className="h-12 w-12 text-white/30" />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginTop: '14px' }}>
          No Projects Currently in Production
        </h3>
        <p style={{ color: 'var(--cp-text-secondary)', fontSize: '0.88rem', maxWidth: '420px', margin: '8px auto 0' }}>
          When our studio team initializes your video project, its milestone stages, editor notes, and live video previews will display here.
        </p>
      </div>
    );
  }

  const sm = activeOrder ? (STATUS_MAP[activeOrder.status] || STATUS_MAP.received) : STATUS_MAP.received;
  const ordCode = activeOrder ? formatOrderCode(activeOrder) : '';

  return (
    <div className="flex flex-col gap-6">
      {/* MULTIPLE ACTIVE ORDERS SELECTOR STRIP */}
      {runningOrders.length > 1 && (
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(180deg, rgba(22, 22, 28, 0.9) 0%, rgba(15, 15, 20, 0.98) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film className="h-4 w-4 text-blue-400" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FFFFFF' }}>
                Your Active Projects in Production ({runningOrders.length})
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--cp-text-secondary)' }}>
              Click a project below to switch its milestone view & files
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px'
          }}>
            {runningOrders.map((ord) => {
              const isSelected = ord.id === activeOrder?.id;
              const itemSm = STATUS_MAP[ord.status] || STATUS_MAP.received;
              const itemCode = formatOrderCode(ord);

              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedActiveOrderId(ord.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1.5px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.07)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: isSelected ? '0 0 16px rgba(59, 130, 246, 0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isSelected ? '#60A5FA' : 'var(--cp-text-tertiary)', fontFamily: 'monospace' }}>
                      {itemCode}
                    </span>
                    <span className={`cp-badge ${itemSm.badgeClass}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                      {itemSm.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ord.order_name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PROJECT HEADER CARD */}
      {activeOrder && (
        <div className="cp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className={`cp-badge ${sm.badgeClass}`}>{sm.label}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--cp-text-tertiary)', fontFamily: 'monospace' }}>
                  {ordCode}
                </span>
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                {activeOrder.order_name}
              </h2>
              {activeOrder.brief && (
                <p style={{ color: 'var(--cp-text-secondary)', fontSize: '0.82rem', marginTop: '6px', maxWidth: '650px', lineHeight: 1.5 }}>
                  {activeOrder.brief}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--cp-text-tertiary)' }}>Estimated Delivery</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FCD34D' }}>
                {getExpectedDeliveryDate(activeOrder)}
              </span>
            </div>
          </div>

          {/* STAGE PIPELINE */}
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cp-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Milestone Progress
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#60A5FA' }}>
                Step {sm.step} of 6: {sm.label}
              </span>
            </div>
            <div className="cp-stepper">
              {['Received', 'Accepted', 'Editing in Process', 'Review', 'Revision', 'Delivered'].map((stepLabel, idx) => {
                const stepNum = idx + 1;
                const isCompleted = sm.step > stepNum;
                const isCurrent = sm.step === stepNum;
                return (
                  <div key={stepLabel} className={`cp-step ${isCompleted ? 'completed' : isCurrent ? 'current' : ''}`}>
                    <div className="cp-step-circle">{stepNum}</div>
                    <span className="cp-step-label">{stepLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EMBEDDED GOOGLE DRIVE VIDEO PREVIEW (IF AVAILABLE) */}
      {activeOrder && (isDeliverablePermitted && activeOrder.additional_link) && !activeOrderExp?.isExpired && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Film className="h-4 w-4 text-cyan-400" />
              <span>In-Portal Deliverable Video Preview</span>
            </h3>
            <span className="text-xs text-neutral-400">
              Watch below and add timestamped revision notes
            </span>
          </div>
          <GoogleDriveVideoPlayer
            videoUrl={activeOrder.additional_link}
            title={activeOrder.order_name || 'Master Deliverable Cut'}
            aspectRatio="16/9"
          />
        </div>
      )}

      {/* 2-COLUMN SPLIT: PROJECT ASSETS & REVISION NOTES */}
      {activeOrder && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* LEFT: SOURCE ASSETS & DELIVERABLES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeOrder.drive_link && (
              <div className="cp-link-card" onClick={() => safeOpenUrl(activeOrder.drive_link)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#181822', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Film className="h-4 w-4 text-white/80" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Raw Footage Source</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)' }}>Google Drive Cloud Assets</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40" />
              </div>
            )}

            {isDeliverablePermitted && activeOrder.additional_link ? (
              activeOrderExp?.isExpired ? (
                <div style={{ padding: '16px 18px', background: '#111118', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>Deliverable Link Expired</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)', marginTop: '2px' }}>
                        This link expired after 10 days of delivery ({activeOrderExp.expiryDate}).
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600 }}>
                    EXPIRED
                  </span>
                </div>
              ) : (
                <div className="cp-link-card" onClick={() => safeOpenUrl(activeOrder.additional_link)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#181822', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ExternalLink className="h-4 w-4 text-white/80" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Final Master Export</div>
                      <div style={{ fontSize: '0.74rem', color: '#4ADE80' }}>
                        Delivered • {activeOrderExp?.daysRemaining} days remaining (Expires {activeOrderExp?.expiryDate})
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/40" />
                </div>
              )
            ) : activeOrder.additional_link ? (
              <div style={{ padding: '14px 16px', background: '#111118', borderRadius: '10px', border: '1px dashed rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>Deliverable in Production Review</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)', marginTop: '2px' }}>
                      Your access link will be available after final quality check
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 600 }}>
                  ADMIN REVIEW
                </span>
              </div>
            ) : (
              <div style={{ padding: '14px 16px', background: '#111118', borderRadius: '10px', border: '1px dashed var(--cp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#181824', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>Final Deliverable</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)', marginTop: '2px' }}>
                      Expected Delivery: <strong style={{ color: '#FCD34D' }}>{getExpectedDeliveryDate(activeOrder)}</strong>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 600 }}>
                  IN PROGRESS
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: REVISIONS & TIMESTAMPED PROJECT NOTES */}
          <div className="cp-card" style={{ gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StickyNote className="h-4 w-4 text-cyan-400" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>Revisions & Project Notes</h3>
              </div>
              <span className="text-[11px] text-neutral-400">
                Frame.io style timeline notes
              </span>
            </div>

            {/* NOTES FEED WITH TIMESTAMP BADGE RENDERER */}
            <div className="cp-notes-feed" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {editorNotes.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--cp-text-secondary)', fontSize: '0.8rem' }}>
                  No revision notes yet. Use the form below to request a change with exact timestamp.
                </div>
              ) : (
                editorNotes.map((noteItem) => (
                  <div key={noteItem.id} className={`cp-note-bubble ${noteItem.highlight ? 'highlight' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.06em' }}>
                        {noteItem.badge}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--cp-text-tertiary)' }}>
                        {noteItem.time}
                      </span>
                    </div>
                    {/* Render badge if timestamp is present */}
                    <RevisionNoteBadge noteText={noteItem.text} />
                  </div>
                ))
              )}
            </div>

            {/* TIMESTAMPED REVISION COMPOSER */}
            <div className="mt-2 pt-2 border-t border-white/5">
              <TimestampedRevisionComposer
                onSubmitNote={onSendRevisionNote}
                isSubmitting={isSubmittingNote}
                placeholder="Describe changes or tag video time (e.g. 01:24 cut background music)..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
