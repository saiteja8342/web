import { supabase } from '../supabase/client';

const LOCAL_STORAGE_KEY = 'mne_link_feedbacks';

function getLocalFeedbacks() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFeedback(item) {
  try {
    const list = getLocalFeedbacks();
    const updated = [item, ...list.filter(f => f.id !== item.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[LinkFeedback] Failed to save local feedback fallback:', err);
  }
}

function removeLocalFeedback(id) {
  try {
    const list = getLocalFeedbacks();
    const updated = list.filter(f => f.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[LinkFeedback] Failed to remove local feedback:', err);
  }
}

/**
 * Submit feedback via public link.
 * Works for anonymous or authenticated visitors.
 */
export async function submitLinkFeedback({
  name,
  email = '',
  company = '',
  project_type = '',
  rating = 5,
  feedback,
  improvements = '',
  testimonial_consent = false,
}) {
  const newFeedback = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'fb_' + Date.now(),
    name: (name || '').trim(),
    email: (email || '').trim().toLowerCase(),
    company: (company || '').trim(),
    project_type: (project_type || '').trim(),
    rating: Number(rating) || 5,
    feedback: (feedback || '').trim(),
    improvements: (improvements || '').trim(),
    testimonial_consent: Boolean(testimonial_consent),
    created_at: new Date().toISOString(),
  };

  // Always keep local fallback copy
  saveLocalFeedback(newFeedback);

  try {
    // Pure INSERT without .select() to respect anon RLS
    const { error } = await supabase
      .from('link_feedback')
      .insert([
        {
          id: newFeedback.id,
          name: newFeedback.name,
          email: newFeedback.email || null,
          company: newFeedback.company || null,
          project_type: newFeedback.project_type || null,
          rating: newFeedback.rating,
          feedback: newFeedback.feedback,
          improvements: newFeedback.improvements || null,
          testimonial_consent: newFeedback.testimonial_consent,
        }
      ]);

    if (error) {
      console.warn('[LinkFeedback] Supabase insert warning (local copy preserved):', error);
      return { data: newFeedback, error: null, fallback: true };
    }

    return { data: newFeedback, error: null, fallback: false };
  } catch (err) {
    console.warn('[LinkFeedback] Exception during submission (local copy preserved):', err);
    return { data: newFeedback, error: null, fallback: true };
  }
}

/**
 * Fetch all link feedback records for Admin Dashboard view.
 * Merges Supabase records with local storage fallback.
 */
export async function getLinkFeedbacks() {
  const localList = getLocalFeedbacks();

  try {
    const { data, error } = await supabase
      .from('link_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[LinkFeedback] Supabase query error, using local fallback:', error);
      return { data: localList, error: null };
    }

    // Merge Supabase items and any local-only items
    const mergedMap = new Map();
    (data || []).forEach(item => mergedMap.set(item.id, item));
    localList.forEach(item => {
      if (!mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    });

    const sortedList = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return { data: sortedList, error: null };
  } catch (err) {
    console.warn('[LinkFeedback] Fetch exception, using local fallback:', err);
    return { data: localList, error: null };
  }
}

/**
 * Delete a feedback record (Admin only).
 */
export async function deleteLinkFeedback(id) {
  removeLocalFeedback(id);

  try {
    const { error } = await supabase
      .from('link_feedback')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[LinkFeedback] Supabase delete error:', error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.warn('[LinkFeedback] Delete exception:', err);
    return { error: err };
  }
}

/**
 * Update testimonial consent for a submitted feedback item.
 */
export async function updateLinkFeedbackConsent(id, consent) {
  try {
    const list = getLocalFeedbacks();
    const updated = list.map(item => item.id === id ? { ...item, testimonial_consent: Boolean(consent) } : item);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[LinkFeedback] Local storage update consent error:', err);
  }

  try {
    const { error } = await supabase
      .from('link_feedback')
      .update({ testimonial_consent: Boolean(consent) })
      .eq('id', id);

    if (error) {
      console.warn('[LinkFeedback] Supabase update consent error:', error);
      return { error };
    }
    return { error: null };
  } catch (err) {
    console.warn('[LinkFeedback] Update consent exception:', err);
    return { error: err };
  }
}
