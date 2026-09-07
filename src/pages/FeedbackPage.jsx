import React, { useState } from 'react';
import { Star, CheckCircle2, Send, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { submitLinkFeedback, updateLinkFeedbackConsent } from '../lib/db/linkFeedback';
import './feedback.css';

const PROJECT_TYPE_OPTIONS = [
  'YouTube Long-form',
  'Shorts / Reels / TikTok',
  'Commercial / Brand Ad',
  'AI Video Production',
  'Motion Graphics & 3D',
  'Podcast & Talking Head',
  'Music Video',
  'Other Creative Work',
];

const RATING_SENTIMENTS = {
  0: 'Select your rating',
  1: 'Needs Improvement (1★)',
  2: 'Fair Quality (2★)',
  3: 'Good Quality (3★)',
  4: 'Great Experience (4★)',
  5: 'Exceptional Experience (5★)',
};

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    project_type: 'YouTube Long-form',
    feedback: '',
    improvements: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConsentPrompt, setShowConsentPrompt] = useState(false);
  const [submittedFeedbackId, setSubmittedFeedbackId] = useState(null);
  const [testimonialConsent, setTestimonialConsent] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentDisplayRating = hoverRating || rating;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || rating === 0) {
      setErrorMessage('Please select a star rating (1 to 5 stars).');
      return;
    }

    if (!formData.name.trim()) {
      setErrorMessage('Please provide your name.');
      return;
    }

    if (!formData.feedback.trim()) {
      setErrorMessage('Please share a brief summary of your feedback.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const isHighRating = rating >= 4;
      const initialConsent = isHighRating ? true : false;

      const res = await submitLinkFeedback({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        project_type: formData.project_type,
        rating: rating,
        feedback: formData.feedback,
        improvements: '',
        testimonial_consent: initialConsent,
      });

      setIsSubmitting(false);

      if (res?.data?.id) {
        setSubmittedFeedbackId(res.data.id);
      }

      // Only show consent checkbox step if client gave 4 or 5 stars!
      if (isHighRating) {
        setTestimonialConsent(true);
        setShowConsentPrompt(true);
      } else {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('[FeedbackPage] Error submitting feedback:', err);
      setIsSubmitting(false);
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  const handleTogglePostSubmitConsent = async () => {
    const nextVal = !testimonialConsent;
    setTestimonialConsent(nextVal);
    if (submittedFeedbackId) {
      await updateLinkFeedbackConsent(submittedFeedbackId, nextVal);
    }
  };

  const handleFinishConsent = async () => {
    if (submittedFeedbackId) {
      await updateLinkFeedbackConsent(submittedFeedbackId, testimonialConsent);
    }
    setShowConsentPrompt(false);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setRating(0);
    setHoverRating(0);
    setFormData({
      name: '',
      email: '',
      company: '',
      project_type: 'YouTube Long-form',
      feedback: '',
      improvements: '',
    });
    setTestimonialConsent(true);
    setShowConsentPrompt(false);
    setSubmittedFeedbackId(null);
    setIsSubmitted(false);
    setErrorMessage('');
  };

  const isLowRating = rating > 0 && rating <= 3;
  const feedbackLabel = isLowRating
    ? 'What things do you think we need to improve?'
    : 'Please share your feedback on the video & our services';
  const feedbackPlaceholder = isLowRating
    ? 'Please let us know what went wrong, what didn’t meet your expectations, and how we can improve our editing, delivery, or communication...'
    : 'Share what you loved about the video editing, storytelling, turnaround speed, and working with our team...';

  return (
    <div className="fb-page-wrapper">
      <div className="fb-glow-1" />
      <div className="fb-glow-2" />

      <div className="fb-container">
        {/* Brand Header */}
        <div className="fb-brand-header">
          <div className="fb-brand-badge">
            <span className="fb-brand-dot" />
            <span>MotionNodeEdits Client Portal</span>
          </div>
          <h1 className="fb-title-h1">Client Feedback & Review</h1>
          <p className="fb-subtext">
            Your insights help us elevate production quality, communication speed, and our creative storytelling.
          </p>
        </div>

        {/* Card */}
        <div className="fb-card">
          {showConsentPrompt ? (
            <div className="fb-success-card">
              <div className="fb-success-icon-wrap" style={{ width: '70px', height: '70px' }}>
                <Star className="h-8 w-8 text-white fill-white" />
              </div>
              <h2 className="fb-success-title">Thank You, {formData.name || 'Friend'}!</h2>
              <p className="fb-success-msg">
                We're honored by your {rating}-star rating! Before completing, would you allow us to feature your positive review?
              </p>

              <div
                className="fb-consent-box"
                style={{ width: '100%', textAlign: 'left', marginTop: '6px' }}
                onClick={handleTogglePostSubmitConsent}
              >
                <div className={`fb-checkbox-custom ${testimonialConsent ? 'checked' : ''}`}>
                  {testimonialConsent && <Check className="h-3 w-3 text-black stroke-[3]" />}
                </div>
                <div className="fb-consent-text-wrap">
                  <span className="fb-consent-title" style={{ fontWeight: 500, fontSize: '0.85rem', lineHeight: '1.45', color: '#E4E4E7' }}>
                    I’m happy for my review to be featured as a testimonial on your website.
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="fb-submit-btn"
                onClick={handleFinishConsent}
                style={{ marginTop: '14px' }}
              >
                <span>Confirm & Finish</span>
                <ArrowRight className="h-4 w-4 text-black" />
              </button>
            </div>
          ) : isSubmitted ? (
            <div className="fb-success-card">
              <div className="fb-success-icon-wrap">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="fb-success-title">Thank You, {formData.name || 'Friend'}!</h2>
              <p className="fb-success-msg">
                Your feedback has been received and delivered directly to the MotionNodeEdits production team. We truly appreciate you taking the time to share your perspective!
              </p>
              <div className="fb-success-btn-row">
                <button type="button" className="fb-btn-outline" onClick={handleReset}>
                  Submit Another Response
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Star Rating Block */}
              <div className="fb-rating-block">
                <span className="fb-rating-label">Overall Rating</span>
                <div className="fb-stars-row">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= currentDisplayRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        className="fb-star-btn"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        aria-label={`Rate ${star} star`}
                      >
                        <Star
                          className="h-8 w-8 transition-all duration-150"
                          style={{
                            fill: isFilled ? '#E2E8F0' : 'transparent',
                            color: isFilled ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
                            filter: isFilled ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.65))' : 'none',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="fb-sentiment-tag">
                  {RATING_SENTIMENTS[currentDisplayRating]}
                </span>
              </div>

              {/* Client Info Grid */}
              <div className="fb-form-grid">
                <div className="fb-field-group">
                  <label className="fb-field-label">
                    Your Name <span className="fb-req-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Alex Morgan"
                    className="fb-input"
                    required
                  />
                </div>

                <div className="fb-field-group">
                  <label className="fb-field-label">
                    Company / Channel / Brand <span className="fb-opt-badge">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="e.g. Apex Media / @alexvlogs"
                    className="fb-input"
                  />
                </div>
              </div>

              <div className="fb-form-grid">
                <div className="fb-field-group">
                  <label className="fb-field-label">
                    Email Address <span className="fb-opt-badge">(Optional, for follow-up)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="alex@company.com"
                    className="fb-input"
                  />
                </div>

                <div className="fb-field-group">
                  <label className="fb-field-label">
                    Project / Video Type <span className="fb-opt-badge">(Optional)</span>
                  </label>
                  <select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleChange}
                    className="fb-select"
                  >
                    {PROJECT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} style={{ background: '#0A0A0E', color: '#FFFFFF' }}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Feedback Textarea with Dynamic Rating Prompt */}
              <div className="fb-field-group">
                <label className="fb-field-label">
                  {feedbackLabel} <span className="fb-req-star">*</span>
                </label>
                <textarea
                  name="feedback"
                  value={formData.feedback}
                  onChange={handleChange}
                  placeholder={feedbackPlaceholder}
                  className="fb-textarea"
                  rows={4}
                  required
                />
              </div>


              {errorMessage && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#F4F4F5',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}>
                  {errorMessage}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="fb-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Submitting Feedback...</>
                ) : (
                  <>
                    <span>Submit Feedback</span>
                    <Send className="h-4 w-4 text-black" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Private Page Notice */}
        <div className="fb-footer-note">
          <span>Private Client Link • Submissions reviewed exclusively by MotionNodeEdits management.</span>
        </div>
      </div>
    </div>
  );
}
