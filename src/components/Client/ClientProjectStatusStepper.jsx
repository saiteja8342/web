import React from 'react';
import { Check, Clock, Sparkles, AlertCircle, PlayCircle, Film, CheckCircle2, Ban } from 'lucide-react';

const STAGES = [
  {
    key: 'received',
    step: 0,
    label: 'Order Received',
    subtext: 'Brief & Raw Footage Queued',
    icon: Film,
  },
  {
    key: 'accepted',
    step: 1,
    label: 'Accepted',
    subtext: 'Assigned to Lead Editor',
    icon: PlayCircle,
  },
  {
    key: 'in_editing',
    step: 2,
    label: 'In Editing',
    subtext: 'Rough Cut, Sound & VFX',
    icon: Clock,
  },
  {
    key: 'in_review',
    step: 3,
    label: 'Quality Review',
    subtext: 'QA & Revision Polish',
    icon: Sparkles,
  },
  {
    key: 'delivered',
    step: 4,
    label: 'Final Delivered',
    subtext: 'Master 4K Deliverables Ready',
    icon: CheckCircle2,
  },
];

export default function ClientProjectStatusStepper({
  status = 'received',
  cancellationReason = '',
  statusHistory = [],
  orderCreatedAt = null,
  orderUpdatedAt = null,
  getStageDate = null,
  expectedDelivery = null,
}) {
  const isCancelled = status === 'cancelled';

  // Helper to determine step index
  const getStepIndex = (st) => {
    switch (st) {
      case 'received': return 0;
      case 'accepted': return 1;
      case 'in_editing': return 2;
      case 'in_review': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(status);

  // Calculate progress percentage for smooth animated gradient bar (0% to 100%)
  const progressPercent = Math.min(100, Math.max(0, (currentStep / (STAGES.length - 1)) * 100));

  // Helper to resolve stage date
  const resolveStageDate = (stageKey, stepIndex) => {
    if (typeof getStageDate === 'function') {
      const custom = getStageDate(stageKey, stepIndex);
      if (custom && custom !== '—') return custom;
    }

    // Try finding in statusHistory
    if (Array.isArray(statusHistory) && statusHistory.length > 0) {
      const matched = statusHistory.find(h => (h.new_status || '').toLowerCase() === stageKey);
      if (matched && matched.changed_at) {
        try {
          return new Date(matched.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (_) {}
      }
    }

    if (stepIndex === 0 && orderCreatedAt) {
      try {
        return new Date(orderCreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch (_) {}
    }

    if (stepIndex === currentStep && orderUpdatedAt) {
      try {
        return new Date(orderUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch (_) {}
    }

    if (stepIndex > currentStep) {
      return 'Upcoming';
    }

    return 'Completed';
  };

  // If order is cancelled, render high-impact alert banner
  if (isCancelled) {
    return (
      <div className="cp-stepper-cancelled-card">
        <div className="cp-stepper-cancelled-glow" />
        <div className="cp-stepper-cancelled-inner">
          <div className="cp-stepper-cancelled-icon-wrap">
            <Ban className="h-6 w-6 text-red-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="cp-stepper-cancelled-badge">ORDER CANCELLED</span>
              <span className="text-xs text-neutral-400">Production Halted by Studio</span>
            </div>
            <p className="cp-stepper-cancelled-reason">
              <strong>Reason: </strong>
              {cancellationReason || 'No detailed cancellation description provided.'}
            </p>
            <div className="mt-2 text-xs text-neutral-400 flex items-center gap-2">
              <span>If you have questions regarding this cancellation, please contact your Studio Account Director.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-stepper-container">
      {/* Top Header Summary */}
      <div className="cp-stepper-header">
        <div className="flex items-center gap-2">
          <span className="cp-stepper-live-indicator">
            <span className="cp-stepper-live-dot" />
            LIVE PIPELINE
          </span>
          <div className="cp-eq-wrap" title="Production Render Engine Active" style={{ marginLeft: '4px' }}>
            {[10, 18, 8, 22, 14, 20, 12].map((h, i) => (
              <span key={i} className="cp-eq-bar" style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <span className="cp-stepper-stage-title" style={{ marginLeft: '6px' }}>
            Stage {currentStep + 1} of 5: {STAGES[currentStep]?.label}
          </span>
        </div>

        {expectedDelivery && (
          <span className="cp-stepper-eta">
            <Clock className="h-3 w-3 text-[#FCD34D]" />
            <span>Target Delivery: {expectedDelivery}</span>
          </span>
        )}
      </div>

      {/* Modern Animated Stepper Track */}
      <div className="cp-stepper-timeline">
        {/* Background Track Line */}
        <div className="cp-stepper-track-bg" />

        {/* Dynamic Animated Gradient Progress Fill */}
        <div
          className="cp-stepper-track-fill"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Nodes */}
        <div className="cp-stepper-nodes">
          {STAGES.map((st) => {
            const isCompleted = currentStep > st.step;
            const isCurrent = currentStep === st.step;
            const isPending = currentStep < st.step;
            const StageIcon = st.icon;
            const dateStr = resolveStageDate(st.key, st.step);

            return (
              <div
                key={st.key}
                className={`cp-stepper-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
              >
                {/* Node Orb with Pulsing Radar Halo */}
                <div className="cp-stepper-node-orb">
                  {isCurrent && <div className="cp-stepper-node-pulse" />}
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 text-black stroke-[3]" />
                  ) : isCurrent ? (
                    <StageIcon className="h-4 w-4 text-white animate-spin-slow" />
                  ) : (
                    <span className="cp-stepper-node-num">{st.step + 1}</span>
                  )}
                </div>

                {/* Node Label & Subtext */}
                <div className="cp-stepper-node-info">
                  <span className="cp-stepper-node-label">{st.label}</span>
                  <span className="cp-stepper-node-subtext">{st.subtext}</span>
                  <span className="cp-stepper-node-date">{dateStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
