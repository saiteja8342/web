import React, { useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export default function AddEditorModal({
  showAddEditorModal,
  setShowAddEditorModal,
  handleAddNewEditorSubmit,
  newEditorForm,
  setNewEditorForm
}) {
  useEffect(() => {
    if (!showAddEditorModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAddEditorModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddEditorModal, setShowAddEditorModal]);

  if (!showAddEditorModal) return null;

  return (
    <div className="vel-modal-backdrop" onClick={() => setShowAddEditorModal(false)}>
      <div
        className="vel-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-editor-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vel-modal-head">
          <div>
            <h3 id="add-editor-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>Add New Editor</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--vel-text-secondary)', marginTop: '2px' }}>
              Register a creator into the MotionNode production studio roster.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddEditorModal(false)}
            aria-label="Close modal"
            style={{ background: 'transparent', border: 'none', color: 'var(--vel-text-tertiary)', cursor: 'pointer' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleAddNewEditorSubmit}>
          <div className="vel-modal-body">
            <div className="vel-field-group">
              <label className="vel-label">Editor Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., Lucas Romero"
                className="vel-input"
                value={newEditorForm.name}
                onChange={(e) => setNewEditorForm({ ...newEditorForm, name: e.target.value })}
              />
            </div>

            <div className="vel-form-grid-2">
              <div className="vel-field-group">
                <label className="vel-label">Primary Specialty</label>
                <select
                  className="vel-select"
                  value={newEditorForm.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    let role = 'Senior Editor';
                    let tagline = '';
                    let skills = '';
                    if (cat === 'AI Video Editor') {
                      role = 'AI Video Synthesis & Neural VFX Lead';
                      tagline = 'Runway Gen-3, Midjourney v6 & Neural Upscaling';
                      skills = 'Runway Gen-3, Midjourney, Topaz AI, After Effects';
                    } else if (cat === 'Motion Graphics') {
                      role = 'Lead Motion Graphics & 3D Designer';
                      tagline = 'Kinetic Typography, Cinema 4D & Dynamic UI Motion';
                      skills = 'Cinema 4D, After Effects, Premiere Pro, Sound Design';
                    } else if (cat === 'Graphic Designer') {
                      role = 'Senior Graphic Designer & Key Visuals Lead';
                      tagline = 'High-CTR YouTube Thumbnails, Key Visuals & Brand Posters';
                      skills = 'Photoshop, Figma, Midjourney v6, Illustrator';
                    } else if (cat === 'Short-Form Specialist') {
                      role = 'Short-Form & Viral Content Specialist';
                      tagline = 'High-Retention TikToks, Instagram Reels & Hook Mastery';
                      skills = 'CapCut Pro, Retention Pacing, Speed Ramps, Subtitles';
                    } else if (cat === 'Colorist') {
                      role = 'Senior Colorist & Master Finisher';
                      tagline = 'ACES Color Pipelines, 35mm Film Emulation & HDR10';
                      skills = 'DaVinci Resolve Studio, FilmConvert, Dehancer Pro';
                    }
                    setNewEditorForm({ ...newEditorForm, category: cat, role, tagline, skills });
                  }}
                >
                  <option value="AI Video Editor">AI Video Editor</option>
                  <option value="Motion Graphics">Motion Graphics Designer</option>
                  <option value="Graphic Designer">Graphic Designer</option>
                  <option value="Short-Form Specialist">Short-Form Specialist</option>
                  <option value="Colorist">Colorist</option>
                </select>
              </div>

              <div className="vel-field-group">
                <label className="vel-label">Max Order Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="vel-input"
                  value={newEditorForm.maxOrders}
                  onChange={(e) => setNewEditorForm({ ...newEditorForm, maxOrders: e.target.value })}
                />
              </div>
            </div>

            <div className="vel-field-group">
              <label className="vel-label">Professional Role Title</label>
              <input
                type="text"
                className="vel-input"
                value={newEditorForm.role}
                onChange={(e) => setNewEditorForm({ ...newEditorForm, role: e.target.value })}
              />
            </div>

            <div className="vel-field-group">
              <label className="vel-label">Specialty Tagline Description</label>
              <input
                type="text"
                placeholder="e.g., Runway Gen-3, Midjourney v6 & Neural Upscaling"
                className="vel-input"
                value={newEditorForm.tagline}
                onChange={(e) => setNewEditorForm({ ...newEditorForm, tagline: e.target.value })}
              />
            </div>

            <div className="vel-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="vel-label">Key Skills & Tooling (Comma Separated)</label>
                <span style={{ fontSize: '0.65rem', color: 'var(--vel-text-tertiary)' }}>Tools</span>
              </div>
              <input
                type="text"
                placeholder="Runway Gen-3, Midjourney, After Effects, Topaz AI"
                className="vel-input"
                value={newEditorForm.skills}
                onChange={(e) => setNewEditorForm({ ...newEditorForm, skills: e.target.value })}
              />
            </div>

            <div className="vel-field-group">
              <label className="vel-label">Status</label>
              <select
                className="vel-select"
                value={newEditorForm.status}
                onChange={(e) => setNewEditorForm({ ...newEditorForm, status: e.target.value })}
              >
                <option value="AVAILABLE">AVAILABLE (Accepting Projects)</option>
                <option value="AT CAPACITY">AT CAPACITY (Busy)</option>
              </select>
            </div>
          </div>

          <div className="vel-modal-foot">
            <button
              type="button"
              className="vel-btn-outline"
              onClick={() => setShowAddEditorModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="vel-btn-solid">
              <Plus className="h-4 w-4" />
              <span>Register Editor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
