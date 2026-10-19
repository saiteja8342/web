import {
  STATUS_MAP,
  VIDEO_TYPE_MAP,
  formatOrderCode,
  parseCancellationReason,
  stripOrderCodeTag,
  stripCancellationTag
} from '../../lib/db/orders';
import { PROJECT_TYPE_LABELS } from '../../lib/db/contactRequests';

// ─── Pure Utility & Helper Functions for Admin Portal ─────────────────

export function safeHref(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '#';
}

export function safeIsoDate(val) {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'No deadline' || trimmed === '—') return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function stripVisibilityTag(notes) {
  if (!notes || typeof notes !== 'string') return '';
  return notes.replace(/\[CLIENT_DELIVERABLE_VISIBLE:(true|false)\]/g, '').trim();
}

export function parseEditorRequirements(notes) {
  if (!notes || typeof notes !== 'string') return '';
  const match = notes.match(/\[EDITOR_REQUIREMENTS:([^\]]*)\]/);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return '';
}

export function parseCustomSection(notes) {
  if (!notes || typeof notes !== 'string') return { hasCustomSection: false, title: '', content: '' };
  const titleMatch = notes.match(/\[CUSTOM_SECTION_TITLE:([^\]]*)\]/);
  const contentMatch = notes.match(/\[CUSTOM_SECTION_CONTENT:([^\]]*)\]/);

  let title = '';
  let content = '';
  if (titleMatch && titleMatch[1]) {
    try {
      title = decodeURIComponent(titleMatch[1]);
    } catch {
      title = titleMatch[1];
    }
  }
  if (contentMatch && contentMatch[1]) {
    try {
      content = decodeURIComponent(contentMatch[1]);
    } catch {
      content = contentMatch[1];
    }
  }

  const hasCustomSection = Boolean(title || content || titleMatch || contentMatch);
  return { hasCustomSection, title, content };
}

export function stripCustomTags(notes) {
  if (!notes || typeof notes !== 'string') return '';
  return notes
    .replace(/\s*\[EDITOR_REQUIREMENTS:[^\]]*\]/g, '')
    .replace(/\s*\[CUSTOM_SECTION_TITLE:[^\]]*\]/g, '')
    .replace(/\s*\[CUSTOM_SECTION_CONTENT:[^\]]*\]/g, '')
    .trim();
}

export function preserveMetaTags(rawNotes, cleanNotes, extraTag) {
  const metaTags = [];
  if (typeof rawNotes === 'string') {
    const editorMatch = rawNotes.match(/\[EDITOR_REQUIREMENTS:[^\]]*\]/);
    if (editorMatch) metaTags.push(editorMatch[0]);
    const titleMatch = rawNotes.match(/\[CUSTOM_SECTION_TITLE:[^\]]*\]/);
    if (titleMatch) metaTags.push(titleMatch[0]);
    const contentMatch = rawNotes.match(/\[CUSTOM_SECTION_CONTENT:[^\]]*\]/);
    if (contentMatch) metaTags.push(contentMatch[0]);
    const orderCodeMatch = rawNotes.match(/\[ORDER_CODE:[^\]]*\]/);
    if (orderCodeMatch) metaTags.push(orderCodeMatch[0]);
  }
  const parts = [cleanNotes, ...metaTags, extraTag].filter(Boolean);
  return parts.join(' ').trim();
}

export function parseNotesVisibility(notes, clientLinkVisible) {
  if (typeof notes === 'string') {
    if (notes.includes('[CLIENT_DELIVERABLE_VISIBLE:true]')) return true;
    if (notes.includes('[CLIENT_DELIVERABLE_VISIBLE:false]')) return false;
  }
  if (clientLinkVisible === true) return true;
  if (clientLinkVisible === false) return false;
  return false;
}

/** Transform a Supabase order row into the shape the existing UI expects. */
export function transformOrder(dbOrder) {
  const isCancelledByTag = (typeof dbOrder.admin_notes === 'string') && (dbOrder.admin_notes.includes('[ORDER_CANCELLED:true]') || dbOrder.admin_notes.includes('[CANCELLATION_REASON:'));
  const effectiveStatus = (isCancelledByTag || dbOrder.status === 'cancelled') ? 'cancelled' : dbOrder.status;
  const sm = STATUS_MAP[effectiveStatus] || STATUS_MAP.received;
  const cancellationReason = dbOrder.cancellation_reason || parseCancellationReason(dbOrder.admin_notes) || '';
  const editorProfile = dbOrder.editor;
  const clientProfile = dbOrder.client;

  const displayCode = formatOrderCode(dbOrder);
  const editorReq = parseEditorRequirements(dbOrder.admin_notes);
  const customSec = parseCustomSection(dbOrder.admin_notes);

  return {
    id: dbOrder.id,
    dbId: dbOrder.id,
    displayId: displayCode,
    orderCode: displayCode,
    title: dbOrder.order_name,
    client: clientProfile?.company_name || clientProfile?.full_name || 'Unknown',
    type: VIDEO_TYPE_MAP[dbOrder.video_type] || dbOrder.video_type,
    editor: {
      id: editorProfile?.id || null,
      name: editorProfile?.full_name || 'Unassigned',
      role: editorProfile?.editor_title || 'Pending Assignment',
      avatar: editorProfile?.avatar_url || '',
    },
    clientContact: {
      name: clientProfile?.full_name || 'Client',
      company: clientProfile?.company_name || '',
    },
    deadline: dbOrder.client_deadline
      ? new Date(dbOrder.client_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : 'No deadline',
    status: sm.label,
    dbStatus: effectiveStatus,
    badgeClass: sm.badgeClass,
    currentStep: sm.step,
    cancellationReason: cancellationReason,
    cancelledAt: dbOrder.cancelled_at || null,
    cancelledBy: dbOrder.cancelled_by || null,
    editorDeadline: dbOrder.editor_deadline ? dbOrder.editor_deadline.split('T')[0] : '',
    clientDeadline: dbOrder.client_deadline ? dbOrder.client_deadline.split('T')[0] : '',
    notes: stripCustomTags(stripVisibilityTag(stripOrderCodeTag(stripCancellationTag(dbOrder.admin_notes)))),
    rawAdminNotes: dbOrder.admin_notes || '',
    brief: dbOrder.brief || '',
    editorRequirements: editorReq,
    customSection: customSec,
    customSectionTitle: customSec.title,
    customSectionContent: customSec.content,
    hasCustomSection: customSec.hasCustomSection,
    driveLink: dbOrder.drive_link || '',
    dropboxLink: dbOrder.dropbox_link || '',
    additionalLink: dbOrder.additional_link || '',
    clientLinkVisible: parseNotesVisibility(dbOrder.admin_notes, dbOrder.client_link_visible),
    clientId: dbOrder.client_id,
    editorId: dbOrder.editor_id,
    adminId: dbOrder.admin_id,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at,
  };
}

export function getExpectedDeliveryDate(order) {
  if (!order) return 'Pending';
  if (order.clientDeadline) {
    try {
      const d = new Date(order.clientDeadline);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
  }
  if (order.editorDeadline) {
    try {
      const d = new Date(order.editorDeadline);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
  }
  if (order.createdAt) {
    try {
      const created = new Date(order.createdAt);
      if (!isNaN(created.getTime())) {
        const exp = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
        return exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
  }
  return 'Flexible';
}

export const DEFAULT_STUDIO_EDITORS = [
  {
    id: 'ed_studio_1',
    full_name: 'Alex Rivera',
    username: 'alexrivera',
    email: 'alex@motionnodeedits.com',
    editor_title: 'AI Video Editor & VFX Lead',
    role: 'editor',
    status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    skills: ['Runway Gen-3', 'Midjourney', 'After Effects', 'Topaz AI'],
  },
  {
    id: 'ed_studio_2',
    full_name: 'Marcus Chen',
    username: 'marcuschen',
    email: 'marcus@motionnodeedits.com',
    editor_title: 'Motion Graphics Specialist',
    role: 'editor',
    status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    skills: ['Cinema 4D', 'Blender', 'Unreal Engine 5', 'Motion Design'],
  },
  {
    id: 'ed_studio_3',
    full_name: 'Elena Rostova',
    username: 'elenarostova',
    email: 'elena@motionnodeedits.com',
    editor_title: 'Short-Form Specialist',
    role: 'editor',
    status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    skills: ['Premiere Pro', 'CapCut Pro', 'Sound Design', 'Reels / TikTok Pacing'],
  }
];

/** Transform editor profile + stats into shape the UI expects. */
export function transformEditor(profile, activeCount = 0, avgRating = 0) {
  const maxOrders = 5;
  const isAtCapacity = activeCount >= maxOrders;
  const name = profile?.full_name || profile?.username || profile?.email || 'Video Editor';
  const role = profile?.editor_title || profile?.role || 'AI Video Editor';
  const category = profile?.editor_title || 'AI Video Editor';
  const isPending = (profile?.status || '').toLowerCase() === 'pending';

  const status = isPending
    ? 'PENDING'
    : isAtCapacity
      ? 'AT CAPACITY'
      : 'AVAILABLE';

  const statusColor = isPending
    ? '#F59E0B'
    : isAtCapacity
      ? '#EF4444'
      : '#22C55E';

  const skillsList = Array.isArray(profile?.skills) && profile.skills.length > 0
    ? profile.skills
    : ['AI Video', 'After Effects', 'Colorist'];

  return {
    id: profile?.id || `ed_${Date.now()}`,
    name,
    email: profile?.email || '',
    phone: profile?.phone || '',
    avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    status,
    statusColor,
    activeOrders: activeCount,
    maxOrders,
    category,
    role,
    tagline: profile?.tagline || profile?.editor_title || `${category} Specialist`,
    skills: skillsList,
    rating: avgRating || 5.0,
    created_at: profile?.created_at,
  };
}

/** Transform client profile into shape the UI expects. */
export function transformClient(profile, activeCount = 0) {
  const isGoogle = Boolean(
    (profile.avatar_url && (profile.avatar_url.includes('googleusercontent.com') || profile.avatar_url.includes('google'))) ||
    profile.editor_title === 'Google User' ||
    profile.company_name === 'Google Client'
  );

  const status = (profile.status || 'approved').toLowerCase().trim();

  return {
    id: profile.id,
    name: profile.full_name || profile.company_name || profile.email || 'Client',
    previous_name: profile.previous_name || '',
    company: profile.company_name || '',
    company_name: profile.company_name || '',
    phone: profile.phone || '',
    tier: 'Client',
    activeProjects: activeCount,
    spend: '—',
    contact: profile.full_name || profile.email || 'Client',
    email: profile.email || '',
    status: status,
    isGoogle: isGoogle,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

export function getWhatsAppUrl(phone, name, projectType) {
  if (!phone) return null;
  const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^0+/, '');
  const finalPhone = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;
  const projectLabel = PROJECT_TYPE_LABELS[projectType] || 'video editing';
  const greeting = encodeURIComponent(`Hi ${name || 'there'}, thanks for reaching out to MotionNodeEdits regarding your ${projectLabel} project!`);
  return `https://wa.me/${finalPhone}?text=${greeting}`;
}

export function getOrderAcceptedDate(order, historyMap) {
  if (!order) return '—';
  const history = (historyMap && historyMap[order.id]) || [];
  const match = history.find(h => h.new_status === 'accepted');
  if (match && match.changed_at) {
    try {
      const d = new Date(match.changed_at);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
  }
  if (order.createdAt) {
    try {
      const d = new Date(order.createdAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
  }
  return '—';
}

export function getDeliveryPerformance(order, historyMap) {
  if (!order) return { label: 'On Time', isOnTime: true };

  let deliveryTime = null;
  const history = (historyMap && historyMap[order.id]) || [];
  const deliveredHistory = history.find(h => h.new_status === 'delivered');
  if (deliveredHistory && deliveredHistory.changed_at) {
    deliveryTime = new Date(deliveredHistory.changed_at);
  } else if (order.updatedAt) {
    deliveryTime = new Date(order.updatedAt);
  }

  const deadlineStr = order.clientDeadline || order.editorDeadline;
  if (!deadlineStr || deadlineStr === 'No deadline' || deadlineStr === '—') {
    return { label: 'On Time', isOnTime: true };
  }

  const deadlineTime = new Date(deadlineStr);
  if (isNaN(deadlineTime.getTime()) || !deliveryTime || isNaN(deliveryTime.getTime())) {
    return { label: 'On Time', isOnTime: true };
  }

  const deadlineEndOfDay = new Date(deadlineTime);
  deadlineEndOfDay.setHours(23, 59, 59, 999);

  const diffMs = deliveryTime.getTime() - deadlineEndOfDay.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0 || diffDays <= 0) {
    return {
      label: 'On Time',
      isOnTime: true,
      diffDays: 0,
    };
  } else {
    return {
      label: `Delayed (+${diffDays}d)`,
      isOnTime: false,
      diffDays,
    };
  }
}

export function getOrderStageDate(order, statusKey, stepIndex, statusHistoryMap = {}) {
  if (!order || !order.id) return 'Pending';
  const currentStep = order.currentStep ?? 0;

  // If delivered stage is not yet completed, show expected delivery date
  if (statusKey === 'delivered' && currentStep < 4) {
    const expDate = getExpectedDeliveryDate(order);
    return `Exp: ${expDate}`;
  }

  // If step hasn't been reached yet
  if (currentStep < stepIndex) {
    return 'Pending';
  }

  // Step 0: Received
  if (stepIndex === 0) {
    if (order.createdAt) {
      try {
        const d = new Date(order.createdAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch {}
    }
    return 'Received';
  }

  // Check status history for this step
  const history = statusHistoryMap[order.id] || [];
  const match = history.find(h => h.new_status === statusKey);
  if (match && match.changed_at) {
    try {
      const d = new Date(match.changed_at);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
  }

  // Active step timestamp
  if (currentStep === stepIndex && order.updatedAt) {
    try {
      const d = new Date(order.updatedAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
  }

  // Completed step fallback
  if (currentStep > stepIndex) {
    const fallbackDate = order.updatedAt || order.createdAt;
    if (fallbackDate) {
      try {
        const d = new Date(fallbackDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch {}
    }
  }

  return 'Pending';
}

