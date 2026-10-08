import React from 'react';
import {
  FileText,
  Mail,
  Send,
  Users,
  Clapperboard,
  Paperclip,
  Calendar,
  Plus,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  Check
} from 'lucide-react';

export default function AdminEditorManager({
  activeNav,
  setActiveNav,
  mgmtTab,
  setMgmtTab,
  handleNavClick,
  orders = [],
  clientsList = [],
  editorsList = [],
  assignForm,
  setAssignForm,
  handleAssignProjectSubmit,
  showToast,
  createForm,
  setCreateForm,
  handleCreateOrderSubmit,
  setShowAddEditorModal,
  searchQuery,
  setSearchQuery,
  editorStatusFilter,
  setEditorStatusFilter,
  showSortMenu,
  setShowSortMenu,
  editorSortBy,
  setEditorSortBy,
  editorCategoryFilter,
  setEditorCategoryFilter,
  filteredEditors = [],
  expandedEditor,
  setExpandedEditor
}) {
  return (
    <>
      {/* ============================================================== */}
      {/* VIEW 2: PROJECT ASSIGNMENT                                     */}
      {/* ============================================================== */}
      {activeNav === 'assign' && (
        <>
          <div className="vel-page-header">
            <h1 className="vel-page-h1">Assign Project</h1>
            <p className="vel-page-sub">Route editing tasks to the optimal studio personnel.</p>
          </div>

          <form onSubmit={handleAssignProjectSubmit} className="vel-assign-layout">
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="vel-card">
                <div className="vel-card-head">
                  <span className="vel-card-title-sm">PROJECT DETAILS</span>
                  <FileText className="h-4 w-4 text-white/40" />
                </div>

                {(() => {
                  const clientEligibleProjects = orders
                    .filter(o => o.dbStatus !== 'delivered')
                    .filter(o => {
                      if (!assignForm.client) return false;
                      const selectedClientObj = clientsList.find(c => c.name === assignForm.client);
                      if (selectedClientObj && o.clientId && o.clientId === selectedClientObj.id) {
                        return true;
                      }
                      return (o.client || '').toLowerCase() === assignForm.client.toLowerCase();
                    });

                  return (
                    <div className="vel-form-grid-2">
                      <div className="vel-field-group">
                        <label className="vel-label">Select Client</label>
                        <select
                          className="vel-select"
                          value={assignForm.client}
                          onChange={(e) => {
                            const clientName = e.target.value;
                            setAssignForm(prev => ({
                              ...prev,
                              client: clientName,
                              project: '',
                              orderId: '',
                              clientDeadline: '',
                              internalDeadline: '',
                              brief: '',
                            }));
                          }}
                        >
                          <option value="">-- Choose Client --</option>
                          {clientsList.map((cl) => (
                            <option key={cl.id} value={cl.name}>
                              {cl.name} {cl.company ? `(${cl.company})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="vel-field-group">
                        <label className="vel-label">Select Project</label>
                        <select
                          className="vel-select"
                          value={assignForm.project}
                          onChange={(e) => {
                            const selectedTitle = e.target.value;
                            const matched = clientEligibleProjects.find(o => o.title === selectedTitle);
                            setAssignForm(prev => ({
                              ...prev,
                              project: selectedTitle,
                              orderId: matched?.dbId || matched?.id || '',
                              client: matched?.client || prev.client,
                              clientDeadline: matched?.clientDeadline || '',
                              internalDeadline: matched?.editorDeadline || '',
                              brief: matched?.notes || prev.brief,
                            }));
                          }}
                          disabled={!assignForm.client}
                          style={{
                            opacity: !assignForm.client ? 0.6 : 1,
                            cursor: !assignForm.client ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {!assignForm.client ? (
                            <option value="">-- Select Client First --</option>
                          ) : clientEligibleProjects.length === 0 ? (
                            <option value="">-- No Active Projects for this Client --</option>
                          ) : (
                            <>
                              <option value="">-- Choose Project ({clientEligibleProjects.length} available) --</option>
                              {clientEligibleProjects.map((ord) => (
                                <option key={ord.id} value={ord.title}>
                                  [{ord.displayId}] {ord.title} {ord.type ? `(${ord.type})` : ''} {ord.editor.name !== 'Unassigned' ? `• Assigned: ${ord.editor.name}` : '• Unassigned'}
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                        {Boolean(assignForm.client && clientEligibleProjects.length === 0) && (
                          <span style={{ fontSize: '0.68rem', color: '#FCD34D', marginTop: '4px', display: 'block' }}>
                            This client currently has no active (uncompleted) projects.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="vel-card">
                <div className="vel-card-head">
                  <span className="vel-card-title-sm">RESOURCE ALLOCATION</span>
                  <div className="vel-toggle-wrap">
                    <span>Auto-suggest</span>
                    <label className="vel-switch">
                      <input
                        type="checkbox"
                        checked={assignForm.autoSuggest}
                        onChange={(e) => setAssignForm({ ...assignForm, autoSuggest: e.target.checked })}
                      />
                      <span className="vel-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="vel-field-group">
                  <label className="vel-label">Assigned Editor</label>
                  <select
                    className="vel-select"
                    value={assignForm.editorId || ''}
                    onChange={(e) => {
                      const edId = e.target.value;
                      const matchedEd = editorsList.find(ed => String(ed.id) === String(edId));
                      setAssignForm(prev => ({
                        ...prev,
                        editorId: edId,
                        editor: matchedEd?.name || '',
                      }));
                    }}
                  >
                    <option value="">-- Select Editor --</option>
                    {editorsList.map((ed) => (
                      <option key={ed.id} value={ed.id}>
                        {ed.name} ({ed.role || ed.category}) — {ed.activeOrders}/{ed.maxOrders} Active
                      </option>
                    ))}
                  </select>
                </div>

                <div className="vel-form-grid-2">
                  <div className="vel-field-group">
                    <label className="vel-label">
                      Client Deadline <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="vel-input"
                      value={assignForm.clientDeadline}
                      onChange={(e) => setAssignForm({ ...assignForm, clientDeadline: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vel-field-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="vel-label">
                        Internal Editor Deadline <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <span style={{ fontSize: '0.62rem', color: '#22C55E', letterSpacing: '0.05em', fontWeight: 700 }}>REQUIRED</span>
                    </div>
                    <input
                      type="date"
                      className="vel-input"
                      value={assignForm.internalDeadline}
                      onChange={(e) => setAssignForm({ ...assignForm, internalDeadline: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Brief & Notes */}
            <div className="vel-card" style={{ height: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="vel-card-head">
                  <span className="vel-card-title-sm">BRIEF & NOTES</span>
                  <FileText className="h-4 w-4 text-white/40" />
                </div>

                <textarea
                  className="vel-textarea"
                  placeholder="Enter specific instructions, reference links, or focus areas for the editor..."
                  value={assignForm.brief}
                  onChange={(e) => setAssignForm({ ...assignForm, brief: e.target.value })}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#121217', borderRadius: '8px', border: '1px solid var(--vel-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail className="h-4 w-4 text-white/60" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Notify Editor</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--vel-text-secondary)' }}>Send automated slack & email brief</span>
                    </div>
                  </div>

                  <label className="vel-switch">
                    <input
                      type="checkbox"
                      checked={assignForm.notifyEditor}
                      onChange={(e) => setAssignForm({ ...assignForm, notifyEditor: e.target.checked })}
                    />
                    <span className="vel-slider"></span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="vel-btn-solid">
                  <Send className="h-4 w-4" />
                  <span>Assign Project</span>
                </button>
                <button type="button" className="vel-btn-outline" onClick={() => showToast && showToast('Draft saved successfully.')}>
                  Save as Draft
                </button>
              </div>
            </div>
          </form>
        </>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: ORDER CREATION                                         */}
      {/* ============================================================== */}
      {activeNav === 'create' && (
        <>
          <div className="vel-page-header">
            <h1 className="vel-page-h1">New Project Initialization</h1>
            <p className="vel-page-sub">Configure client details, project scope, and deadlines.</p>
          </div>

          <form onSubmit={handleCreateOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="vel-card">
              <div className="vel-card-head">
                <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users className="h-4 w-4" />
                  <span>Client Identity</span>
                </span>
              </div>

              <div className="vel-field-group">
                <label className="vel-label">Select Client</label>
                <select
                  className="vel-select"
                  value={createForm.existingClient}
                  onChange={(e) => setCreateForm({ ...createForm, existingClient: e.target.value })}
                  required
                >
                  <option value="">-- Choose Client --</option>
                  {clientsList.map((cl) => (
                    <option key={cl.id} value={cl.name}>
                      {cl.name} {cl.company ? `(${cl.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="vel-card">
              <div className="vel-card-head">
                <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clapperboard className="h-4 w-4" />
                  <span>Project Scope</span>
                </span>
              </div>

              <div className="vel-form-grid-2">
                <div className="vel-field-group">
                  <label className="vel-label">Project Nomenclature</label>
                  <input
                    type="text"
                    placeholder="e.g., Q3 Product Launch Reel"
                    className="vel-input"
                    value={createForm.nomenclature}
                    onChange={(e) => setCreateForm({ ...createForm, nomenclature: e.target.value })}
                    required
                  />
                </div>

                <div className="vel-field-group">
                  <label className="vel-label">Format / Platform</label>
                  <select
                    className="vel-select"
                    value={createForm.format}
                    onChange={(e) => setCreateForm({ ...createForm, format: e.target.value })}
                  >
                    <option value="YouTube Longform (16:9)">YouTube Longform (16:9)</option>
                    <option value="Instagram / TikTok Reel (9:16)">Instagram / TikTok Reel (9:16)</option>
                    <option value="Commercial 4K Broadcast">Commercial 4K Broadcast</option>
                    <option value="Square Social Ad (1:1)">Square Social Ad (1:1)</option>
                  </select>
                </div>
              </div>

              <div className="vel-field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="vel-label">Creative Brief & Instructions</label>
                  <span style={{ fontSize: '0.65rem', color: 'var(--vel-text-tertiary)' }}>Markdown Supported</span>
                </div>
                <textarea
                  className="vel-textarea"
                  style={{ minHeight: '120px' }}
                  placeholder="Detail the pacing, mood, reference videos, and specific editing requirements..."
                  value={createForm.brief}
                  onChange={(e) => setCreateForm({ ...createForm, brief: e.target.value })}
                />
              </div>
            </div>

            <div className="vel-form-grid-2">
              <div className="vel-card">
                <div className="vel-card-head">
                  <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Paperclip className="h-4 w-4" />
                    <span>Asset Ingestion</span>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Raw Footage Link (Google Drive, Dropbox, Mega)"
                    className="vel-input"
                    value={createForm.rawFootageLink}
                    onChange={(e) => setCreateForm({ ...createForm, rawFootageLink: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Brand Assets / LUTs / Graphics Link (Optional)"
                    className="vel-input"
                    value={createForm.brandAssetsLink}
                    onChange={(e) => setCreateForm({ ...createForm, brandAssetsLink: e.target.value })}
                  />
                </div>
              </div>

              <div className="vel-card">
                <div className="vel-card-head">
                  <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar className="h-4 w-4" />
                    <span>Timeline Tracker</span>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="vel-field-group">
                    <label className="vel-label">Internal Editor Deadline</label>
                    <input
                      type="date"
                      className="vel-input"
                      value={createForm.internalDeadline}
                      onChange={(e) => setCreateForm({ ...createForm, internalDeadline: e.target.value })}
                    />
                  </div>

                  <div className="vel-field-group">
                    <label className="vel-label">Client Delivery Date</label>
                    <input
                      type="date"
                      className="vel-input"
                      value={createForm.clientDeadline}
                      onChange={(e) => setCreateForm({ ...createForm, clientDeadline: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button type="button" className="vel-btn-outline" onClick={() => handleNavClick('home')}>
                Cancel
              </button>
              <button type="submit" className="vel-btn-solid">
                <span>Create Order</span>
                <span>→</span>
              </button>
            </div>
          </form>
        </>
      )}

      {/* ============================================================== */}
      {/* VIEW: EDITORS MANAGEMENT                                       */}
      {/* ============================================================== */}
      {activeNav === 'editors' && (
        <>
          <div className="vel-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 className="vel-page-h1">Management</h1>
              <p className="vel-page-sub">Oversee editor workloads, track specialities, and manage studio resource allocation.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: '#121217', padding: '3px', borderRadius: '8px', border: '1px solid var(--vel-border)' }}>
                <button
                  onClick={() => { setActiveNav && setActiveNav('editors'); setMgmtTab && setMgmtTab('editors'); }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    background: mgmtTab === 'editors' ? '#262633' : 'transparent',
                    color: mgmtTab === 'editors' ? '#FFFFFF' : 'var(--vel-text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Editors ({editorsList.length})
                </button>
                <button
                  onClick={() => { setActiveNav && setActiveNav('clients'); setMgmtTab && setMgmtTab('clients'); }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    background: mgmtTab === 'clients' ? '#262633' : 'transparent',
                    color: mgmtTab === 'clients' ? '#FFFFFF' : 'var(--vel-text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Clients ({clientsList.length})
                </button>
              </div>

              <button
                className="vel-btn-solid"
                onClick={() => setShowAddEditorModal(true)}
                style={{ padding: '7px 16px', fontSize: '0.8rem' }}
              >
                <Plus className="h-4 w-4" />
                <span>Add New Editor</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search className="h-4 w-4" style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--vel-text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search editors by name, role (e.g. AI, Motion, Graphics), or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="vel-input"
                style={{ paddingLeft: '40px' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '12px', top: '10px', background: 'transparent', border: 'none', color: 'var(--vel-text-tertiary)', cursor: 'pointer' }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              className={`vel-btn-outline ${editorStatusFilter !== 'ALL' ? 'active' : ''}`}
              onClick={() => {
                const next = editorStatusFilter === 'ALL' ? 'AVAILABLE' : editorStatusFilter === 'AVAILABLE' ? 'AT CAPACITY' : 'ALL';
                setEditorStatusFilter(next);
                showToast && showToast(`Status filter: ${next}`);
              }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Status: {editorStatusFilter}</span>
            </button>

            <div className="vel-sort-container">
              <button
                className="vel-btn-outline"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>
                  {editorSortBy === 'workload-asc' ? 'Least Busy' :
                   editorSortBy === 'workload-desc' ? 'Most Active' :
                   editorSortBy === 'rating' ? 'Top Rated' : 'Name A-Z'}
                </span>
                <ChevronDown className="h-3 w-3 text-white/40" />
              </button>

              {showSortMenu && (
                <div className="vel-sort-menu">
                  {[
                    { key: 'workload-asc', label: 'Lowest Workload (Least Busy)' },
                    { key: 'workload-desc', label: 'Highest Workload (Most Active)' },
                    { key: 'rating', label: 'Highest Rating (★ 5.0)' },
                    { key: 'name-asc', label: 'Alphabetical (A - Z)' },
                  ].map(st => (
                    <button
                      key={st.key}
                      className={`vel-sort-item ${editorSortBy === st.key ? 'active' : ''}`}
                      onClick={() => {
                        setEditorSortBy(st.key);
                        setShowSortMenu(false);
                        showToast && showToast(`Sorted by ${st.label}`);
                      }}
                    >
                      <span>{st.label}</span>
                      {editorSortBy === st.key && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Specialty Filter Pills Bar */}
          <div className="vel-filter-bar">
            {[
              { key: 'ALL', label: 'All Specialties' },
              { key: 'AI Video Editor', label: 'AI Video Editor' },
              { key: 'Motion Graphics', label: 'Motion Graphics' },
              { key: 'Graphic Designer', label: 'Graphic Designer' },
              { key: 'Short-Form Specialist', label: 'Short-Form / Reels' },
              { key: 'Colorist', label: 'Colorist' },
            ].map(cat => (
              <button
                key={cat.key}
                className={`vel-filter-pill ${editorCategoryFilter === cat.key ? 'active' : ''}`}
                onClick={() => setEditorCategoryFilter(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Editors List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredEditors.length === 0 ? (
              <div className="vel-card" style={{ padding: '40px', textAlign: 'center', alignItems: 'center', gap: '12px' }}>
                <Users className="h-8 w-8 text-white/30" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>No editors match your filters</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--vel-text-secondary)', maxWidth: '380px' }}>
                  Try adjusting your search query "{searchQuery}" or reset the category filter.
                </p>
                <button
                  className="vel-btn-solid"
                  style={{ marginTop: '8px' }}
                  onClick={() => { setSearchQuery(''); setEditorCategoryFilter('ALL'); setEditorStatusFilter('ALL'); }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredEditors.map((ed) => (
                <div
                  key={ed.id}
                  style={{
                    background: 'var(--vel-bg-card)',
                    border: '1px solid var(--vel-border)',
                    borderRadius: '12px',
                    padding: '18px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s'
                  }}
                  onClick={() => setExpandedEditor(expandedEditor === ed.id ? null : ed.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img
                        src={ed.avatar}
                        alt={ed.name}
                        style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--vel-border)' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF' }}>{ed.name}</span>
                          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.15)', fontWeight: 600 }}>
                            {ed.category}
                          </span>
                          {ed.rating && (
                            <span style={{ fontSize: '0.72rem', color: '#EAB308', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                              ★ {ed.rating}
                            </span>
                          )}
                        </div>
                        <div className="vel-editor-tagline">{ed.tagline || ed.role}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: ed.statusColor, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontWeight: 700 }}>
                          <span>•</span>
                          <span>{ed.status}</span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--vel-text-secondary)', marginTop: '2px' }}>
                          WORKLOAD: <strong style={{ color: '#FFFFFF' }}>{ed.activeOrders} / {ed.maxOrders} Active</strong>
                        </div>
                      </div>

                      <ChevronDown
                        className="h-4 w-4 text-white/40"
                        style={{ transform: expandedEditor === ed.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                      />
                    </div>
                  </div>

                  {/* Expanded Details Drawer */}
                  {expandedEditor === ed.id && (
                    <div style={{ paddingTop: '14px', borderTop: '1px solid var(--vel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--vel-text-tertiary)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          PRIMARY DESIGN SPECIALIZATION & ROLE
                        </span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF' }}>{ed.role}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {ed.skills.map((sk, i) => (
                          <span key={i} className="vel-tag-skill">
                            {sk}
                          </span>
                        ))}
                      </div>

                      <button
                        className="vel-btn-solid"
                        style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignForm(prev => ({ ...prev, editor: ed.name }));
                          handleNavClick('assign');
                        }}
                      >
                        Assign Project
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}
