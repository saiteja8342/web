import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Video,
  Settings,
  Plus,
  Trash2,
  Star,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Layers,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Youtube,
  Linkedin,
  RefreshCw,
  Globe,
  Award,
  Check,
  Pencil,
  Film,
  Cpu,
  Megaphone,
  Smartphone,
  Users,
  Box,
  Scissors,
  Camera,
  Zap,
  Flame
} from 'lucide-react';
import {
  getAllTestimonialsAdmin,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getAllPortfolioVideosAdmin,
  createPortfolioVideo,
  deletePortfolioVideo,
  getSiteSettings,
  updateSiteSettings,
  getClientOrderRatingsForAdmin,
  DEFAULT_FOOTER_SETTINGS,
  getServicesSettings,
  updateServicesSettings,
  DEFAULT_SERVICES_SETTINGS,
  getOurWorkSettings,
  updateOurWorkSettings,
  DEFAULT_OUR_WORK_SETTINGS
} from '../../lib/db/cms';
import { parseYouTubeInput } from '../../utils/youtube';

const CMS_SERVICE_ICONS = {
  Film,
  Cpu,
  Megaphone,
  Smartphone,
  Users,
  Box,
  Video,
  Sparkles,
  Play,
  Award,
  Zap,
  Layers,
  Globe,
  Camera,
  Scissors,
  Flame
};

const CMS_COLOR_PRESETS = [
  '#FFFFFF',
  '#E5E5EA',
  '#C5C6C9',
  '#D1D1D6',
  '#8E8F94',
  '#A2A2A7',
  '#38BDF8',
  '#818CF8',
  '#A78BFA',
  '#F472B6',
  '#34D399',
  '#FBBF24'
];

export default function WebsiteCMS() {
  const [activeTab, setActiveTab] = useState('testimonials'); // 'testimonials' | 'videos' | 'footer'

  // Notification / Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ----------------------------------------------------------------------------
  // TESTIMONIALS STATE
  // ----------------------------------------------------------------------------
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [showAddTestimonialModal, setShowAddTestimonialModal] = useState(false);
  const [deleteTestimonialConfirm, setDeleteTestimonialConfirm] = useState(null);
  const [savingTestimonial, setSavingTestimonial] = useState(false);

  // New Testimonial Form
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    rating: 5,
    feedback: '',
    company: '',
    role: ''
  });

  const loadTestimonials = async () => {
    setLoadingTestimonials(true);
    const { data, error } = await getAllTestimonialsAdmin();
    if (!error) {
      setTestimonials(data);
    } else {
      showToast('Could not load testimonials from database. Run cms_features.sql in Supabase.', 'error');
    }
    setLoadingTestimonials(false);
  };

  const handleAddTestimonial = async (e) => {
    e.preventDefault();
    if (!newTestimonial.name.trim() || !newTestimonial.feedback.trim()) {
      showToast('Please enter both name and feedback.', 'error');
      return;
    }

    setSavingTestimonial(true);
    const { data, error } = await createTestimonial(newTestimonial);
    if (!error && data) {
      setTestimonials(prev => [data, ...prev]);
      setShowAddTestimonialModal(false);
      setNewTestimonial({ name: '', rating: 5, feedback: '', company: '', role: '' });
      showToast('Testimonial published successfully!');
    } else {
      showToast(error?.message || 'Failed to add testimonial', 'error');
    }
    setSavingTestimonial(false);
  };

  // Edit Testimonial State
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [savingEditTestimonial, setSavingEditTestimonial] = useState(false);

  const handleOpenEditTestimonial = (item) => {
    setEditingTestimonial({
      id: item.id,
      name: item.name || '',
      rating: item.rating || 5,
      feedback: item.feedback || '',
      company: item.company || '',
      role: item.role || ''
    });
  };

  const handleSaveEditTestimonial = async (e) => {
    e.preventDefault();
    if (!editingTestimonial.name.trim() || !editingTestimonial.feedback.trim()) {
      showToast('Name and feedback cannot be empty.', 'error');
      return;
    }

    setSavingEditTestimonial(true);
    const { data, error } = await updateTestimonial(editingTestimonial.id, {
      name: editingTestimonial.name.trim(),
      rating: editingTestimonial.rating,
      feedback: editingTestimonial.feedback.trim(),
      company: editingTestimonial.company?.trim() || null,
      role: editingTestimonial.role?.trim() || null
    });

    if (!error && data) {
      setTestimonials(prev => prev.map(t => t.id === data.id ? data : t));
      setEditingTestimonial(null);
      showToast('Testimonial updated successfully!');
    } else {
      showToast(error?.message || 'Failed to update testimonial', 'error');
    }
    setSavingEditTestimonial(false);
  };

  const handleDeleteTestimonial = async (id) => {
    const { success, error } = await deleteTestimonial(id);
    if (success) {
      setTestimonials(prev => prev.filter(t => t.id !== id));
      setDeleteTestimonialConfirm(null);
      showToast('Testimonial removed.');
    } else {
      showToast(error?.message || 'Failed to delete testimonial', 'error');
    }
  };

  const handleToggleTestimonialActive = async (item) => {
    const nextStatus = !item.is_active;
    const { data, error } = await updateTestimonial(item.id, { is_active: nextStatus });
    if (!error && data) {
      setTestimonials(prev => prev.map(t => t.id === item.id ? { ...t, is_active: nextStatus } : t));
      showToast(nextStatus ? 'Testimonial activated on website.' : 'Testimonial hidden from website.');
    } else {
      showToast(error?.message || 'Failed to update testimonial status', 'error');
    }
  };

  // Client Delivered Reviews State (from orders)
  const [clientReviews, setClientReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [testimonialSubTab, setTestimonialSubTab] = useState('live'); // 'live' | 'client_reviews'

  const loadClientReviews = async () => {
    setLoadingReviews(true);
    const { data } = await getClientOrderRatingsForAdmin();
    if (data) {
      setClientReviews(data.filter(r => r.feedback_note && r.feedback_note.trim().length > 0));
    }
    setLoadingReviews(false);
  };

  const isReviewAlreadyPublished = (review) => {
    const cleanFeedback = (review.feedback_note || '').replace(/\[TESTIMONIAL:(true|false)\]/g, '').trim().toLowerCase();
    const authorName = (review.client?.full_name || '').trim().toLowerCase();
    return testimonials.some(t => 
      (authorName && t.name.trim().toLowerCase() === authorName) || 
      (cleanFeedback.length > 10 && t.feedback.trim().toLowerCase().includes(cleanFeedback.slice(0, 25)))
    );
  };

  const handleApproveClientReview = async (review) => {
    const authorName = review.client?.full_name || 'Client';
    const company = review.client?.company_name || '';
    const cleanFeedback = (review.feedback_note || '').replace(/\[TESTIMONIAL:(true|false)\]/g, '').trim();

    const { data, error } = await createTestimonial({
      name: authorName,
      rating: review.rating || 5,
      feedback: cleanFeedback,
      company: company,
      role: 'Verified Client',
      is_active: true
    });

    if (!error && data) {
      setTestimonials(prev => [data, ...prev]);
      showToast(`Review from ${authorName} approved and published to website!`);
    } else {
      showToast(error?.message || 'Failed to publish review to website', 'error');
    }
  };

  // ----------------------------------------------------------------------------
  // PORTFOLIO VIDEOS STATE
  // ----------------------------------------------------------------------------
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [deleteVideoConfirm, setDeleteVideoConfirm] = useState(null);
  const [savingVideo, setSavingVideo] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');

  // New Video Form
  const [newVideo, setNewVideo] = useState({
    title: '',
    youtube_url: '',
    category: 'REELS',
    custom_category: '',
    aspect_ratio: '16/9',
    metric: '',
    duration: '',
    description: ''
  });

  // Auto-detect YouTube thumbnail & ratio when pasting URL
  const youtubePreview = useMemo(() => {
    if (!newVideo.youtube_url) return null;
    return parseYouTubeInput(newVideo.youtube_url, newVideo.aspect_ratio);
  }, [newVideo.youtube_url, newVideo.aspect_ratio]);

  const loadVideos = async () => {
    setLoadingVideos(true);
    const { data, error } = await getAllPortfolioVideosAdmin();
    if (!error) {
      setVideos(data);
    } else {
      showToast('Could not load videos from database. Run cms_features.sql in Supabase.', 'error');
    }
    setLoadingVideos(false);
  };

  const handleYoutubeUrlChange = (url) => {
    const parsed = parseYouTubeInput(url);
    const updates = { youtube_url: url };
    if (parsed?.isVertical) {
      updates.aspect_ratio = '9/16';
      if (!newVideo.category || newVideo.category === 'AI ADS') {
        updates.category = 'REELS';
      }
    }
    setNewVideo(prev => ({ ...prev, ...updates }));
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!newVideo.title.trim() || !newVideo.youtube_url.trim()) {
      showToast('Please provide both video title and YouTube URL.', 'error');
      return;
    }

    const finalCategory = newVideo.category === 'CUSTOM'
      ? newVideo.custom_category.trim() || 'FEATURED'
      : newVideo.category;

    setSavingVideo(true);
    const { data, error } = await createPortfolioVideo({
      title: newVideo.title,
      youtube_url: newVideo.youtube_url,
      category: finalCategory,
      aspect_ratio: newVideo.aspect_ratio,
      metric: newVideo.metric,
      duration: newVideo.duration,
      description: newVideo.description
    });

    if (!error && data) {
      setVideos(prev => [data, ...prev]);
      setShowAddVideoModal(false);
      setNewVideo({
        title: '',
        youtube_url: '',
        category: 'REELS',
        custom_category: '',
        aspect_ratio: '16/9',
        metric: '',
        duration: '',
        description: ''
      });
      showToast('Portfolio video published successfully!');
    } else {
      showToast(error?.message || 'Failed to add video', 'error');
    }
    setSavingVideo(false);
  };

  const handleDeleteVideo = async (id) => {
    const { success, error } = await deletePortfolioVideo(id);
    if (success) {
      setVideos(prev => prev.filter(v => v.id !== id));
      setDeleteVideoConfirm(null);
      showToast('Video removed from portfolio.');
    } else {
      showToast(error?.message || 'Failed to delete video', 'error');
    }
  };

  // Video Categories List
  const availableCategories = useMemo(() => {
    const cats = new Set(['ALL', 'REELS', 'AI ADS', 'AI STORY']);
    videos.forEach(v => {
      if (v.category) cats.add(v.category.toUpperCase());
    });
    return Array.from(cats);
  }, [videos]);

  const filteredVideos = useMemo(() => {
    if (filterCategory === 'ALL') return videos;
    return videos.filter(v => v.category === filterCategory);
  }, [videos, filterCategory]);

  // ----------------------------------------------------------------------------
  // FOOTER & SITE SETTINGS STATE
  // ----------------------------------------------------------------------------
  const [footerSettings, setFooterSettings] = useState(DEFAULT_FOOTER_SETTINGS);
  const [loadingFooter, setLoadingFooter] = useState(true);
  const [savingFooter, setSavingFooter] = useState(false);

  const loadFooterSettings = async () => {
    setLoadingFooter(true);
    const settings = await getSiteSettings('footer_settings');
    setFooterSettings(settings);
    setLoadingFooter(false);
  };

  const handleSaveFooter = async (e) => {
    e.preventDefault();
    setSavingFooter(true);
    const { error } = await updateSiteSettings('footer_settings', footerSettings);
    if (!error) {
      showToast('Footer settings saved and updated live on website!');
    } else {
      showToast(error?.message || 'Failed to save footer settings', 'error');
    }
    setSavingFooter(false);
  };

  // ----------------------------------------------------------------------------
  // WHAT WE DO (SERVICES) STATE
  // ----------------------------------------------------------------------------
  const [servicesSettings, setServicesSettings] = useState(DEFAULT_SERVICES_SETTINGS);
  const [loadingServices, setLoadingServices] = useState(true);
  const [savingServices, setSavingServices] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingServiceItem, setEditingServiceItem] = useState(null);
  const [deleteServiceConfirm, setDeleteServiceConfirm] = useState(null);
  const [newServiceItem, setNewServiceItem] = useState({
    title: '',
    description: '',
    icon: 'Film',
    color: '#FFFFFF'
  });

  const loadServicesSettings = async () => {
    setLoadingServices(true);
    const data = await getServicesSettings();
    if (data) {
      setServicesSettings(data);
    }
    setLoadingServices(false);
  };

  const handleSaveServicesHeader = async (e) => {
    e.preventDefault();
    setSavingServices(true);
    const { error } = await updateServicesSettings(servicesSettings);
    if (!error) {
      showToast('What We Do section saved and updated on website!');
    } else {
      showToast(error?.message || 'Failed to save services settings', 'error');
    }
    setSavingServices(false);
  };

  const handleToggleServiceActive = async (itemId) => {
    const updatedItems = (servicesSettings.items || []).map(item => {
      const match = item.id === itemId || item.title === itemId;
      return match ? { ...item, is_active: item.is_active === false ? true : false } : item;
    });
    const updated = { ...servicesSettings, items: updatedItems };
    setServicesSettings(updated);
    await updateServicesSettings(updated);
    showToast('Service card visibility updated.');
  };

  const handleAddServiceItem = async (e) => {
    e.preventDefault();
    if (!newServiceItem.title.trim()) {
      showToast('Please enter a title for the service.', 'error');
      return;
    }
    const id = newServiceItem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newItem = {
      id,
      title: newServiceItem.title.trim(),
      description: newServiceItem.description.trim(),
      icon: newServiceItem.icon || 'Film',
      color: newServiceItem.color || '#FFFFFF',
      is_active: true
    };
    const updated = {
      ...servicesSettings,
      items: [...(servicesSettings.items || []), newItem]
    };
    setServicesSettings(updated);
    setShowAddServiceModal(false);
    setNewServiceItem({ title: '', description: '', icon: 'Film', color: '#FFFFFF' });
    await updateServicesSettings(updated);
    showToast('New service card added!');
  };

  const handleOpenEditServiceItem = (item) => {
    setEditingServiceItem({
      id: item.id || item.title,
      title: item.title || '',
      description: item.description || '',
      icon: item.icon || 'Film',
      color: item.color || '#FFFFFF'
    });
  };

  const handleSaveEditServiceItem = async (e) => {
    e.preventDefault();
    if (!editingServiceItem.title.trim()) {
      showToast('Service title cannot be empty.', 'error');
      return;
    }
    const updatedItems = (servicesSettings.items || []).map(item => {
      const match = item.id === editingServiceItem.id || item.title === editingServiceItem.id;
      return match ? { ...item, ...editingServiceItem } : item;
    });
    const updated = { ...servicesSettings, items: updatedItems };
    setServicesSettings(updated);
    setEditingServiceItem(null);
    await updateServicesSettings(updated);
    showToast('Service card updated successfully!');
  };

  const handleDeleteServiceItem = async (itemId) => {
    const updatedItems = (servicesSettings.items || []).filter(item => item.id !== itemId && item.title !== itemId);
    const updated = { ...servicesSettings, items: updatedItems };
    setServicesSettings(updated);
    setDeleteServiceConfirm(null);
    await updateServicesSettings(updated);
    showToast('Service card removed.');
  };

  // ----------------------------------------------------------------------------
  // OUR WORK (FEATURED PROJECTS) HEADER STATE
  // ----------------------------------------------------------------------------
  const [ourWorkSettings, setOurWorkSettings] = useState(DEFAULT_OUR_WORK_SETTINGS);
  const [savingOurWork, setSavingOurWork] = useState(false);

  const loadOurWorkSettings = async () => {
    const data = await getOurWorkSettings();
    if (data) {
      setOurWorkSettings(data);
    }
  };

  const handleSaveOurWorkHeader = async (e) => {
    e.preventDefault();
    setSavingOurWork(true);
    const { error } = await updateOurWorkSettings(ourWorkSettings);
    if (!error) {
      showToast('Our Work section header saved and updated on website!');
    } else {
      showToast(error?.message || 'Failed to save Our Work settings', 'error');
    }
    setSavingOurWork(false);
  };

  // Initial fetch on mount
  useEffect(() => {
    loadTestimonials();
    loadClientReviews();
    loadVideos();
    loadFooterSettings();
    loadServicesSettings();
    loadOurWorkSettings();
  }, []);

  return (
    <div className="cms-container">
      {/* Toast Alert */}
      {toast && (
        <div className={`cms-toast ${toast.type === 'error' ? 'cms-toast-error' : 'cms-toast-success'}`}>
          {toast.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="cms-header-row">
        <div>
          <h1 className="cms-page-title">Website Content Management (CMS)</h1>
          <p className="cms-page-subtitle">
            Update your public client testimonials, Our Work YouTube video showcase, and footer settings in real time.
          </p>
        </div>

        <div className="cms-tab-pills">
          <button
            type="button"
            className={`cms-tab-pill ${activeTab === 'testimonials' ? 'active' : ''}`}
            onClick={() => setActiveTab('testimonials')}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Testimonials</span>
            <span className="cms-count-badge">{testimonials.length}</span>
          </button>

          <button
            type="button"
            className={`cms-tab-pill ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <Video className="h-4 w-4" />
            <span>Our Work Videos</span>
            <span className="cms-count-badge">{videos.length}</span>
          </button>

          <button
            type="button"
            className={`cms-tab-pill ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Layers className="h-4 w-4" />
            <span>What We Do</span>
            <span className="cms-count-badge">{(servicesSettings.items || []).length}</span>
          </button>

          <button
            type="button"
            className={`cms-tab-pill ${activeTab === 'footer' ? 'active' : ''}`}
            onClick={() => setActiveTab('footer')}
          >
            <Settings className="h-4 w-4" />
            <span>Footer & Settings</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: TESTIMONIALS                                                  */}
      {/* ==================================================================== */}
      {activeTab === 'testimonials' && (
        <div className="cms-tab-content">
          <div className="cms-section-toolbar">
            <div className="cms-toolbar-left">
              <h2 className="cms-section-title">Client Reviews & Testimonials</h2>
              <span className="cms-section-hint">
                Manage live testimonials on your website and review client feedback submitted upon project delivery.
              </span>
            </div>
            {testimonialSubTab === 'live' && (
              <button
                type="button"
                className="vel-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                onClick={() => setShowAddTestimonialModal(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Add Testimonial</span>
              </button>
            )}
          </div>

          {/* Sub-tab Filter Switcher */}
          <div className="cms-filter-row" style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className={`cms-filter-chip ${testimonialSubTab === 'live' ? 'active' : ''}`}
              onClick={() => setTestimonialSubTab('live')}
            >
              Live on Website ({testimonials.length})
            </button>
            <button
              type="button"
              className={`cms-filter-chip ${testimonialSubTab === 'client_reviews' ? 'active' : ''}`}
              onClick={() => setTestimonialSubTab('client_reviews')}
            >
              Client Project Feedback ({clientReviews.length})
            </button>
          </div>

          {/* VIEW A: LIVE WEBSITE TESTIMONIALS */}
          {testimonialSubTab === 'live' && (
            loadingTestimonials ? (
              <div className="cms-loading-box">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                <span>Loading testimonials...</span>
              </div>
            ) : testimonials.length === 0 ? (
              <div className="cms-empty-state">
                <MessageSquare className="h-12 w-12 text-zinc-600 mb-3" />
                <h3>No Testimonials in Database</h3>
                <p>Run <code>cms_features.sql</code> in Supabase to seed initial data, or click "Add Testimonial" above.</p>
                <button
                  type="button"
                  className="vel-btn-primary mt-4"
                  onClick={() => setShowAddTestimonialModal(true)}
                >
                  Add Your First Testimonial
                </button>
              </div>
            ) : (
              <div className="cms-cards-grid">
                {testimonials.map((item) => (
                  <div key={item.id} className={`cms-card ${!item.is_active ? 'cms-card-dimmed' : ''}`}>
                    <div className="cms-card-header">
                      <div className="cms-avatar-circle">
                        {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="cms-card-author-info">
                        <div className="cms-card-author-name">{item.name}</div>
                        <div className="cms-card-author-role">
                          {item.role || 'Client'}
                          {item.company ? ` • ${item.company}` : ''}
                        </div>
                      </div>
                      <div className="cms-stars-row">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-3.5 w-3.5"
                            fill={i < (item.rating || 5) ? '#FBBF24' : 'transparent'}
                            stroke={i < (item.rating || 5) ? '#FBBF24' : '#4B5563'}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="cms-card-body">
                      <p className="cms-testimonial-text">"{item.feedback}"</p>
                    </div>

                    <div className="cms-card-footer">
                      <button
                        type="button"
                        className={`cms-toggle-pill ${item.is_active ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleTestimonialActive(item)}
                        title="Click to toggle visibility on website"
                      >
                        {item.is_active ? '● Live on Site' : '○ Hidden'}
                      </button>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="cms-action-btn-secondary"
                          onClick={() => handleOpenEditTestimonial(item)}
                          title="Edit Testimonial"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          className="cms-action-btn-danger"
                          onClick={() => setDeleteTestimonialConfirm(item)}
                          title="Delete Testimonial"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* VIEW B: CLIENT DELIVERED REVIEWS (PENDING ADMIN SELECTION) */}
          {testimonialSubTab === 'client_reviews' && (
            loadingReviews ? (
              <div className="cms-loading-box">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                <span>Loading client reviews...</span>
              </div>
            ) : clientReviews.length === 0 ? (
              <div className="cms-empty-state">
                <Award className="h-12 w-12 text-zinc-600 mb-3" />
                <h3>No Client Reviews Yet</h3>
                <p>When clients finish an order and submit their feedback, their reviews arrive here privately for your review.</p>
              </div>
            ) : (
              <div className="cms-cards-grid">
                {clientReviews.map((rev) => {
                  const clientName = rev.client?.full_name || 'Client';
                  const company = rev.client?.company_name || '';
                  const orderTitle = rev.orders?.order_name || 'Delivered Order';
                  const cleanFeedback = (rev.feedback_note || '').replace(/\[TESTIMONIAL:(true|false)\]/g, '').trim();
                  const isFeatured = isReviewAlreadyPublished(rev);

                  return (
                    <div key={rev.id} className="cms-card">
                      <div className="cms-card-header">
                        <div className="cms-avatar-circle">
                          {clientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="cms-card-author-info">
                          <div className="cms-card-author-name">{clientName}</div>
                          <div className="cms-card-author-role">
                            {company ? `${company} • ` : ''}{orderTitle}
                          </div>
                        </div>
                        <div className="cms-stars-row">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-3.5 w-3.5"
                              fill={i < (rev.rating || 5) ? '#FBBF24' : 'transparent'}
                              stroke={i < (rev.rating || 5) ? '#FBBF24' : '#4B5563'}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="cms-card-body">
                        <p className="cms-testimonial-text">"{cleanFeedback}"</p>
                      </div>

                      <div className="cms-card-footer">
                        <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                          {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Delivered'}
                        </span>

                        {isFeatured ? (
                          <span style={{
                            fontSize: '0.74rem',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#4ADE80',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Check className="h-3 w-3" />
                            <span>Live on Website</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="vel-btn-solid"
                            style={{
                              fontSize: '0.74rem',
                              padding: '5px 12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onClick={() => handleApproveClientReview(rev)}
                          >
                            <Award className="h-3.5 w-3.5" />
                            <span>Feature on Website</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ADD TESTIMONIAL MODAL */}
          {showAddTestimonialModal && (
            <div className="vel-modal-backdrop" onClick={() => setShowAddTestimonialModal(false)}>
              <div className="vel-modal-box cms-modal" onClick={e => e.stopPropagation()}>
                <div className="vel-modal-header">
                  <h3 className="vel-modal-title">Add Client Testimonial</h3>
                  <button
                    type="button"
                    className="vel-btn-ghost-icon"
                    onClick={() => setShowAddTestimonialModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleAddTestimonial} className="vel-modal-body">
                  <div className="vel-form-group">
                    <label className="vel-label">Client / Person Name *</label>
                    <input
                      type="text"
                      className="vel-input"
                      placeholder="e.g. Sarah Jenkins or Prasad"
                      value={newTestimonial.name}
                      onChange={e => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vel-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="vel-form-group">
                      <label className="vel-label">Company (Optional)</label>
                      <input
                        type="text"
                        className="vel-input"
                        placeholder="e.g. Nexus Tech or YouTube"
                        value={newTestimonial.company}
                        onChange={e => setNewTestimonial({ ...newTestimonial, company: e.target.value })}
                      />
                    </div>
                    <div className="vel-form-group">
                      <label className="vel-label">Role / Title (Optional)</label>
                      <input
                        type="text"
                        className="vel-input"
                        placeholder="e.g. Creator, CMO, Brand Founder"
                        value={newTestimonial.role}
                        onChange={e => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="vel-form-group">
                    <label className="vel-label">Rating (Stars)</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewTestimonial({ ...newTestimonial, rating: star })}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <Star
                            className="h-6 w-6"
                            fill={star <= newTestimonial.rating ? '#FBBF24' : 'transparent'}
                            stroke={star <= newTestimonial.rating ? '#FBBF24' : '#6B7280'}
                          />
                        </button>
                      ))}
                      <span style={{ fontSize: '0.875rem', color: '#9CA3AF', marginLeft: '8px' }}>
                        {newTestimonial.rating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  <div className="vel-form-group">
                    <label className="vel-label">Feedback / Review *</label>
                    <textarea
                      className="vel-textarea"
                      rows={4}
                      placeholder="Write the client's review or quote here..."
                      value={newTestimonial.feedback}
                      onChange={e => setNewTestimonial({ ...newTestimonial, feedback: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vel-modal-footer" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="vel-btn-secondary"
                      onClick={() => setShowAddTestimonialModal(false)}
                      disabled={savingTestimonial}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="vel-btn-primary"
                      disabled={savingTestimonial}
                    >
                      {savingTestimonial ? 'Publishing...' : 'Publish Testimonial'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT TESTIMONIAL MODAL */}
          {editingTestimonial && (
            <div className="vel-modal-backdrop" onClick={() => setEditingTestimonial(null)}>
              <div className="vel-modal-box cms-modal" onClick={e => e.stopPropagation()}>
                <div className="vel-modal-header">
                  <h3 className="vel-modal-title">Edit Testimonial</h3>
                  <button
                    type="button"
                    className="vel-btn-ghost-icon"
                    onClick={() => setEditingTestimonial(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditTestimonial} className="vel-modal-body">
                  <div className="vel-form-group">
                    <label className="vel-label">Client / Person Name *</label>
                    <input
                      type="text"
                      className="vel-input"
                      value={editingTestimonial.name}
                      onChange={e => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vel-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="vel-form-group">
                      <label className="vel-label">Company (Optional)</label>
                      <input
                        type="text"
                        className="vel-input"
                        placeholder="e.g. Nexus Tech"
                        value={editingTestimonial.company}
                        onChange={e => setEditingTestimonial({ ...editingTestimonial, company: e.target.value })}
                      />
                    </div>
                    <div className="vel-form-group">
                      <label className="vel-label">Role / Title (Optional)</label>
                      <input
                        type="text"
                        className="vel-input"
                        placeholder="e.g. Creator, Founder"
                        value={editingTestimonial.role}
                        onChange={e => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="vel-form-group">
                    <label className="vel-label">Rating (Stars)</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditingTestimonial({ ...editingTestimonial, rating: star })}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <Star
                            className="h-6 w-6"
                            fill={star <= editingTestimonial.rating ? '#FBBF24' : 'transparent'}
                            stroke={star <= editingTestimonial.rating ? '#FBBF24' : '#6B7280'}
                          />
                        </button>
                      ))}
                      <span style={{ fontSize: '0.875rem', color: '#9CA3AF', marginLeft: '8px' }}>
                        {editingTestimonial.rating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  <div className="vel-form-group">
                    <label className="vel-label">Feedback / Review *</label>
                    <textarea
                      className="vel-textarea"
                      rows={4}
                      value={editingTestimonial.feedback}
                      onChange={e => setEditingTestimonial({ ...editingTestimonial, feedback: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vel-modal-footer" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="vel-btn-secondary"
                      onClick={() => setEditingTestimonial(null)}
                      disabled={savingEditTestimonial}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="vel-btn-primary"
                      disabled={savingEditTestimonial}
                    >
                      {savingEditTestimonial ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* DELETE CONFIRMATION MODAL */}
          {deleteTestimonialConfirm && (
            <div className="vel-modal-backdrop" onClick={() => setDeleteTestimonialConfirm(null)}>
              <div className="vel-modal-box vel-modal-sm" onClick={e => e.stopPropagation()}>
                <div className="vel-modal-header">
                  <h3 className="vel-modal-title">Delete Testimonial?</h3>
                  <button type="button" className="vel-btn-ghost-icon" onClick={() => setDeleteTestimonialConfirm(null)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="vel-modal-body">
                  <p style={{ color: '#D1D5DB', fontSize: '0.9rem' }}>
                    Are you sure you want to permanently delete the testimonial from <strong>{deleteTestimonialConfirm.name}</strong>? This action cannot be undone.
                  </p>
                </div>
                <div className="vel-modal-footer">
                  <button type="button" className="vel-btn-secondary" onClick={() => setDeleteTestimonialConfirm(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="vel-btn-danger"
                    onClick={() => handleDeleteTestimonial(deleteTestimonialConfirm.id)}
                  >
                    Delete Testimonial
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: OUR WORK VIDEOS                                               */}
      {/* ==================================================================== */}
      {activeTab === 'videos' && (
        <div className="cms-tab-content">
          {/* SECTION: OUR WORK SECTION HEADER */}
          <form onSubmit={handleSaveOurWorkHeader} className="cms-section-card" style={{ marginBottom: '32px' }}>
            <div className="cms-section-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="cms-card-heading">Section Header & Description</h3>
                  <p className="cms-card-subheading">
                    Edit the eyebrow tag, title, and intro text displayed above the video portfolio on the homepage.
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="vel-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                disabled={savingOurWork}
              >
                <Save className="h-4 w-4" />
                <span>{savingOurWork ? 'Saving...' : 'Save Header'}</span>
              </button>
            </div>

            <div className="cms-form-grid" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="vel-form-group">
                <label className="vel-label">Section Eyebrow (Small Top Tag)</label>
                <input
                  type="text"
                  className="vel-input"
                  placeholder="OUR WORK"
                  value={ourWorkSettings.eyebrow || ''}
                  onChange={e => setOurWorkSettings({ ...ourWorkSettings, eyebrow: e.target.value })}
                />
              </div>

              <div className="vel-form-group">
                <label className="vel-label">Section Main Heading</label>
                <input
                  type="text"
                  className="vel-input"
                  placeholder="Featured Projects"
                  value={ourWorkSettings.title || ''}
                  onChange={e => setOurWorkSettings({ ...ourWorkSettings, title: e.target.value })}
                />
              </div>

              <div className="vel-form-group">
                <label className="vel-label">Section Subtitle / Description</label>
                <textarea
                  className="vel-textarea"
                  rows={3}
                  placeholder="Explore our portfolio filtered by category. Drag or swipe horizontally to view our vertical reels and widescreen productions."
                  value={ourWorkSettings.subtitle || ''}
                  onChange={e => setOurWorkSettings({ ...ourWorkSettings, subtitle: e.target.value })}
                />
              </div>
            </div>
          </form>

          <div className="cms-section-toolbar">
            <div className="cms-toolbar-left">
              <h2 className="cms-section-title">Our Work Video Showcase</h2>
              <span className="cms-section-hint">
                Add YouTube videos (Standard, Shorts, or embeds). Visitors can filter and play them in the cinematic portfolio.
              </span>
            </div>
            <button
              type="button"
              className="vel-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              onClick={() => setShowAddVideoModal(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add YouTube Video</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="cms-filter-row">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`cms-filter-chip ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {loadingVideos ? (
            <div className="cms-loading-box">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
              <span>Loading video portfolio...</span>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="cms-empty-state">
              <Video className="h-12 w-12 text-zinc-600 mb-3" />
              <h3>No Videos in {filterCategory}</h3>
              <p>Add YouTube videos by clicking "Add YouTube Video" above.</p>
              <button
                type="button"
                className="vel-btn-primary mt-4"
                onClick={() => setShowAddVideoModal(true)}
              >
                Add Video Link
              </button>
            </div>
          ) : (
            <div className="cms-videos-grid">
              {filteredVideos.map((video) => {
                const parsed = parseYouTubeInput(video.youtube_url, video.aspect_ratio);
                const isShort = video.aspect_ratio === '9/16' || parsed?.isVertical;
                const thumb = parsed?.thumbnail || `https://img.youtube.com/vi/${parsed?.videoId}/hqdefault.jpg`;

                return (
                  <div key={video.id} className="cms-video-card">
                    {/* Thumbnail & Aspect Ratio Wrapper */}
                    <div className={`cms-video-thumb-wrap ${isShort ? 'vertical' : 'widescreen'}`}>
                      {parsed?.videoId ? (
                        <img
                          src={thumb}
                          alt={video.title}
                          className="cms-video-thumb-img"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop';
                          }}
                        />
                      ) : (
                        <div className="cms-video-no-thumb">
                          <Play className="h-8 w-8 text-zinc-500" />
                        </div>
                      )}

                      <div className="cms-video-overlay-badges">
                        <span className="cms-badge-category">{video.category || 'REELS'}</span>
                        <span className="cms-badge-ratio">{isShort ? '9:16 Short' : '16:9 4K'}</span>
                      </div>
                    </div>

                    <div className="cms-video-info">
                      <h4 className="cms-video-title" title={video.title}>{video.title}</h4>
                      {video.description && (
                        <p className="cms-video-desc">{video.description}</p>
                      )}

                      <div className="cms-video-meta-row">
                        {video.metric && (
                          <span className="cms-video-metric-tag">{video.metric}</span>
                        )}
                        {video.duration && (
                          <span className="cms-video-duration-tag">{video.duration}</span>
                        )}
                      </div>

                      <div className="cms-video-actions">
                        <a
                          href={video.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cms-action-link"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>View on YouTube</span>
                        </a>

                        <button
                          type="button"
                          className="cms-action-btn-danger"
                          onClick={() => setDeleteVideoConfirm(video)}
                          title="Delete Video"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ADD VIDEO MODAL */}
          {showAddVideoModal && (
            <div className="vel-modal-backdrop" onClick={() => setShowAddVideoModal(false)}>
              <div className="vel-modal-box cms-modal" onClick={e => e.stopPropagation()}>
                <div className="vel-modal-header">
                  <h3 className="vel-modal-title">Add Video to Our Work</h3>
                  <button
                    type="button"
                    className="vel-btn-ghost-icon"
                    onClick={() => setShowAddVideoModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleAddVideo} className="vel-modal-body">
                  <div className="vel-form-group">
                    <label className="vel-label">YouTube Video Link / URL *</label>
                    <input
                      type="text"
                      className="vel-input"
                      placeholder="e.g. https://www.youtube.com/shorts/qouiu4CbHU8 or https://youtu.be/..."
                      value={newVideo.youtube_url}
                      onChange={e => handleYoutubeUrlChange(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>
                      Supports YouTube Shorts, standard watch links, youtu.be, and iframe embed code.
                    </span>
                  </div>

                  {/* Live Thumbnail Preview */}
                  {youtubePreview?.videoId && (
                    <div className="cms-youtube-preview-box">
                      <img
                        src={youtubePreview.thumbnail}
                        alt="Preview"
                        className="cms-youtube-preview-img"
                      />
                      <div className="cms-youtube-preview-text">
                        <span className="cms-youtube-detected-tag">
                          Detected ID: {youtubePreview.videoId} ({youtubePreview.isVertical ? '9:16 Vertical' : '16:9 Horizontal'})
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                          Video thumbnail verified successfully.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="vel-form-group">
                    <label className="vel-label">Video Title *</label>
                    <input
                      type="text"
                      className="vel-input"
                      placeholder="e.g. AI Generative Motion Reel or Commercial"
                      value={newVideo.title}
                      onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vel-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="vel-form-group">
                      <label className="vel-label">Category *</label>
                      <select
                        className="vel-select"
                        value={newVideo.category}
                        onChange={e => setNewVideo({ ...newVideo, category: e.target.value })}
                      >
                        <option value="REELS">REELS (Short Form)</option>
                        <option value="AI ADS">AI ADS (Commercial)</option>
                        <option value="AI STORY">AI STORY (Narrative)</option>
                        <option value="CUSTOM">+ Add Custom Category</option>
                      </select>
                    </div>

                    <div className="vel-form-group">
                      <label className="vel-label">Aspect Ratio</label>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          className={`cms-ratio-btn ${newVideo.aspect_ratio === '9/16' ? 'active' : ''}`}
                          onClick={() => setNewVideo({ ...newVideo, aspect_ratio: '9/16' })}
                        >
                          9:16 Vertical
                        </button>
                        <button
                          type="button"
                          className={`cms-ratio-btn ${newVideo.aspect_ratio === '16/9' ? 'active' : ''}`}
                          onClick={() => setNewVideo({ ...newVideo, aspect_ratio: '16/9' })}
                        >
                          16:9 Widescreen
                        </button>
                      </div>
                    </div>
                  </div>

                  {newVideo.category === 'CUSTOM' && (
                    <div className="vel-form-group">
                      <label className="vel-label">Custom Category Name *</label>
                      <input
                        type="text"
                        className="vel-input"
                        placeholder="e.g. 3D VFX or MUSIC VIDEOS"
                        value={newVideo.custom_category}
                        onChange={e => setNewVideo({ ...newVideo, custom_category: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                  )}

                  <div className="vel-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="vel-form-group">
                      <label className="vel-label">Highlight Tag / Metric (Optional)</label>
                      <input
                        type="text"
                        className="vel-input"
                        placeholder="e.g. AI Powered, 680+ Views, High Retention"
                        value={newVideo.metric}
                        onChange={e => setNewVideo({ ...newVideo, metric: e.target.value })}
                      />
                    </div>
                    <div className="vel-form-group">
                      <label className="vel-label">Duration (Optional)</label>
                      <input
                        type="text"
                        className="vel-input"
                        placeholder="e.g. 0:30 or 1:15"
                        value={newVideo.duration}
                        onChange={e => setNewVideo({ ...newVideo, duration: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="vel-form-group">
                    <label className="vel-label">Description (Optional)</label>
                    <textarea
                      className="vel-textarea"
                      rows={2}
                      placeholder="Brief note about the project or editing technique..."
                      value={newVideo.description}
                      onChange={e => setNewVideo({ ...newVideo, description: e.target.value })}
                    />
                  </div>

                  <div className="vel-modal-footer" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="vel-btn-secondary"
                      onClick={() => setShowAddVideoModal(false)}
                      disabled={savingVideo}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="vel-btn-primary"
                      disabled={savingVideo}
                    >
                      {savingVideo ? 'Publishing...' : 'Add to Portfolio'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* DELETE VIDEO CONFIRMATION */}
          {deleteVideoConfirm && (
            <div className="vel-modal-backdrop" onClick={() => setDeleteVideoConfirm(null)}>
              <div className="vel-modal-box vel-modal-sm" onClick={e => e.stopPropagation()}>
                <div className="vel-modal-header">
                  <h3 className="vel-modal-title">Delete Video?</h3>
                  <button type="button" className="vel-btn-ghost-icon" onClick={() => setDeleteVideoConfirm(null)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="vel-modal-body">
                  <p style={{ color: '#D1D5DB', fontSize: '0.9rem' }}>
                    Are you sure you want to remove <strong>"{deleteVideoConfirm.title}"</strong> from your public Our Work section?
                  </p>
                </div>
                <div className="vel-modal-footer">
                  <button type="button" className="vel-btn-secondary" onClick={() => setDeleteVideoConfirm(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="vel-btn-danger"
                    onClick={() => handleDeleteVideo(deleteVideoConfirm.id)}
                  >
                    Delete Video
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: FOOTER & SITE SETTINGS                                        */}
      {/* ==================================================================== */}
      {activeTab === 'footer' && (
        <div className="cms-tab-content">
          <div className="cms-section-toolbar">
            <div className="cms-toolbar-left">
              <h2 className="cms-section-title">Footer & Global Contact Settings</h2>
              <span className="cms-section-hint">
                Changes saved here will immediately reflect across the footer of every page on the live website.
              </span>
            </div>
            <button
              type="button"
              className="vel-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              onClick={handleSaveFooter}
              disabled={savingFooter}
            >
              <Save className="h-4 w-4" />
              <span>{savingFooter ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveFooter} className="cms-settings-form">
            {/* Card 1: Studio Contact Details */}
            <div className="cms-form-card">
              <div className="cms-form-card-header">
                <div className="cms-form-card-icon">
                  <Phone className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="cms-form-card-title">Studio & Contact Details</h3>
                  <p className="cms-form-card-sub">Phone, email, and studio address displayed in the footer.</p>
                </div>
              </div>

              <div className="cms-form-grid">
                <div className="vel-form-group">
                  <label className="vel-label">Post-Production Studio Location</label>
                  <div className="cms-input-icon-wrap">
                    <MapPin className="h-4 w-4 cms-input-icon" />
                    <input
                      type="text"
                      className="vel-input cms-input-with-icon"
                      placeholder="e.g. Hyderabad, India"
                      value={footerSettings.studio_location || ''}
                      onChange={e => setFooterSettings({ ...footerSettings, studio_location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="vel-form-group">
                  <label className="vel-label">Contact Phone Number</label>
                  <div className="cms-input-icon-wrap">
                    <Phone className="h-4 w-4 cms-input-icon" />
                    <input
                      type="text"
                      className="vel-input cms-input-with-icon"
                      placeholder="e.g. +91 89853 51756"
                      value={footerSettings.phone || ''}
                      onChange={e => setFooterSettings({ ...footerSettings, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="vel-form-group">
                  <label className="vel-label">Contact Email Address</label>
                  <div className="cms-input-icon-wrap">
                    <Mail className="h-4 w-4 cms-input-icon" />
                    <input
                      type="email"
                      className="vel-input cms-input-with-icon"
                      placeholder="e.g. hello@motionnodeedits.com"
                      value={footerSettings.email || ''}
                      onChange={e => setFooterSettings({ ...footerSettings, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="vel-form-group">
                  <label className="vel-label">WhatsApp Number (For Direct Chat & Demos)</label>
                  <div className="cms-input-icon-wrap">
                    <span className="cms-input-icon" style={{ fontSize: '12px', fontWeight: 'bold' }}>WA</span>
                    <input
                      type="text"
                      className="vel-input cms-input-with-icon"
                      placeholder="e.g. 918985351756 (with country code, no +)"
                      value={footerSettings.whatsapp_number || ''}
                      onChange={e => setFooterSettings({ ...footerSettings, whatsapp_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Social Media Profiles */}
            <div className="cms-form-card">
              <div className="cms-form-card-header">
                <div className="cms-form-card-icon">
                  <Globe className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="cms-form-card-title">Official Social Media Profiles</h3>
                  <p className="cms-form-card-sub">Links opened when clicking the footer social icons.</p>
                </div>
              </div>

              <div className="cms-form-grid">
                <div className="vel-form-group">
                  <label className="vel-label">Instagram Profile URL</label>
                  <div className="cms-input-icon-wrap">
                    <Instagram className="h-4 w-4 cms-input-icon text-pink-400" />
                    <input
                      type="url"
                      className="vel-input cms-input-with-icon"
                      placeholder="https://www.instagram.com/motionnodeedits/"
                      value={footerSettings.instagram_url || ''}
                      onChange={e => setFooterSettings({ ...footerSettings, instagram_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="vel-form-group">
                  <label className="vel-label">YouTube Channel URL</label>
                  <div className="cms-input-icon-wrap">
                    <Youtube className="h-4 w-4 cms-input-icon text-red-400" />
                    <input
                      type="url"
                      className="vel-input cms-input-with-icon"
                      placeholder="https://www.youtube.com/@motionnodeedits"
                      value={footerSettings.youtube_url || ''}
                      onChange={e => setFooterSettings({ ...footerSettings, youtube_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="vel-form-group">
                  <label className="vel-label">LinkedIn Page URL</label>
                  <div className="cms-input-icon-wrap">
                    <Linkedin className="h-4 w-4 cms-input-icon text-blue-400" />
                    <input
                      type="url"
                      className="vel-input cms-input-with-icon"
                      placeholder="https://www.linkedin.com/company/motionnodeedits"
                      value={footerSettings.linkedin_url || ''}
                      onChange={e => setFooterSettings({ ...footerSettings, linkedin_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Call To Action & Copyright */}
            <div className="cms-form-card">
              <div className="cms-form-card-header">
                <div className="cms-form-card-icon">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="cms-form-card-title">Call To Action & Legal Bar</h3>
                  <p className="cms-form-card-sub">Top footer banner headline, button label, and copyright notice.</p>
                </div>
              </div>

              <div className="cms-form-grid">
                <div className="vel-form-group">
                  <label className="vel-label">Top Banner Headline</label>
                  <input
                    type="text"
                    className="vel-input"
                    placeholder="Let's Create Something Exceptional."
                    value={footerSettings.headline || ''}
                    onChange={e => setFooterSettings({ ...footerSettings, headline: e.target.value })}
                  />
                </div>

                <div className="vel-form-group">
                  <label className="vel-label">CTA Button Label</label>
                  <input
                    type="text"
                    className="vel-input"
                    placeholder="Start A Project"
                    value={footerSettings.cta_text || ''}
                    onChange={e => setFooterSettings({ ...footerSettings, cta_text: e.target.value })}
                  />
                </div>

                <div className="vel-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="vel-label">Copyright Notice Line</label>
                  <input
                    type="text"
                    className="vel-input"
                    placeholder="© 2026 MotionNodeEdits. All rights reserved."
                    value={footerSettings.copyright_text || ''}
                    onChange={e => setFooterSettings({ ...footerSettings, copyright_text: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Save Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="submit"
                className="vel-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px' }}
                disabled={savingFooter}
              >
                <Save className="h-4 w-4" />
                <span>{savingFooter ? 'Saving Changes...' : 'Save All Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: WHAT WE DO (SERVICES SECTION)                                 */}
      {/* ==================================================================== */}
      {activeTab === 'services' && (
        <div className="cms-tab-content">
          <div className="cms-section-toolbar">
            <div className="cms-toolbar-left">
              <h2 className="cms-section-title">What We Do (Services Section)</h2>
              <span className="cms-section-hint">
                Customize the main heading, subtitle, and service cards displayed on the homepage.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="vel-btn-secondary"
                onClick={loadServicesSettings}
                disabled={loadingServices}
                title="Refresh from Database"
              >
                <RefreshCw className={`h-4 w-4 ${loadingServices ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                className="vel-btn-primary"
                onClick={() => setShowAddServiceModal(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Add Service Card</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: HEADER & COPY CONFIG */}
          <form onSubmit={handleSaveServicesHeader} className="cms-section-card" style={{ marginBottom: '24px' }}>
            <div className="cms-section-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="cms-card-heading">Section Header & Description</h3>
                  <p className="cms-card-subheading">Control the eyebrow text, title, and descriptive intro.</p>
                </div>
              </div>
              <button
                type="submit"
                className="vel-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                disabled={savingServices}
              >
                <Save className="h-4 w-4" />
                <span>{savingServices ? 'Saving...' : 'Save Header'}</span>
              </button>
            </div>

            <div className="cms-form-grid" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="vel-form-group">
                <label className="vel-label">Section Eyebrow (Small Top Tag)</label>
                <input
                  type="text"
                  className="vel-input"
                  placeholder="WHAT WE DO"
                  value={servicesSettings.eyebrow || ''}
                  onChange={e => setServicesSettings({ ...servicesSettings, eyebrow: e.target.value })}
                />
              </div>

              <div className="vel-form-group">
                <label className="vel-label">Section Main Heading</label>
                <input
                  type="text"
                  className="vel-input"
                  placeholder="Every frame. Intentional."
                  value={servicesSettings.title || ''}
                  onChange={e => setServicesSettings({ ...servicesSettings, title: e.target.value })}
                />
              </div>

              <div className="vel-form-group">
                <label className="vel-label">Section Subtitle / Description</label>
                <textarea
                  className="vel-textarea"
                  rows={3}
                  placeholder="We combine professional visual direction with cutting-edge production..."
                  value={servicesSettings.subtitle || ''}
                  onChange={e => setServicesSettings({ ...servicesSettings, subtitle: e.target.value })}
                />
              </div>
            </div>
          </form>

          {/* SECTION 2: SERVICES CARDS */}
          <div className="cms-section-card">
            <div className="cms-section-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="cms-card-heading">Service Cards</h3>
                  <p className="cms-card-subheading">
                    Showing {(servicesSettings.items || []).filter(i => i.is_active !== false).length} active cards on live website.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              {(servicesSettings.items || []).length === 0 ? (
                <div className="cms-empty-state">
                  <h3>No Service Cards Found</h3>
                  <p>Click "Add Service Card" above to add your first service spotlight.</p>
                </div>
              ) : (
                <div className="cms-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {(servicesSettings.items || []).map((card) => {
                    const IconComp = CMS_SERVICE_ICONS[card.icon] || Film;
                    const cardColor = card.color || '#FFFFFF';

                    return (
                      <div key={card.id || card.title} className="cms-item-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="cms-item-header" style={{ alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: '8px',
                              background: `${cardColor}15`,
                              border: `1px solid ${cardColor}30`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <IconComp size={18} style={{ color: cardColor }} />
                            </div>
                            <div>
                              <h4 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                                {card.title}
                              </h4>
                              <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                                Icon: {card.icon || 'Film'} • <span style={{ color: cardColor }}>●</span> Color
                              </span>
                            </div>
                          </div>
                        </div>

                        <p style={{
                          color: '#A1A1AA',
                          fontSize: '0.85rem',
                          lineHeight: 1.5,
                          margin: '14px 0 18px 0',
                          flexGrow: 1
                        }}>
                          {card.description}
                        </p>

                        <div className="cms-item-footer">
                          <button
                            type="button"
                            className={`cms-toggle-pill ${card.is_active !== false ? 'active' : 'inactive'}`}
                            onClick={() => handleToggleServiceActive(card.id || card.title)}
                            title="Click to toggle visibility on website"
                          >
                            {card.is_active !== false ? '● Live on Site' : '○ Hidden'}
                          </button>

                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="cms-action-btn-secondary"
                              onClick={() => handleOpenEditServiceItem(card)}
                              title="Edit Service"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              className="cms-action-btn-danger"
                              onClick={() => setDeleteServiceConfirm(card)}
                              title="Delete Service"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ADD SERVICE MODAL */}
          {showAddServiceModal && (
            <div className="vel-modal-backdrop" onClick={() => setShowAddServiceModal(false)}>
              <div className="vel-modal-box cms-modal" onClick={e => e.stopPropagation()}>
                <div className="vel-modal-header">
                  <h3 className="vel-modal-title">Add New Service Card</h3>
                  <button
                    type="button"
                    className="vel-btn-ghost-icon"
                    onClick={() => setShowAddServiceModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleAddServiceItem} className="vel-modal-body">
                  <div className="vel-form-group">
                    <label className="vel-label">Service Title *</label>
                    <input
                      type="text"
                      className="vel-input"
                      placeholder="e.g. 3D Motion Graphics"
                      value={newServiceItem.title}
                      onChange={e => setNewServiceItem({ ...newServiceItem, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vel-form-group">
                    <label className="vel-label">Select Icon</label>
                    <div className="cms-icon-selector-grid">
                      {Object.keys(CMS_SERVICE_ICONS).map((iconKey) => {
                        const IconComponent = CMS_SERVICE_ICONS[iconKey];
                        const isSelected = (newServiceItem.icon || 'Film') === iconKey;
                        return (
                          <button
                            key={iconKey}
                            type="button"
                            className={`cms-icon-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => setNewServiceItem({ ...newServiceItem, icon: iconKey })}
                            title={iconKey}
                          >
                            <IconComponent size={18} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="vel-form-group">
                    <label className="vel-label">Accent Color</label>
                    <div className="cms-color-swatches">
                      {CMS_COLOR_PRESETS.map((colorHex) => (
                        <div
                          key={colorHex}
                          className={`cms-color-swatch ${newServiceItem.color === colorHex ? 'selected' : ''}`}
                          style={{ backgroundColor: colorHex }}
                          onClick={() => setNewServiceItem({ ...newServiceItem, color: colorHex })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="vel-form-group">
                    <label className="vel-label">Description *</label>
                    <textarea
                      className="vel-textarea"
                      rows={3}
                      placeholder="Highlight what makes this service stand out..."
                      value={newServiceItem.description}
                      onChange={e => setNewServiceItem({ ...newServiceItem, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vel-modal-footer" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="vel-btn-secondary"
                      onClick={() => setShowAddServiceModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="vel-btn-primary"
                    >
                      Publish Card
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT SERVICE MODAL */}
          {editingServiceItem && (
            <div className="vel-modal-backdrop" onClick={() => setEditingServiceItem(null)}>
              <div className="vel-modal-box cms-modal" onClick={e => e.stopPropagation()}>
                <div className="vel-modal-header">
                  <h3 className="vel-modal-title">Edit Service Card</h3>
                  <button
                    type="button"
                    className="vel-btn-ghost-icon"
                    onClick={() => setEditingServiceItem(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditServiceItem} className="vel-modal-body">
                  <div className="vel-form-group">
                    <label className="vel-label">Service Title *</label>
                    <input
                      type="text"
                      className="vel-input"
                      value={editingServiceItem.title}
                      onChange={e => setEditingServiceItem({ ...editingServiceItem, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vel-form-group">
                    <label className="vel-label">Select Icon</label>
                    <div className="cms-icon-selector-grid">
                      {Object.keys(CMS_SERVICE_ICONS).map((iconKey) => {
                        const IconComponent = CMS_SERVICE_ICONS[iconKey];
                        const isSelected = (editingServiceItem.icon || 'Film') === iconKey;
                        return (
                          <button
                            key={iconKey}
                            type="button"
                            className={`cms-icon-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => setEditingServiceItem({ ...editingServiceItem, icon: iconKey })}
                            title={iconKey}
                          >
                            <IconComponent size={18} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="vel-form-group">
                    <label className="vel-label">Accent Color</label>
                    <div className="cms-color-swatches">
                      {CMS_COLOR_PRESETS.map((colorHex) => (
                        <div
                          key={colorHex}
                          className={`cms-color-swatch ${editingServiceItem.color === colorHex ? 'selected' : ''}`}
                          style={{ backgroundColor: colorHex }}
                          onClick={() => setEditingServiceItem({ ...editingServiceItem, color: colorHex })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="vel-form-group">
                    <label className="vel-label">Description *</label>
                    <textarea
                      className="vel-textarea"
                      rows={3}
                      value={editingServiceItem.description}
                      onChange={e => setEditingServiceItem({ ...editingServiceItem, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vel-modal-footer" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="vel-btn-secondary"
                      onClick={() => setEditingServiceItem(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="vel-btn-primary"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* DELETE SERVICE CONFIRMATION MODAL */}
          {deleteServiceConfirm && (
            <div className="vel-modal-backdrop" onClick={() => setDeleteServiceConfirm(null)}>
              <div className="vel-modal-box vel-modal-sm" onClick={e => e.stopPropagation()}>
                <div className="vel-modal-header">
                  <h3 className="vel-modal-title">Delete Service Card?</h3>
                  <button
                    type="button"
                    className="vel-btn-ghost-icon"
                    onClick={() => setDeleteServiceConfirm(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="vel-modal-body">
                  <p style={{ color: '#D1D5DB', fontSize: '0.9rem' }}>
                    Are you sure you want to delete the <strong>{deleteServiceConfirm.title}</strong> service card?
                  </p>
                </div>
                <div className="vel-modal-footer">
                  <button
                    type="button"
                    className="vel-btn-secondary"
                    onClick={() => setDeleteServiceConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="vel-btn-danger"
                    onClick={() => handleDeleteServiceItem(deleteServiceConfirm.id || deleteServiceConfirm.title)}
                  >
                    Delete Card
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
