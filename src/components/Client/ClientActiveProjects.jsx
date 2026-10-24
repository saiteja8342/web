import React, { useState, useMemo } from 'react';
import { 
  Film, 
  ArrowRight, 
  ArrowLeft,
  Clock, 
  ExternalLink, 
  Calendar, 
  StickyNote, 
  Sparkles,
  Download,
  MoreVertical,
  Play,
  Send,
  Check,
  Lock,
  X,
  MessageSquare,
  ArrowUpRight,
  Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GoogleDriveVideoPlayer from '../GoogleDriveVideoPlayer';
import TimestampedRevisionComposer, { RevisionNoteBadge } from '../TimestampedRevisionComposer';
import ClientProjectStatusStepper from './ClientProjectStatusStepper';

const getOrderThumbnail = (order) => {
  if (!order) return 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80';
  if (order.thumbnail_url) return order.thumbnail_url;
  if (order.cover_image) return order.cover_image;

  const links = [order.drive_link, order.dropbox_link, order.additional_link].filter(Boolean).join(' ');
  const match = links.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }

  const type = (order.video_type || '').toLowerCase();
  if (type.includes('ad') || type.includes('commercial')) {
    return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80';
  }
  if (type.includes('reel') || type.includes('short')) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
  }
  if (type.includes('youtube')) {
    return 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80';
};

const formatStepDateTime = (dateVal) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${day}, ${time}`;
};

const formatDueDate = (dateStr) => {
  if (!dateStr) return 'Flexible Timeline';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Flexible';
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

const isUnderReviewOrAbove = (status) => {
  const s = String(status || '').toLowerCase().trim();
  return (
    s.includes('review') ||
    s.includes('revision') ||
    s.includes('delivered') ||
    s.includes('completed')
  );
};

const getMilestoneState = (status) => {
  const s = String(status || '').toLowerCase().trim();
  if (s.includes('cancelled') || s.includes('rejected')) {
    return {
      activeStageIdx: -1,
      pct: 0,
      label: 'Cancelled',
      pillBg: '#EF4444',
      pillColor: '#FFFFFF',
      isCancelled: true,
    };
  }
  if (s.includes('delivered') || s.includes('completed')) {
    return {
      activeStageIdx: 3,
      pct: 100,
      label: 'Completed',
      pillBg: '#4ADE80',
      pillColor: '#050507',
    };
  }
  if (s.includes('review') || s.includes('revision')) {
    return {
      activeStageIdx: 2,
      pct: 85,
      label: 'Ready for Review',
      pillBg: '#4ADE80',
      pillColor: '#050507',
    };
  }
  if (s.includes('editing') || s.includes('progress') || s.includes('accepted')) {
    return {
      activeStageIdx: 1,
      pct: 66,
      label: 'In Progress',
      pillBg: '#38BDF8',
      pillColor: '#050507',
    };
  }
  return {
    activeStageIdx: 0,
    pct: 25,
    label: 'Planning',
    pillBg: '#F59E0B',
    pillColor: '#050507',
  };
};

export default function ClientActiveProjects({
  runningOrders = [],
  activeOrder,
  setSelectedActiveOrderId,
  isDeliverablePermitted,
  activeOrderExp,
  editorNotes = [],
  statusHistory = [],
  getStageDate = null,
  onSendRevisionNote,
  isSubmittingNote = false,
  safeOpenUrl,
  getExpectedDeliveryDate,
  STATUS_MAP,
  formatOrderCode,
  handleNavClick,
  showToast,
}) {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const currentOrder = activeOrder || runningOrders[0];

  if (!currentOrder && runningOrders.length === 0) {
    return (
      <>
        {/* Mobile View Empty State */}
        <div className="cp-active-mobile">
          <div className="cp-mob-detail-topbar">
            <button
              type="button"
              className="cp-mob-detail-icon-btn"
              onClick={() => handleNavClick?.('home')}
              aria-label="Back to dashboard overview"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>Current Projects</span>
            <div style={{ width: '36px' }} />
          </div>

          <div className="cp-empty-state-card" style={{ padding: '48px 20px', marginTop: '12px' }}>
            <div className="cp-empty-state-icon">
              <Film className="h-7 w-7 text-white/60" />
            </div>
            <h2 className="cp-empty-state-title">
              No Projects in Production
            </h2>
            <p className="cp-empty-state-desc">
              When our studio team initializes your video project, its milestone stages, editor notes, and live video previews will sync here automatically.
            </p>
            <div className="cp-empty-state-actions" style={{ width: '100%', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => handleNavClick?.('home')}
                className="cp-mob-chat-team-btn"
                style={{ height: '46px', fontSize: '0.88rem' }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Overview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop View Empty State */}
        <div className="cp-active-desktop">
          <div className="cp-header-block">
            <h1 className="cp-title-h1">Current Projects</h1>
            <p className="cp-subtext">Real-time production pipeline and active deliverables.</p>
          </div>

          <div className="cp-empty-state-card">
            <div className="cp-empty-state-icon">
              <Film className="h-7 w-7 text-white/60" />
            </div>
            <h2 className="cp-empty-state-title">
              No Projects Currently in Production
            </h2>
            <p className="cp-empty-state-desc">
              When our studio team initializes your video project, its milestone stages, editor notes, and live video previews will sync here automatically.
            </p>
            <div className="cp-empty-state-actions">
              <button
                type="button"
                onClick={() => handleNavClick?.('home')}
                className="cp-mob-start-btn"
                style={{ margin: 0, padding: '10px 20px', fontSize: '0.84rem' }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Overview</span>
              </button>
              <a
                href="https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I'd%20like%20to%20discuss%20a%20video%20project."
                target="_blank"
                rel="noopener noreferrer"
                className="cp-mob-start-btn"
                style={{ margin: 0, padding: '10px 20px', fontSize: '0.84rem', background: '#111217', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.2)' }}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat with Team</span>
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  const sm = currentOrder ? (STATUS_MAP[currentOrder.status] || STATUS_MAP.received) : STATUS_MAP.received;
  const ordCode = currentOrder ? formatOrderCode(currentOrder) : '';
  const isReviewOrAbove = isUnderReviewOrAbove(currentOrder?.status);
  const deliverableVideoUrl = currentOrder?.additional_link || currentOrder?.dropbox_link || currentOrder?.drive_link;
  const thumbUrl = getOrderThumbnail(currentOrder);
  const milestoneInfo = getMilestoneState(currentOrder?.status);
  const dueDateText = formatDueDate(currentOrder?.client_deadline || currentOrder?.updated_at);

  const step1Date = formatStepDateTime(currentOrder?.created_at);
  const step2Date = (() => {
    if (milestoneInfo.activeStageIdx >= 1) {
      const entry = (statusHistory || []).find((h) => {
        const s = (h.new_status || '').toLowerCase();
        return s.includes('editing') || s.includes('progress') || s.includes('accepted');
      });
      return formatStepDateTime(entry?.changed_at || currentOrder?.updated_at || currentOrder?.created_at);
    }
    return null;
  })();

  const step3Date = (() => {
    if (milestoneInfo.activeStageIdx >= 2) {
      const entry = (statusHistory || []).find((h) => {
        const s = (h.new_status || '').toLowerCase();
        return s.includes('review') || s.includes('revision');
      });
      return formatStepDateTime(entry?.changed_at || currentOrder?.updated_at);
    }
    return null;
  })();

  const step4Date = (() => {
    if (milestoneInfo.activeStageIdx >= 3) {
      const entry = (statusHistory || []).find((h) => {
        const s = (h.new_status || '').toLowerCase();
        return s.includes('delivered') || s.includes('completed');
      });
      return formatStepDateTime(entry?.changed_at || currentOrder?.updated_at);
    }
    return null;
  })();

  const isOrderCancelled = currentOrder?.status === 'cancelled' || milestoneInfo.isCancelled;

  const steps = [
    {
      title: 'Order Confirmed',
      time: step1Date,
      isCompleted: !isOrderCancelled && milestoneInfo.activeStageIdx >= 0,
      isActive: !isOrderCancelled && milestoneInfo.activeStageIdx === 0,
    },
    {
      title: 'Editing in Progress',
      time: step2Date,
      isCompleted: !isOrderCancelled && milestoneInfo.activeStageIdx >= 1,
      isActive: !isOrderCancelled && milestoneInfo.activeStageIdx === 1,
    },
    {
      title: 'Ready for Review',
      time: step3Date,
      isCompleted: !isOrderCancelled && milestoneInfo.activeStageIdx >= 2,
      isActive: !isOrderCancelled && milestoneInfo.activeStageIdx === 2,
    },
    {
      title: 'Completed',
      time: step4Date,
      isCompleted: !isOrderCancelled && milestoneInfo.activeStageIdx >= 3,
      isActive: !isOrderCancelled && milestoneInfo.activeStageIdx === 3,
    },
  ];

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* MOBILE APP VIEW (Screens <= 768px): Reference Image 2 Match   */}
      {/* ------------------------------------------------------------- */}
      <div className="cp-active-mobile">
        {/* Top App Bar: Back Arrow on Left, 3 Dots on Right */}
        <div className="cp-mob-detail-topbar">
          <button
            type="button"
            className="cp-mob-detail-icon-btn"
            onClick={() => handleNavClick?.('home')}
            aria-label="Back to overview"
          >
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>

          <button
            type="button"
            className="cp-mob-detail-icon-btn"
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            aria-label="Project options"
          >
            <MoreVertical className="h-6 w-6 text-white" />
          </button>

          {showOptionsMenu && (
            <div className="cp-mob-options-dropdown">
              {isReviewOrAbove && deliverableVideoUrl && (
                <button
                  type="button"
                  className="cp-mob-dropdown-item"
                  onClick={() => {
                    safeOpenUrl?.(deliverableVideoUrl);
                    setShowOptionsMenu(false);
                  }}
                >
                  <ExternalLink className="h-4 w-4 text-emerald-400" />
                  <span>Open in Google Drive</span>
                </button>
              )}

              {currentOrder?.drive_link && (
                <button
                  type="button"
                  className="cp-mob-dropdown-item"
                  onClick={() => {
                    safeOpenUrl?.(currentOrder.drive_link);
                    setShowOptionsMenu(false);
                  }}
                >
                  <Film className="h-4 w-4 text-cyan-400" />
                  <span>Raw Footage Folder</span>
                </button>
              )}

              <button
                type="button"
                className="cp-mob-dropdown-item"
                onClick={() => {
                  if (ordCode && navigator.clipboard) {
                    navigator.clipboard.writeText(ordCode);
                    showToast?.(`Copied ${ordCode} to clipboard!`);
                  }
                  setShowOptionsMenu(false);
                }}
              >
                <Check className="h-4 w-4 text-slate-400" />
                <span>Copy Project Code</span>
              </button>

              {runningOrders.length > 1 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0', paddingTop: '4px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Switch Project ({runningOrders.length})
                  </div>
                  {runningOrders.map((ro) => (
                    <button
                      key={ro.id}
                      type="button"
                      className="cp-mob-dropdown-item"
                      style={{ fontWeight: ro.id === currentOrder?.id ? 700 : 400 }}
                      onClick={() => {
                        setSelectedActiveOrderId?.(ro.id);
                        setIsPlayingVideo(false);
                        setShowOptionsMenu(false);
                      }}
                    >
                      <Film className="h-3.5 w-3.5 text-white/60" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ro.order_name || 'Project'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video / Media Card */}
        <div className="cp-mob-detail-media-card">
          {isPlayingVideo && isReviewOrAbove && deliverableVideoUrl ? (
            <div className="cp-mob-inline-player-wrap">
              <button
                type="button"
                className="cp-mob-inline-close-btn"
                onClick={() => setIsPlayingVideo(false)}
                aria-label="Close video player"
              >
                <X className="h-4 w-4" />
              </button>
              <GoogleDriveVideoPlayer
                videoUrl={deliverableVideoUrl}
                title={currentOrder?.order_name || 'Project Video Preview'}
                aspectRatio="16/9"
                showControlsBar={false}
              />
            </div>
          ) : (
            <>
              <img
                src={thumbUrl}
                alt={currentOrder?.order_name || 'Project thumbnail'}
                className="cp-mob-media-thumb"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <div
                className="cp-mob-media-overlay"
                onClick={() => {
                  if (isReviewOrAbove && deliverableVideoUrl) {
                    setIsPlayingVideo(true);
                  } else if (isReviewOrAbove && !deliverableVideoUrl) {
                    showToast?.('Deliverable video cut is syncing to Drive. Check back shortly!');
                  } else {
                    showToast?.('Video is currently being edited. In-portal Drive preview will unlock once the project reaches the Review stage.');
                  }
                }}
              >
                <button
                  type="button"
                  className="cp-mob-media-play-btn"
                  aria-label={isReviewOrAbove ? 'Play video review preview' : 'Video preview locked'}
                >
                  <Play className="h-6 w-6 ml-1 fill-white text-white" />
                </button>

                {!isReviewOrAbove && (
                  <div className="cp-mob-media-locked-badge">
                    <Lock className="h-3 w-3" />
                    <span>Preview unlocks at Review</span>
                  </div>
                )}

                <button
                  type="button"
                  className="cp-mob-media-corner-btn"
                  aria-label="Open video file"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isReviewOrAbove && deliverableVideoUrl) {
                      safeOpenUrl?.(deliverableVideoUrl);
                    } else if (currentOrder?.drive_link) {
                      safeOpenUrl?.(currentOrder.drive_link);
                    } else {
                      showToast?.('Drive link preview will be available once the edit reaches Review stage.');
                    }
                  }}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Project Title */}
        <h1 className="cp-mob-detail-title">
          {currentOrder?.order_name || currentOrder?.title || 'Video Production'}
        </h1>

        {/* Due Date & Status Pill Row */}
        <div className="cp-mob-detail-meta-row">
          <div className="cp-mob-detail-due">
            {isOrderCancelled ? 'Status: Cancelled' : `Due: ${dueDateText}`}
          </div>

          <span
            className="cp-mob-detail-status-pill"
            style={{
              background: milestoneInfo.pillBg,
              color: milestoneInfo.pillColor,
            }}
          >
            {milestoneInfo.label}
          </span>
        </div>

        {/* Cancelled Alert Banner for Mobile View */}
        {isOrderCancelled ? (
          <div className="cp-stepper-cancelled-card" style={{ marginTop: '16px', marginBottom: '20px' }}>
            <div className="cp-stepper-cancelled-glow" />
            <div className="cp-stepper-cancelled-inner">
              <div className="cp-stepper-cancelled-icon-wrap">
                <Ban className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="cp-stepper-cancelled-badge">ORDER CANCELLED</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '4px' }}>
                  Production Halted by Studio
                </div>
                <p className="cp-stepper-cancelled-reason">
                  <strong>Reason: </strong>
                  {currentOrder?.cancellation_reason || 'No cancellation description provided.'}
                </p>
                <div style={{ marginTop: '10px', fontSize: '0.74rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  If you have questions regarding this cancellation, tap below to contact your Studio Account Director.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Bar Row */}
            <div className="cp-mob-detail-progress-row">
              <div className="cp-mob-detail-progress-track">
                <div
                  className="cp-mob-detail-progress-fill"
                  style={{
                    width: `${milestoneInfo.pct}%`,
                    background: milestoneInfo.pillBg,
                  }}
                />
              </div>
              <span className="cp-mob-detail-progress-pct">{milestoneInfo.pct}%</span>
            </div>

            {/* Vertical Timeline Stepper (4 Steps Matching Reference Image) */}
            <div className="cp-mob-timeline">
              {steps.map((step, idx) => (
                <div key={idx} className="cp-mob-timeline-item">
                  <div className="cp-mob-timeline-node-col">
                    <div className={`cp-mob-timeline-node ${step.isCompleted ? 'completed' : 'pending'}`}>
                      {step.isCompleted ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : (
                        <span className="cp-mob-timeline-dot" />
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`cp-mob-timeline-line ${idx < milestoneInfo.activeStageIdx ? 'active' : 'inactive'}`} />
                    )}
                  </div>

                  <div className="cp-mob-timeline-content">
                    <h3 className={`cp-mob-timeline-title ${step.isCompleted || step.isActive ? 'active' : 'pending'}`}>
                      {step.title}
                    </h3>
                    {step.time && (
                      <div className="cp-mob-timeline-time">{step.time}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Bottom Button: Chat with Team */}
        <button
          type="button"
          className="cp-mob-chat-team-btn"
          onClick={() => {
            const orderName = currentOrder?.order_name || currentOrder?.title || 'Video Project';
            const code = ordCode ? ` (${ordCode})` : '';
            const text = `Hi MotionNodeEdits, I'm checking in regarding my project: ${orderName}${code}.`;
            safeOpenUrl?.(`https://wa.me/918985351756?text=${encodeURIComponent(text)}`);
          }}
        >
          <MessageSquare className="h-5 w-5" />
          <span>Chat with Team</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DESKTOP VIEW (Screens > 768px): Original Full Layout          */}
      {/* ------------------------------------------------------------- */}
      <div className="cp-active-desktop">
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
                <Film className="h-4 w-4 text-white" />
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
                const isSelected = ord.id === currentOrder?.id;
                const isItemCancelled = ord.status === 'cancelled';
                const itemSm = STATUS_MAP[ord.status] || STATUS_MAP.received;
                const itemCode = formatOrderCode(ord);

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedActiveOrderId?.(ord.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: isSelected 
                        ? (isItemCancelled ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.08)') 
                        : (isItemCancelled ? 'rgba(239, 68, 68, 0.04)' : 'rgba(255, 255, 255, 0.03)'),
                      border: isSelected 
                        ? (isItemCancelled ? '1.5px solid #EF4444' : '1.5px solid #FFFFFF') 
                        : (isItemCancelled ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(255, 255, 255, 0.07)'),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      boxShadow: isSelected 
                        ? (isItemCancelled ? '0 0 16px rgba(239, 68, 68, 0.25)' : '0 0 16px rgba(255, 255, 255, 0.15)') 
                        : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isSelected ? '#FFFFFF' : 'var(--cp-text-tertiary)', fontFamily: 'monospace' }}>
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
        {currentOrder && (
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
                  {currentOrder.order_name}
                </h2>
                {currentOrder.brief && (
                  <p style={{ color: 'var(--cp-text-secondary)', fontSize: '0.82rem', marginTop: '6px', maxWidth: '650px', lineHeight: 1.5 }}>
                    {currentOrder.brief}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--cp-text-tertiary)' }}>Estimated Delivery</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FCD34D' }}>
                  {getExpectedDeliveryDate ? getExpectedDeliveryDate(currentOrder) : dueDateText}
                </span>
              </div>
            </div>

            {/* ANIMATED STAGE PIPELINE */}
            <div style={{ marginTop: '20px' }}>
              <ClientProjectStatusStepper
                status={currentOrder.status}
                cancellationReason={currentOrder.cancellation_reason}
                statusHistory={statusHistory}
                orderCreatedAt={currentOrder.created_at}
                orderUpdatedAt={currentOrder.updated_at}
                getStageDate={getStageDate}
                expectedDelivery={getExpectedDeliveryDate ? getExpectedDeliveryDate(currentOrder) : dueDateText}
              />
            </div>
          </div>
        )}

        {/* EMBEDDED GOOGLE DRIVE VIDEO PREVIEW (IF PERMITTED & AVAILABLE) */}
        {currentOrder && deliverableVideoUrl && isDeliverablePermitted && !activeOrderExp?.isExpired && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Film className="h-4 w-4 text-cyan-400" />
                <span>In-Portal Deliverable Video Preview</span>
              </h3>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Approved by Studio • Watch & review below</span>
              </span>
            </div>
            <GoogleDriveVideoPlayer
              videoUrl={deliverableVideoUrl}
              title={currentOrder.order_name || 'Master Deliverable Cut'}
              aspectRatio="16/9"
            />
          </div>
        )}

        {/* DELIVERABLE UNDER QA REVIEW (WHEN VIDEO EXISTS BUT CLIENT ACCESS NOT YET GRANTED) */}
        {currentOrder && deliverableVideoUrl && !isDeliverablePermitted && currentOrder.status !== 'cancelled' && (
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(180deg, rgba(20, 20, 26, 0.9) 0%, rgba(12, 12, 18, 0.98) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>Deliverable Cut Under Studio QA</div>
                <div style={{ fontSize: '0.74rem', color: '#8E8F94', marginTop: '2px' }}>
                  Our editing directors are conducting the final quality inspection. In-portal preview unlocks as soon as approved!
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.08)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)', whiteSpace: 'nowrap' }}>
              QA Review In Progress
            </span>
          </div>
        )}

        {/* 2-COLUMN SPLIT: PROJECT ASSETS & REVISION NOTES */}
        {currentOrder && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* LEFT: SOURCE ASSETS & DELIVERABLES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {currentOrder.drive_link && (
                <div className="cp-link-card" onClick={() => safeOpenUrl?.(currentOrder.drive_link)}>
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

              {deliverableVideoUrl ? (
                isDeliverablePermitted ? (
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
                    <div className="cp-link-card" onClick={() => safeOpenUrl?.(deliverableVideoUrl)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#181822', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Download className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Final Master Export</div>
                          <div style={{ fontSize: '0.74rem', color: '#4ADE80' }}>
                            Approved by Studio • Ready to download ({activeOrderExp?.daysRemaining} days remaining)
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-emerald-400" />
                    </div>
                  )
                ) : (
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
                )
              ) : (
                <div style={{ padding: '14px 16px', background: '#111118', borderRadius: '10px', border: '1px dashed var(--cp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#181824', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>Final Deliverable</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--cp-text-secondary)', marginTop: '2px' }}>
                        Expected Delivery: <strong style={{ color: '#FCD34D' }}>{getExpectedDeliveryDate ? getExpectedDeliveryDate(currentOrder) : dueDateText}</strong>
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
                      <RevisionNoteBadge noteText={noteItem.text} />
                    </div>
                  ))
                )}
              </div>

              {/* TIMESTAMPED REVISION COMPOSER */}
              {isOrderCancelled ? (
                <div style={{ marginTop: '10px', padding: '14px 16px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#F87171', fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.4 }}>
                  This project has been cancelled. Revisions and timeline changes are closed.
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <TimestampedRevisionComposer
                    onSubmitNote={onSendRevisionNote}
                    isSubmitting={isSubmittingNote}
                    placeholder="Describe changes or tag video time (e.g. 01:24 cut background music)..."
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
