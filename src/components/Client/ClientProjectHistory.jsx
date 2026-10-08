import React from 'react';
import {
  History,
  CheckCircle2,
  Check,
  Star,
  Award,
  Clock,
  Download
} from 'lucide-react';

export default function ClientProjectHistory({
  historyProjects = [],
  selectedProject,
  setSelectedHistoryId,
  ratingsMap = {},
  handleSubmitRating,
  ratingStars,
  setRatingStars,
  hoverStars,
  setHoverStars,
  feedbackText,
  setFeedbackText,
  isTestimonialConsent,
  setIsTestimonialConsent,
  isSubmittingRating,
  safeOpenUrl
}) {
  return (
    <>
      <div className="cp-header-block">
        <h1 className="cp-title-h1">Project History</h1>
      </div>

      {historyProjects.length === 0 ? (
        <div className="cp-card" style={{ padding: '60px 20px', textAlign: 'center', alignItems: 'center', gap: '14px' }}>
          <History className="h-10 w-10 text-white/30" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Delivered Projects Yet</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--cp-text-secondary)', maxWidth: '420px' }}>
            Your completed video deliverables will be archived here with direct download access.
          </p>
        </div>
      ) : (
        <div className="cp-history-split">
          {/* Left: Previous Projects List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Previous Projects ({historyProjects.length})</h3>
            </div>

            {historyProjects.map((proj) => (
              <div
                key={proj.id}
                className={`cp-history-item ${selectedProject?.id === proj.id ? 'selected' : ''}`}
                onClick={() => setSelectedHistoryId(proj.id)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>{proj.title}</span>
                    <span className="cp-badge-pill" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>{proj.type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#60A5FA', fontFamily: 'monospace' }}>
                      {proj.orderCode}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--cp-text-tertiary)' }}>•</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)' }}>
                      Delivered: {proj.deliveredDate}
                    </span>
                  </div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
            ))}
          </div>

          {/* Right: Selected Project Status & Notes */}
          {selectedProject && (
            <div className="cp-card" style={{ gap: '22px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Delivery Status</h3>
                  <span style={{ fontSize: '0.74rem', color: '#93C5FD', fontFamily: 'monospace', fontWeight: 700, background: 'rgba(59, 130, 246, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                    {selectedProject.orderCode}
                  </span>
                </div>

                {/* All 5 Steps Completed */}
                <div className="cp-stepper-wrap" style={{ padding: '0 0 10px' }}>
                  <div className="cp-stepper-line" style={{ top: '10px' }} />
                  {['Received', 'Accepted', 'In Editing', 'In Review', 'Delivered'].map((label, idx) => (
                    <div key={idx} className="cp-step-item">
                      <div className="cp-step-circle done">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span className="cp-step-name" style={{ fontSize: '0.65rem' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 Metadata Boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ background: '#101015', padding: '14px', borderRadius: '8px', border: '1px solid var(--cp-border)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--cp-text-secondary)', display: 'block' }}>Project Type</span>
                  <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{selectedProject.type}</strong>
                </div>

                <div style={{ background: '#101015', padding: '14px', borderRadius: '8px', border: '1px solid var(--cp-border)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--cp-text-secondary)', display: 'block' }}>Project Created</span>
                  <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{selectedProject.submissionDate}</strong>
                </div>

                <div style={{ background: '#101015', padding: '14px', borderRadius: '8px', border: '1px solid var(--cp-border)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--cp-text-secondary)', display: 'block' }}>Delivery Date</span>
                  <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{selectedProject.deliveredDate}</strong>
                </div>

                <div style={{ background: '#101015', padding: '14px', borderRadius: '8px', border: selectedProject.isExpired ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--cp-border)' }}>
                  <span style={{ fontSize: '0.68rem', color: selectedProject.isExpired ? '#EF4444' : 'var(--cp-text-secondary)', display: 'block' }}>Link Validity</span>
                  <strong style={{ fontSize: '0.82rem', color: selectedProject.isExpired ? '#EF4444' : '#4ADE80' }}>
                    {selectedProject.isExpired ? 'Expired (10 days)' : `${selectedProject.daysRemaining} days left`}
                  </strong>
                </div>
              </div>

              {/* Notes Box */}
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px' }}>Project Notes</h4>
                <div style={{ padding: '16px', background: '#101015', borderRadius: '8px', border: '1px solid var(--cp-border)', fontSize: '0.82rem', color: 'var(--cp-text-secondary)', lineHeight: 1.55 }}>
                  {selectedProject.notes}
                </div>
              </div>

              {/* Client Rating & Feedback Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star className="h-4 w-4 text-amber-400" fill="#F59E0B" />
                    <span>Order Rating & Feedback</span>
                  </h4>
                  {ratingsMap[selectedProject.id]?.isTestimonial && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#FCD34D', border: '1px solid rgba(234, 179, 8, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Award className="h-3 w-3" />
                      <span>Featured Testimonial</span>
                    </span>
                  )}
                </div>

                {ratingsMap[selectedProject.id] ? (
                  /* Already Rated Card */
                  <div style={{ padding: '16px 18px', background: '#101015', borderRadius: '8px', border: '1px solid var(--cp-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="h-4 w-4"
                          fill={star <= ratingsMap[selectedProject.id].rating ? '#F59E0B' : 'transparent'}
                          color={star <= ratingsMap[selectedProject.id].rating ? '#F59E0B' : '#4B5563'}
                        />
                      ))}
                      <span style={{ fontSize: '0.78rem', color: '#9CA3AF', marginLeft: '6px', fontWeight: 600 }}>
                        {ratingsMap[selectedProject.id].rating} / 5 Stars
                      </span>
                    </div>

                    {ratingsMap[selectedProject.id].cleanFeedback ? (
                      <p style={{ fontSize: '0.82rem', color: '#E5E7EB', margin: 0, lineHeight: 1.55, fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '6px' }}>
                        "{ratingsMap[selectedProject.id].cleanFeedback}"
                      </p>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: 'var(--cp-text-tertiary)' }}>No written feedback provided.</span>
                    )}
                  </div>
                ) : (
                  /* Unrated Form */
                  <form onSubmit={handleSubmitRating} style={{ padding: '16px', background: '#101015', borderRadius: '8px', border: '1px solid var(--cp-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--cp-text-secondary)', display: 'block', marginBottom: '6px' }}>
                        Rate the final delivery quality:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const activeStar = hoverStars ? star <= hoverStars : star <= ratingStars;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingStars(star)}
                              onMouseEnter={() => setHoverStars(star)}
                              onMouseLeave={() => setHoverStars(0)}
                              style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer' }}
                            >
                              <Star
                                className="h-5 w-5 transition-colors"
                                fill={activeStar ? '#F59E0B' : 'transparent'}
                                color={activeStar ? '#F59E0B' : '#6B7280'}
                              />
                            </button>
                          );
                        })}
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FCD34D', marginLeft: '6px' }}>
                          {ratingStars} / 5
                        </span>
                      </div>
                    </div>

                    <div>
                      <textarea
                        className="cp-input"
                        rows={3}
                        placeholder="Write your review or feedback about the editing quality, pacing, and communication..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        style={{ width: '100%', resize: 'vertical', fontSize: '0.8rem', padding: '10px 12px', background: '#181822', borderRadius: '6px', border: '1px solid var(--cp-border)', color: '#FFFFFF' }}
                      />
                    </div>

                    {/* Testimonial Checkbox: STRICTLY VISIBLE ONLY when rating === 5 AND feedbackText is entered */}
                    {ratingStars === 5 && feedbackText.trim().length > 0 && (
                      <div style={{
                        padding: '12px 14px',
                        background: 'rgba(234, 179, 8, 0.08)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px'
                      }}>
                        <input
                          type="checkbox"
                          id="testimonialConsentCheckbox"
                          checked={isTestimonialConsent}
                          onChange={(e) => setIsTestimonialConsent(e.target.checked)}
                          style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#F59E0B', width: '16px', height: '16px' }}
                        />
                        <label htmlFor="testimonialConsentCheckbox" style={{ fontSize: '0.78rem', color: '#E5E7EB', cursor: 'pointer', lineHeight: 1.45 }}>
                          <strong style={{ color: '#FCD34D', display: 'block' }}>Send review to Studio Admin Team</strong>
                          Allow the MotionNodeEdits admin to review and consider featuring this feedback on the public website.
                        </label>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        disabled={isSubmittingRating}
                        className="cp-btn-solid"
                        style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Star className="h-3.5 w-3.5" fill="#000000" color="#000000" />
                        <span>{isSubmittingRating ? 'Submitting...' : 'Submit Rating & Feedback'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--cp-border)', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selectedProject.isExpired ? (
                    <span style={{ fontSize: '0.74rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                      <Clock className="h-3.5 w-3.5" />
                      <span>Download link expired on {selectedProject.expiryDate} (10-day retention).</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.74rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Link expires on {selectedProject.expiryDate} ({selectedProject.daysRemaining} days remaining)</span>
                    </span>
                  )}
                </div>

                {selectedProject.isExpired ? (
                  <button
                    className="cp-btn-outline"
                    disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Clock className="h-4 w-4" />
                    <span>Link Expired</span>
                  </button>
                ) : selectedProject.downloadLink !== '#' ? (
                  <button
                    className="cp-btn-solid"
                    onClick={() => safeOpenUrl(selectedProject.downloadLink)}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Final Cut</span>
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
