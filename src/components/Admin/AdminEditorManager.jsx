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
  Check,
  Receipt,
  Eye,
  Package
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
  setExpandedEditor,
  selectedEditorModal,
  setSelectedEditorModal
}) {
  const handleClientSelectionChange = (clientName) => {
    if (clientName === '__OFFLINE__') {
      setCreateForm((prev) => ({
        ...prev,
        clientMode: 'offline',
        existingClient: '__OFFLINE__',
      }));
      return;
    }

    if (!clientName) {
      setCreateForm((prev) => ({
        ...prev,
        clientMode: 'registered',
        existingClient: '',
        selectedProjectId: '',
      }));
      return;
    }

    const foundClient = clientsList.find(
      (cl) => cl.name === clientName || cl.company === clientName
    );

    const defaultName = foundClient?.company
      ? `${foundClient.company} Video Project`
      : foundClient?.name
      ? `${foundClient.name}'s Project`
      : '';

    setCreateForm((prev) => ({
      ...prev,
      clientMode: 'registered',
      existingClient: clientName,
      nomenclature: prev.nomenclature || defaultName,
    }));
  };

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
                  const allActiveProjects = orders.filter(o => o.dbStatus !== 'delivered');
                  const clientEligibleProjects = allActiveProjects.filter(o => {
                    if (!assignForm.client) return true;
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
                          <option value="">-- Choose Client (or select Project directly) --</option>
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
                            const matched = allActiveProjects.find(o => o.title === selectedTitle);
                            setAssignForm(prev => ({
                              ...prev,
                              project: selectedTitle,
                              orderId: matched?.dbId || matched?.id || '',
                              client: matched?.client || prev.client,
                              clientDeadline: matched?.clientDeadline || '',
                              internalDeadline: matched?.editorDeadline || '',
                              brief: matched?.brief || matched?.notes || prev.brief,
                            }));
                          }}
                        >
                          {clientEligibleProjects.length === 0 ? (
                            <option value="">-- No Active Projects Found --</option>
                          ) : (
                            <>
                              <option value="">
                                {assignForm.client
                                  ? `-- Choose Project (${clientEligibleProjects.length} for ${assignForm.client}) --`
                                  : `-- Choose Any Active Project (${clientEligibleProjects.length} available) --`}
                              </option>
                              {clientEligibleProjects.map((ord) => (
                                <option key={ord.id} value={ord.title}>
                                  [{ord.displayId}] {ord.title} {ord.type ? `(${ord.type})` : ''} {ord.editor?.name && ord.editor.name !== 'Unassigned' ? `• Assigned: ${ord.editor.name}` : '• Unassigned'}
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
                        onChange={(e) => {
                          const checked = e.target.checked;
                          let nextEditorId = assignForm.editorId;
                          let nextEditorName = assignForm.editor;
                          if (checked && (!nextEditorId || nextEditorId === '')) {
                            const sorted = [...editorsList].sort((a, b) => {
                              const aAvail = (a.maxOrders || 5) - (a.activeOrders || 0);
                              const bAvail = (b.maxOrders || 5) - (b.activeOrders || 0);
                              return bAvail - aAvail;
                            });
                            const best = sorted.find(ed => (ed.activeOrders || 0) < (ed.maxOrders || 5)) || sorted[0];
                            if (best) {
                              nextEditorId = best.id;
                              nextEditorName = best.name;
                            }
                          }
                          setAssignForm(prev => ({
                            ...prev,
                            autoSuggest: checked,
                            editorId: nextEditorId,
                            editor: nextEditorName,
                          }));
                        }}
                      />
                      <span className="vel-slider"></span>
                    </label>
                  </div>
                </div>

                {assignForm.autoSuggest && (
                  <div style={{ fontSize: '0.72rem', color: '#34D399', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Check className="h-3.5 w-3.5" />
                    <span>Auto-suggest active: Editors ranked by available workload & turnaround capacity</span>
                  </div>
                )}

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
                    {(() => {
                      const displayList = assignForm.autoSuggest
                        ? [...editorsList].sort((a, b) => {
                            const aAvail = (a.maxOrders || 5) - (a.activeOrders || 0);
                            const bAvail = (b.maxOrders || 5) - (b.activeOrders || 0);
                            return bAvail - aAvail;
                          })
                        : editorsList;

                      return displayList.map((ed, idx) => {
                        const isRecommended = assignForm.autoSuggest && idx === 0 && (ed.activeOrders || 0) < (ed.maxOrders || 5);
                        return (
                          <option key={ed.id} value={ed.id}>
                            {isRecommended ? '★ [RECOMMENDED] ' : ''}{ed.name} ({ed.role || ed.category || 'Editor'}) — {ed.activeOrders || 0}/{ed.maxOrders || 5} Active
                          </option>
                        );
                      });
                    })()}
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
            {/* 1. CLIENT SELECTION (REGISTERED OR OFFLINE DIRECT) */}
            <div className="vel-card">
              <div className="vel-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users className="h-4 w-4" />
                  <span>Client Selection</span>
                </span>

                {/* Mode Selector Toggle */}
                <div style={{ display: 'flex', background: '#0D0D14', padding: '3px', borderRadius: '8px', border: '1px solid var(--vel-border)', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setCreateForm(prev => ({
                      ...prev,
                      clientMode: 'registered',
                      existingClient: prev.existingClient === '__OFFLINE__' ? (clientsList[0]?.name || '') : prev.existingClient
                    }))}
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      background: (createForm.clientMode || 'registered') === 'registered' ? '#252538' : 'transparent',
                      color: (createForm.clientMode || 'registered') === 'registered' ? '#FFFFFF' : '#8E8EA0',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Registered Clients ({clientsList.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateForm(prev => ({
                      ...prev,
                      clientMode: 'offline',
                      existingClient: '__OFFLINE__'
                    }))}
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      background: createForm.clientMode === 'offline' ? '#3B2063' : 'transparent',
                      color: createForm.clientMode === 'offline' ? '#C084FC' : '#8E8EA0',
                      border: createForm.clientMode === 'offline' ? '1px solid rgba(192, 132, 252, 0.4)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Offline / Direct Client</span>
                  </button>
                </div>
              </div>

              {createForm.clientMode === 'offline' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(192, 132, 252, 0.08)', border: '1px solid rgba(192, 132, 252, 0.25)', fontSize: '0.78rem', color: '#E4E4E7', lineHeight: 1.5 }}>
                    <strong style={{ color: '#C084FC' }}>Offline Direct Client Mode:</strong> No account or signup needed! Official Advance Invoice PDF will be emailed to the address below. If this client registers on our website later with this same email, this project will automatically sync to their dashboard.
                  </div>

                  <div className="vel-form-grid-2">
                    <div className="vel-field-group">
                      <label className="vel-label">Client Full Name *</label>
                      <input
                        type="text"
                        className="vel-input"
                        placeholder="e.g. Rahul Sharma"
                        value={createForm.offlineClientName || ''}
                        onChange={(e) => setCreateForm({ ...createForm, offlineClientName: e.target.value })}
                        required={createForm.clientMode === 'offline'}
                      />
                    </div>

                    <div className="vel-field-group">
                      <label className="vel-label">Client Email Address (for Invoices) *</label>
                      <input
                        type="email"
                        className="vel-input"
                        placeholder="e.g. rahul@gmail.com"
                        value={createForm.offlineClientEmail || ''}
                        onChange={(e) => setCreateForm({ ...createForm, offlineClientEmail: e.target.value })}
                        required={createForm.clientMode === 'offline'}
                      />
                    </div>
                  </div>

                  {/* Live Account Detection */}
                  {(() => {
                    const cleanEmail = (createForm.offlineClientEmail || '').trim().toLowerCase();
                    if (cleanEmail && cleanEmail.includes('@')) {
                      const matched = clientsList.find(c => c.email && c.email.toLowerCase() === cleanEmail);
                      if (matched) {
                        return (
                          <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#4ADE80', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Check className="h-4 w-4 flex-shrink-0" />
                            <span>
                              <strong>Existing registered client detected:</strong> {matched.name} {matched.company ? `(${matched.company})` : ''}. Order will automatically connect directly to their client portal!
                            </span>
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}

                  <div className="vel-form-grid-2">
                    <div className="vel-field-group">
                      <label className="vel-label">Client Phone / WhatsApp (Optional)</label>
                      <input
                        type="text"
                        className="vel-input"
                        placeholder="e.g. +91 98765 43210"
                        value={createForm.offlineClientPhone || ''}
                        onChange={(e) => setCreateForm({ ...createForm, offlineClientPhone: e.target.value })}
                      />
                    </div>

                    <div className="vel-field-group">
                      <label className="vel-label">Brand / Company Name (Optional)</label>
                      <input
                        type="text"
                        className="vel-input"
                        placeholder="e.g. Acme Corp"
                        value={createForm.offlineClientCompany || ''}
                        onChange={(e) => setCreateForm({ ...createForm, offlineClientCompany: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="vel-field-group">
                  <label className="vel-label">Select Registered Client</label>
                  <select
                    className="vel-select"
                    value={createForm.existingClient}
                    onChange={(e) => handleClientSelectionChange(e.target.value)}
                    required={createForm.clientMode !== 'offline'}
                  >
                    <option value="">-- Choose Client --</option>
                    {clientsList.map((cl) => (
                      <option key={cl.id} value={cl.name}>
                        {cl.name} {cl.company ? `(${cl.company})` : ''}
                      </option>
                    ))}
                    <option value="__OFFLINE__">+ New Offline Client (Direct / No Account)...</option>
                  </select>
                </div>
              )}
            </div>

            {/* 2. CLIENT REQUIREMENTS */}
            <div className="vel-card">
              <div className="vel-card-head">
                <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clapperboard className="h-4 w-4" />
                  <span>Client Requirements</span>
                </span>
              </div>

              <div className="vel-form-grid-2">
                <div className="vel-field-group">
                  <label className="vel-label">Project Name</label>
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
                  <label className="vel-label">Size & Quality</label>
                  <select
                    className="vel-select"
                    value={createForm.format}
                    onChange={(e) => setCreateForm({ ...createForm, format: e.target.value })}
                  >
                    <option value="YouTube Longform (16:9)">YouTube Longform (16:9)</option>
                    <option value="Instagram / TikTok Reel (9:16)">Instagram / TikTok Reel (9:16)</option>
                    <option value="Commercial 4K Broadcast">Commercial 4K Broadcast</option>
                    <option value="Square Social Ad (1:1)">Square Social Ad (1:1)</option>
                    <option value="Custom Size & Quality">Custom Size & Quality</option>
                  </select>
                </div>
              </div>

              {/* Video Description (renamed from Creative Brief & Instructions) */}
              <div className="vel-field-group" style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="vel-label">Video Description</label>
                  <span style={{ fontSize: '0.65rem', color: 'var(--vel-text-tertiary)' }}>Client Brief</span>
                </div>
                <textarea
                  className="vel-textarea"
                  style={{ minHeight: '120px' }}
                  placeholder="Client's original video description, creative brief, and editing instructions..."
                  value={createForm.brief}
                  onChange={(e) => setCreateForm({ ...createForm, brief: e.target.value })}
                />
              </div>

              {/* 5. Custom Section option for additional requirements */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--vel-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(createForm.hasCustomSection)}
                      onChange={(e) => setCreateForm({ ...createForm, hasCustomSection: e.target.checked })}
                      style={{ accentColor: '#22C55E', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>Custom Section for Additional Requirements</span>
                  </label>
                  {createForm.hasCustomSection && (
                    <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', fontWeight: 600, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                      Section Enabled
                    </span>
                  )}
                </div>

                {createForm.hasCustomSection && (
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
                    <div className="vel-field-group">
                      <label className="vel-label">Custom Section Title</label>
                      <input
                        type="text"
                        className="vel-input"
                        placeholder="e.g., Audio & Sound Design Specs, Subtitle & Typography Rules, Brand Guidelines"
                        value={createForm.customSectionTitle || ''}
                        onChange={(e) => setCreateForm({ ...createForm, customSectionTitle: e.target.value })}
                      />
                    </div>
                    <div className="vel-field-group">
                      <label className="vel-label">Additional Requirements Details</label>
                      <textarea
                        className="vel-textarea"
                        style={{ minHeight: '85px' }}
                        placeholder="Detail the specific additional requirements or technical specifications..."
                        value={createForm.customSectionContent || ''}
                        onChange={(e) => setCreateForm({ ...createForm, customSectionContent: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 7. EDITOR'S REQUIREMENTS SECTION (Below Video Description) */}
            <div className="vel-card" style={{ borderLeft: '3px solid #3B82F6' }}>
              <div className="vel-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93C5FD' }}>
                  <SlidersHorizontal className="h-4 w-4 text-blue-400" />
                  <span>Editor's Requirements</span>
                </span>
                <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#93C5FD', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 600 }}>
                  Internal Production Scope
                </span>
              </div>

              <p style={{ fontSize: '0.74rem', color: 'var(--vel-text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                Add or modify requirements for the editor without altering original client requirements. Client requirements and editor requirements are kept strictly separate.
              </p>

              <div className="vel-field-group">
                <textarea
                  className="vel-textarea"
                  style={{ minHeight: '110px' }}
                  placeholder="Specify dedicated editor requirements, color grade profiles, timeline specs, internal delivery benchmarks, or pacing adjustments..."
                  value={createForm.editorRequirements || ''}
                  onChange={(e) => setCreateForm({ ...createForm, editorRequirements: e.target.value })}
                />
              </div>
            </div>

            {/* Asset Ingestion & Timeline Tracker */}
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

              {/* 4. BILLING & ADVANCE PAYMENT INVOICE */}
              <div className="vel-card">
                <div className="vel-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="vel-card-title-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Receipt className="h-4 w-4" style={{ color: '#4ADE80' }} />
                    <span>Project Billing & Advance Invoice</span>
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#A1A1AA', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                    Attached to Confirmation Email (PDF)
                  </span>
                </div>

                {/* Currency Selector Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <label className="vel-label" style={{ margin: 0 }}>Select Currency</label>
                  <div style={{ display: 'flex', background: '#0D0D14', padding: '3px', borderRadius: '8px', border: '1px solid var(--vel-border)', flexWrap: 'wrap', gap: '4px' }}>
                    {[
                      { code: 'USD', symbol: '$', label: '$ USD' },
                      { code: 'INR', symbol: '₹', label: '₹ INR' },
                      { code: 'EUR', symbol: '€', label: '€ EUR' },
                      { code: 'GBP', symbol: '£', label: '£ GBP' },
                    ].map(cur => (
                      <button
                        key={cur.code}
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, currency: cur.code })}
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          background: (createForm.currency || 'USD') === cur.code ? '#252538' : 'transparent',
                          color: (createForm.currency || 'USD') === cur.code ? '#FFFFFF' : '#8E8EA0',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cur.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const currSym = createForm.currency === 'INR' ? '₹' : createForm.currency === 'EUR' ? '€' : createForm.currency === 'GBP' ? '£' : '$';
                  return (
                    <>
                      <div className="vel-form-grid-2">
                        <div className="vel-field-group">
                          <label className="vel-label">Total Project Fee ({currSym})</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 1200"
                            className="vel-input"
                            value={createForm.totalAmount || ''}
                            onChange={(e) => setCreateForm({ ...createForm, totalAmount: e.target.value })}
                          />
                        </div>

                        <div className="vel-field-group">
                          <label className="vel-label">Advance Payment Received ({currSym})</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 600"
                            className="vel-input"
                            value={createForm.advancePaid || ''}
                            onChange={(e) => setCreateForm({ ...createForm, advancePaid: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="vel-form-grid-2" style={{ marginTop: '10px' }}>
                        <div className="vel-field-group">
                          <label className="vel-label">Video Duration / QTY (for Invoice)</label>
                          <input
                            type="text"
                            placeholder="e.g. 1 min"
                            className="vel-input"
                            value={createForm.duration || ''}
                            onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                          />
                        </div>

                        <div className="vel-field-group">
                          <label className="vel-label">Client City / Location (for Invoice)</label>
                          <input
                            type="text"
                            placeholder="e.g. vijayawada, AP"
                            className="vel-input"
                            value={createForm.clientLocation || ''}
                            onChange={(e) => setCreateForm({ ...createForm, clientLocation: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Real-time Balance Calculation Preview */}
                      {(Number(createForm.totalAmount) > 0 || Number(createForm.advancePaid) > 0) && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(192, 132, 252, 0.06)',
                          border: '1px solid rgba(192, 132, 252, 0.2)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8rem'
                        }}>
                          <span style={{ color: '#A1A1AA' }}>
                            Remaining Balance on Delivery ({createForm.currency || 'USD'}):
                          </span>
                          <strong style={{ color: '#FACC15', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                            {currSym}{Math.max(0, (Number(createForm.totalAmount) || 0) - (Number(createForm.advancePaid) || 0)).toFixed(2)}
                          </strong>
                        </div>
                      )}
                    </>
                  );
                })()}
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

            <div className="vel-form-actions-bar" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
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
            filteredEditors.map((ed) => {
              const editorOrders = (orders || []).filter((o) => {
                if (ed.id && (o.editorId === ed.id || o.editor?.id === ed.id)) return true;
                if (ed.name && o.editor?.name && o.editor.name.toLowerCase() === ed.name.toLowerCase() && ed.name.toLowerCase() !== 'unassigned') return true;
                return false;
              });
              const activeEditorOrders = editorOrders.filter(o => o.dbStatus !== 'delivered' && o.dbStatus !== 'cancelled');
              const deliveredEditorOrders = editorOrders.filter(o => o.dbStatus === 'delivered');

              return (
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'right' }}>
                        <div>
                          <span style={{ fontSize: '0.70rem', color: 'var(--vel-text-secondary)', display: 'block' }}>Total Orders</span>
                          <strong style={{ fontSize: '0.92rem', color: '#60A5FA' }}>{editorOrders.length}</strong>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.70rem', color: ed.statusColor, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontWeight: 700 }}>
                            <span>•</span>
                            <span>{ed.status}</span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--vel-text-secondary)', marginTop: '2px' }}>
                            WORKLOAD: <strong style={{ color: '#4ADE80' }}>{activeEditorOrders.length} Active</strong>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (setSelectedEditorModal) setSelectedEditorModal(ed);
                        }}
                        className="vel-btn-outline"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.76rem',
                          color: '#FFFFFF',
                          borderColor: 'rgba(255, 255, 255, 0.16)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        title="View editor order history and completed projects"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Orders ({editorOrders.length})</span>
                      </button>

                      <ChevronDown
                        className="h-4 w-4 text-white/40"
                        style={{ transform: expandedEditor === ed.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                      />
                    </div>
                  </div>

                  {/* Expanded Details Drawer */}
                  {expandedEditor === ed.id && (
                    <div style={{ paddingTop: '16px', borderTop: '1px solid var(--vel-border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="vel-btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (setSelectedEditorModal) setSelectedEditorModal(ed);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Full History Modal</span>
                          </button>

                          <button
                            type="button"
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
                      </div>

                      {/* Inline Project & Orders History Section */}
                      <div style={{ background: '#101016', border: '1px solid var(--vel-border)', borderRadius: '8px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Package className="h-3.5 w-3.5 text-purple-400" />
                            <span>Editor Assigned Projects ({editorOrders.length})</span>
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.72rem' }}>
                            <span>Active: <strong style={{ color: '#FBBF24' }}>{activeEditorOrders.length}</strong></span>
                            <span>Delivered: <strong style={{ color: '#4ADE80' }}>{deliveredEditorOrders.length}</strong></span>
                          </div>
                        </div>

                        {editorOrders.length === 0 ? (
                          <p style={{ fontSize: '0.78rem', color: 'var(--vel-text-secondary)', margin: 0, padding: '8px 0' }}>
                            No orders assigned to this editor yet. Click "Assign Project" above to allocate an order.
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                            {editorOrders.map(ord => (
                              <div
                                key={ord.id}
                                style={{
                                  background: '#161620',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  borderRadius: '6px',
                                  padding: '10px 12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '0.70rem', fontFamily: 'monospace', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }}>
                                      {ord.displayId}
                                    </span>
                                    <strong style={{ fontSize: '0.82rem', color: '#FFFFFF' }}>{ord.title}</strong>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)' }}>• Client: <span style={{ color: '#E2E8F0' }}>{ord.client}</span></span>
                                  </div>
                                  <span className={`vel-badge ${ord.badgeClass}`} style={{ fontSize: '0.64rem', padding: '1px 6px' }}>
                                    {ord.status}
                                  </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px', fontSize: '0.72rem', color: 'var(--vel-text-secondary)', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                  <div>
                                    <span style={{ color: 'var(--vel-text-tertiary)', fontSize: '0.64rem', display: 'block' }}>CREATED DATE</span>
                                    <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{ord.formattedCreatedAt || '—'}</span>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--vel-text-tertiary)', fontSize: '0.64rem', display: 'block' }}>
                                      {ord.isDelivered ? 'DELIVERED DATE' : 'DEADLINE'}
                                    </span>
                                    <span style={{ color: ord.isDelivered ? '#4ADE80' : '#FCD34D', fontWeight: 600 }}>
                                      {ord.isDelivered ? (ord.formattedDeliveredAt || 'Delivered') : (ord.deadline || ord.editorDeadline || 'In Progress')}
                                    </span>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--vel-text-tertiary)', fontSize: '0.64rem', display: 'block' }}>PRICE / FEE</span>
                                    {ord.totalAmount ? (
                                      <span style={{ color: '#C084FC', fontWeight: 700 }}>
                                        {ord.currencySymbol}{Number(ord.totalAmount).toLocaleString()}
                                        {ord.advancePaid ? ` (Adv: ${ord.currencySymbol}${Number(ord.advancePaid).toLocaleString()})` : ''}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--vel-text-tertiary)' }}>Price not set</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
            )}
          </div>
        </>
      )}
    </>
  );
}
