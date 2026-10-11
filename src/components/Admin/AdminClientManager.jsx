import React from 'react';
import {
  Search,
  X,
  Eye,
  CheckCircle2,
  Ban,
  Trash2,
  Handshake,
  Clock,
  Check,
  RefreshCw,
  Mail,
  MessageSquare,
  Archive,
  Phone,
  Calendar,
  FileText,
  Copy,
  ExternalLink,
  MessageSquareQuote,
  Star,
  Award,
  Quote
} from 'lucide-react';
import { PROJECT_TYPE_LABELS, STATUS_CONFIG as CONTACT_STATUS_CONFIG } from '../../lib/db/contactRequests';

export default function AdminClientManager({
  activeNav,
  setActiveNav,
  mgmtTab,
  setMgmtTab,
  editorsList = [],
  clientsList = [],
  filteredClients = [],
  searchQuery,
  setSearchQuery,
  setSelectedClientModal,
  handleUnblockClient,
  handleBlockClient,
  handleDeleteClient,
  pendingUsers = [],
  approvalsSearch,
  setApprovalsSearch,
  filteredPendingUsers = [],
  approvalsActionLoading = {},
  handleRejectUser,
  handleApproveUser,
  fetchContactRequests,
  contactRequestsLoading,
  newContactRequestsCount = 0,
  contactRequests = [],
  contactSearch,
  setContactSearch,
  contactStatusFilter,
  setContactStatusFilter,
  contactTypeFilter,
  setContactTypeFilter,
  filteredContactRequests = [],
  getWhatsAppUrl,
  contactActionLoading = {},
  handleUpdateContactStatus,
  setSelectedContactRequest,
  setTempContactNotes,
  handleDeleteContactRequest,
  handleCopyFeedbackLink,
  isCopiedFeedbackLink,
  fetchLinkFeedbacks,
  linkFeedbacksLoading,
  linkFeedbacks = [],
  avgFeedbackRating = '5.0',
  fiveStarFeedbackCount = 0,
  testimonialConsentCount = 0,
  feedbackSearch,
  setFeedbackSearch,
  feedbackRatingFilter,
  setFeedbackRatingFilter,
  filteredFeedbacks = [],
  handleDeleteFeedback
}) {
  return (
    <>
      {/* ============================================================== */}
      {/* VIEW: CLIENTS MANAGEMENT                                       */}
      {/* ============================================================== */}
      {activeNav === 'clients' && (
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
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search className="h-4 w-4" style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--vel-text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search clients by company or contact..."
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
          </div>

          {/* Clients List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredClients.length === 0 ? (
              <div className="vel-card" style={{ padding: '40px', textAlign: 'center', alignItems: 'center', gap: '12px' }}>
                <Handshake className="h-8 w-8 text-white/30" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>No clients found</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--vel-text-secondary)' }}>
                  No clients match your search query "{searchQuery}".
                </p>
              </div>
            ) : (
              filteredClients.map((cl) => (
                <div
                  key={cl.id}
                  style={{
                    background: 'var(--vel-bg-card)',
                    border: cl.status === 'rejected' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--vel-border)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: cl.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : '#181824',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: cl.status === 'rejected' ? '#EF4444' : '#FFFFFF'
                    }}>
                      {cl.name ? cl.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>{cl.name}</span>
                        {cl.previous_name && (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(234, 179, 8, 0.15)',
                            color: '#FBBF24',
                            border: '1px solid rgba(234, 179, 8, 0.3)',
                            fontWeight: 600
                          }} title={`Previously registered as: ${cl.previous_name}`}>
                            Old Name: {cl.previous_name}
                          </span>
                        )}
                        {cl.isGoogle && (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255, 255, 255, 0.18)',
                            fontWeight: 600
                          }}>
                            Google Auth
                          </span>
                        )}
                        {cl.status === 'rejected' ? (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#F87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontWeight: 600
                          }}>
                            Suspended / Blocked
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: 'rgba(34, 197, 94, 0.12)',
                            color: '#4ADE80',
                            border: '1px solid rgba(34, 197, 94, 0.25)',
                            fontWeight: 600
                          }}>
                            Active
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--vel-text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>Email: <span style={{ color: '#E2E8F0' }}>{cl.email || '—'}</span></span>
                        {cl.company_name && <span>• Company: <strong style={{ color: '#FFFFFF' }}>{cl.company_name}</strong></span>}
                        {cl.phone && <span>• Phone: <span style={{ color: '#4ADE80' }}>{cl.phone}</span></span>}
                        {cl.previous_name && <span>• Changed from: <strong style={{ color: '#FBBF24' }}>{cl.previous_name}</strong></span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--vel-text-secondary)', display: 'block' }}>Active Projects</span>
                      <strong style={{ fontSize: '0.88rem' }}>{cl.activeProjects}</strong>
                    </div>

                    {/* Moderation Actions for Suspicious Accounts */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setSelectedClientModal(cl)}
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
                        title="View full client details and name history"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </button>
                      {cl.status === 'rejected' ? (
                        <button
                          onClick={() => handleUnblockClient(cl)}
                          className="vel-btn-outline"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            color: '#4ADE80',
                            borderColor: 'rgba(34, 197, 94, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Unblock user and restore dashboard access"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Unblock</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockClient(cl)}
                          className="vel-btn-outline"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            color: '#F87171',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Block / suspend suspicious user immediately"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          <span>Block</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteClient(cl)}
                        className="vel-btn-outline"
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.76rem',
                          color: '#F87171',
                          borderColor: 'rgba(239, 68, 68, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Permanently delete user profile"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* VIEW: USER APPROVALS                                           */}
      {/* ============================================================== */}
      {activeNav === 'approvals' && (
        <>
          <div className="vel-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 className="vel-page-h1">User Approvals</h1>
              <p className="vel-page-sub">Review and approve new user registrations before granting dashboard access.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '6px 14px',
                borderRadius: '8px',
                color: '#FBBF24',
                fontSize: '0.82rem',
                fontWeight: 600
              }}>
                <Clock className="h-4 w-4" />
                <span>{pendingUsers.length} Pending Approval{pendingUsers.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search className="h-4 w-4" style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--vel-text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search pending users by name, email, or role..."
                value={approvalsSearch}
                onChange={(e) => setApprovalsSearch(e.target.value)}
                className="vel-input"
                style={{ paddingLeft: '40px' }}
              />
              {approvalsSearch && (
                <button
                  onClick={() => setApprovalsSearch('')}
                  style={{ position: 'absolute', right: '12px', top: '10px', background: 'transparent', border: 'none', color: 'var(--vel-text-tertiary)', cursor: 'pointer' }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Pending Users List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredPendingUsers.length === 0 ? (
              <div className="vel-card" style={{ padding: '48px 24px', textAlign: 'center', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 className="h-7 w-7 text-green-400" />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {approvalsSearch ? 'No matching pending users' : 'All users are approved!'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--vel-text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
                  {approvalsSearch
                    ? `No pending user registrations match "${approvalsSearch}". Try clearing your search.`
                    : 'There are currently no new registration requests waiting for review. When new users sign up, their accounts will appear here.'}
                </p>
                {approvalsSearch && (
                  <button
                    className="vel-btn-outline"
                    style={{ marginTop: '8px' }}
                    onClick={() => setApprovalsSearch('')}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              filteredPendingUsers.map((user) => {
                const isApproving = approvalsActionLoading[user.id] === 'approving';
                const isRejecting = approvalsActionLoading[user.id] === 'rejecting';
                const isBusy = isApproving || isRejecting;
                const roleLabel = (user.role || 'client').toUpperCase();
                const initial = (user.full_name || user.email || 'U').charAt(0).toUpperCase();

                return (
                  <div
                    key={user.id}
                    style={{
                      background: 'var(--vel-bg-card)',
                      border: '1px solid var(--vel-border)',
                      borderRadius: '12px',
                      padding: '18px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                      transition: 'border-color 0.15s, background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(255, 255, 255, 0.08))',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#FBBF24'
                      }}>
                        {initial}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FFFFFF' }}>
                            {user.full_name || 'Anonymous User'}
                          </span>
                          <span style={{
                            fontSize: '0.66rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: user.role === 'editor' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            color: user.role === 'editor' ? '#C084FC' : '#FFFFFF',
                            fontWeight: 700,
                            letterSpacing: '0.5px'
                          }}>
                            {roleLabel}
                          </span>
                          <span style={{
                            fontSize: '0.66rem',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#FBBF24',
                            fontWeight: 600
                          }}>
                            PENDING APPROVAL
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--vel-text-secondary)', marginTop: '3px' }}>
                          <span>{user.email}</span>
                          {user.phone && <span> • Phone: {user.phone}</span>}
                          {user.company_name && <span> • Company: {user.company_name}</span>}
                        </div>
                        {user.created_at && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--vel-text-tertiary)', marginTop: '2px' }}>
                            Registered: {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        className="vel-btn-outline"
                        disabled={isBusy}
                        onClick={() => handleRejectUser(user)}
                        style={{
                          padding: '7px 14px',
                          fontSize: '0.8rem',
                          borderColor: 'rgba(239, 68, 68, 0.3)',
                          color: '#F87171'
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>{isRejecting ? 'Declining...' : 'Decline'}</span>
                      </button>

                      <button
                        className="vel-btn-solid"
                        disabled={isBusy}
                        onClick={() => handleApproveUser(user)}
                        style={{
                          padding: '7px 18px',
                          fontSize: '0.8rem',
                          background: '#22C55E',
                          borderColor: '#22C55E',
                          color: '#FFFFFF'
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{isApproving ? 'Approving...' : 'Approve User'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* VIEW: CONTACT REQUESTS                                         */}
      {/* ============================================================== */}
      {activeNav === 'contact-requests' && (
        <>
          <div className="vel-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 className="vel-page-h1">Contact Requests</h1>
              <p className="vel-page-sub">Review and respond to quote inquiries submitted by website visitors.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="vel-btn-outline"
                onClick={fetchContactRequests}
                disabled={contactRequestsLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${contactRequestsLoading ? 'animate-spin' : ''}`} />
                <span>{contactRequestsLoading ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              {newContactRequestsCount > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  color: '#FBBF24',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}>
                  <Mail className="h-4 w-4" />
                  <span>{newContactRequestsCount} New Inquir{newContactRequestsCount === 1 ? 'y' : 'ies'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div className="vel-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="vel-metric-card">
              <div className="vel-metric-top">
                <span className="vel-metric-label">Total Inquiries</span>
                <div className="vel-metric-icon">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="vel-metric-bottom">
                <div className="vel-metric-number">{contactRequests.length}</div>
                <span className="vel-metric-pill-badge">All Time</span>
              </div>
            </div>

            <div className="vel-metric-card" style={{ borderColor: newContactRequestsCount > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined }}>
              <div className="vel-metric-top">
                <span className="vel-metric-label">New / Unread</span>
                <div className="vel-metric-icon" style={{ background: newContactRequestsCount > 0 ? 'rgba(245, 158, 11, 0.18)' : undefined, color: '#FBBF24' }}>
                  <Clock className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="vel-metric-bottom">
                <div className="vel-metric-number" style={{ color: newContactRequestsCount > 0 ? '#FBBF24' : '#FFFFFF' }}>{newContactRequestsCount}</div>
                <span style={{ fontSize: '0.72rem', color: newContactRequestsCount > 0 ? '#FBBF24' : 'var(--vel-text-secondary)', fontWeight: 600 }}>
                  {newContactRequestsCount > 0 ? 'Action Needed' : 'Caught Up'}
                </span>
              </div>
            </div>

            <div className="vel-metric-card">
              <div className="vel-metric-top">
                <span className="vel-metric-label">Contacted / Discussion</span>
                <div className="vel-metric-icon" style={{ color: '#10B981' }}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="vel-metric-bottom">
                <div className="vel-metric-number">
                  {contactRequests.filter(r => r.status === 'contacted' || r.status === 'in_discussion').length}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>In Pipeline</span>
              </div>
            </div>

            <div className="vel-metric-card">
              <div className="vel-metric-top">
                <span className="vel-metric-label">Closed</span>
                <div className="vel-metric-icon">
                  <Archive className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="vel-metric-bottom">
                <div className="vel-metric-number">
                  {contactRequests.filter(r => r.status === 'closed').length}
                </div>
                <span className="vel-metric-pill-badge">Completed</span>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search className="h-4 w-4" style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--vel-text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search by client name, email, phone, or project message..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="vel-input"
                style={{ paddingLeft: '40px' }}
              />
              {contactSearch && (
                <button
                  onClick={() => setContactSearch('')}
                  style={{ position: 'absolute', right: '12px', top: '10px', background: 'transparent', border: 'none', color: 'var(--vel-text-tertiary)', cursor: 'pointer' }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', gap: '6px', background: 'var(--vel-bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--vel-border)' }}>
              {['ALL', 'new', 'contacted', 'in_discussion', 'closed'].map((st) => {
                const count = st === 'ALL'
                  ? contactRequests.length
                  : contactRequests.filter(r => r.status === st).length;
                const label = st === 'ALL' ? 'All' : CONTACT_STATUS_CONFIG[st]?.label || st;
                const isActive = contactStatusFilter === st;

                return (
                  <button
                    key={st}
                    onClick={() => setContactStatusFilter(st)}
                    style={{
                      background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      color: isActive ? '#FFFFFF' : 'var(--vel-text-secondary)',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{label}</span>
                    <span style={{
                      fontSize: '0.66rem',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: isActive ? '#FFFFFF' : 'var(--vel-text-tertiary)',
                      fontWeight: 600
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Project Type Filter */}
            <select
              className="vel-select"
              style={{ width: 'auto', minWidth: '180px' }}
              value={contactTypeFilter}
              onChange={(e) => setContactTypeFilter(e.target.value)}
            >
              <option value="ALL">All Project Types</option>
              {Object.entries(PROJECT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Contact Requests Cards / List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredContactRequests.length === 0 ? (
              <div className="vel-card" style={{ padding: '48px 24px', textAlign: 'center', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail className="h-7 w-7 text-amber-400" />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {contactSearch || contactStatusFilter !== 'ALL' || contactTypeFilter !== 'ALL'
                    ? 'No matching contact requests'
                    : 'No contact requests yet'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--vel-text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
                  {contactSearch || contactStatusFilter !== 'ALL' || contactTypeFilter !== 'ALL'
                    ? 'No quote requests match your active filters. Try adjusting or clearing filters.'
                    : 'When prospective clients submit the "Request a Quote" form on your website, their requests will appear here instantly in real-time.'}
                </p>
                {(contactSearch || contactStatusFilter !== 'ALL' || contactTypeFilter !== 'ALL') && (
                  <button
                    className="vel-btn-outline"
                    style={{ marginTop: '8px' }}
                    onClick={() => {
                      setContactSearch('');
                      setContactStatusFilter('ALL');
                      setContactTypeFilter('ALL');
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              filteredContactRequests.map((req) => {
                const statusConfig = CONTACT_STATUS_CONFIG[req.status] || CONTACT_STATUS_CONFIG.new;
                const projectLabel = PROJECT_TYPE_LABELS[req.project_type] || req.project_type || 'General Quote';
                const waUrl = getWhatsAppUrl(req.phone, req.name, req.project_type);
                const isActionBusy = contactActionLoading[req.id];
                const initial = (req.name || req.email || 'C').charAt(0).toUpperCase();

                return (
                  <div
                    key={req.id}
                    style={{
                      background: 'var(--vel-bg-card)',
                      border: req.status === 'new' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--vel-border)',
                      borderRadius: '12px',
                      padding: '20px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Client Info, Project Type, Status, Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #1E1E2A, #2A2A3C)',
                          border: '1px solid var(--vel-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: '#FFFFFF'
                        }}>
                          {initial}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>{req.name}</span>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(168, 85, 247, 0.15)',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              color: '#C084FC',
                              fontWeight: 600
                            }}>
                              {projectLabel}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--vel-text-secondary)' }}>
                            <a
                              href={`mailto:${req.email}`}
                              style={{ color: 'var(--vel-text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Click to email"
                            >
                              <Mail className="h-3 w-3 text-white/60" />
                              <span>{req.email}</span>
                            </a>

                            {req.phone && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone className="h-3 w-3 text-emerald-400" />
                                <span>{req.phone}</span>
                              </span>
                            )}

                            {req.created_at && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--vel-text-tertiary)' }}>
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(req.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={req.status || 'new'}
                          disabled={isActionBusy}
                          onChange={(e) => handleUpdateContactStatus(req.id, e.target.value)}
                          className="vel-select"
                          style={{
                            padding: '5px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            background: req.status === 'new'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : req.status === 'contacted'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : req.status === 'in_discussion'
                              ? 'rgba(139, 92, 246, 0.15)'
                              : 'rgba(107, 114, 128, 0.15)',
                            color: req.status === 'new'
                              ? '#FBBF24'
                              : req.status === 'contacted'
                              ? '#34D399'
                              : req.status === 'in_discussion'
                              ? '#A78BFA'
                              : '#9CA3AF',
                            border: `1px solid ${statusConfig.color}40`,
                            cursor: 'pointer'
                          }}
                        >
                          <option value="new">Status: New</option>
                          <option value="contacted">Status: Contacted</option>
                          <option value="in_discussion">Status: In Discussion</option>
                          <option value="closed">Status: Closed</option>
                        </select>
                      </div>
                    </div>

                    {/* Middle Row: Message preview */}
                    <div style={{
                      background: 'var(--vel-bg-card-inner)',
                      border: '1px solid var(--vel-border)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '0.84rem',
                      lineHeight: '1.5',
                      color: '#E2E8F0'
                    }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--vel-text-tertiary)', fontWeight: 700, marginBottom: '4px' }}>
                        Project Details / Message
                      </div>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {req.message}
                      </p>
                      {req.admin_notes && (
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--vel-border)', fontSize: '0.78rem', color: '#FCD34D' }}>
                          <strong>Admin Note:</strong> {req.admin_notes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="vel-btn-solid"
                            style={{
                              background: '#25D366',
                              borderColor: '#25D366',
                              color: '#000000',
                              fontSize: '0.78rem',
                              padding: '6px 14px',
                              textDecoration: 'none',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Chat on WhatsApp</span>
                          </a>
                        )}

                        <a
                          href={`mailto:${req.email}?subject=${encodeURIComponent(`Regarding your ${projectLabel} project inquiry`)}`}
                          className="vel-btn-outline"
                          style={{
                            fontSize: '0.78rem',
                            padding: '6px 14px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Send Email</span>
                        </a>

                        <button
                          type="button"
                          className="vel-btn-outline"
                          onClick={() => {
                            setSelectedContactRequest(req);
                            setTempContactNotes(req.admin_notes || '');
                          }}
                          style={{
                            fontSize: '0.78rem',
                            padding: '6px 14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View & Notes</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isActionBusy}
                        onClick={() => handleDeleteContactRequest(req.id, req.name)}
                        style={{
                          background: 'transparent',
                          border: '1px solid transparent',
                          color: 'var(--vel-text-tertiary)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'color 0.15s, border-color 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#F87171';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--vel-text-tertiary)';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* VIEW: LINK FEEDBACK (Private shareable URL submissions)        */}
      {/* ============================================================== */}
      {activeNav === 'link-feedback' && (
        <>
          <div className="vel-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 className="vel-page-h1">Link Feedback</h1>
              <p className="vel-page-sub">Direct reviews and ratings collected via your private shareable link.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button
                className="vel-btn-solid"
                onClick={handleCopyFeedbackLink}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isCopiedFeedbackLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{isCopiedFeedbackLink ? 'Link Copied!' : 'Copy Feedback Link'}</span>
              </button>

              <a
                href="/feedback"
                target="_blank"
                rel="noreferrer"
                className="vel-btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Preview Page</span>
              </a>

              <button
                className="vel-btn-outline"
                onClick={fetchLinkFeedbacks}
                disabled={linkFeedbacksLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${linkFeedbacksLoading ? 'animate-spin' : ''}`} />
                <span>{linkFeedbacksLoading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div className="vel-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="vel-metric-card">
              <div className="vel-metric-top">
                <span className="vel-metric-label">Total Submissions</span>
                <div className="vel-metric-icon">
                  <MessageSquareQuote className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="vel-metric-bottom">
                <div className="vel-metric-number">{linkFeedbacks.length}</div>
                <span className="vel-metric-pill-badge">Via Link</span>
              </div>
            </div>

            <div className="vel-metric-card">
              <div className="vel-metric-top">
                <span className="vel-metric-label">Average Rating</span>
                <div className="vel-metric-icon" style={{ color: '#F59E0B' }}>
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                </div>
              </div>
              <div className="vel-metric-bottom">
                <div className="vel-metric-number" style={{ color: '#FBBF24' }}>
                  {avgFeedbackRating} <span style={{ fontSize: '0.9rem', color: 'var(--vel-text-secondary)' }}>/ 5</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', fontWeight: 600 }}>Overall Score</span>
              </div>
            </div>

            <div className="vel-metric-card">
              <div className="vel-metric-top">
                <span className="vel-metric-label">5-Star Reviews</span>
                <div className="vel-metric-icon" style={{ color: '#10B981' }}>
                  <Award className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="vel-metric-bottom">
                <div className="vel-metric-number">{fiveStarFeedbackCount}</div>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
                  {linkFeedbacks.length > 0 ? `${Math.round((fiveStarFeedbackCount / linkFeedbacks.length) * 100)}% of total` : '0%'}
                </span>
              </div>
            </div>

            <div className="vel-metric-card">
              <div className="vel-metric-top">
                <span className="vel-metric-label">Testimonial Consents</span>
                <div className="vel-metric-icon" style={{ color: '#FFFFFF' }}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="vel-metric-bottom">
                <div className="vel-metric-number">{testimonialConsentCount}</div>
                <span style={{ fontSize: '0.72rem', color: '#E2E8F0', fontWeight: 600 }}>Ready for Website</span>
              </div>
            </div>
          </div>

          {/* Share Link Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Quote className="h-4 w-4" />
              </div>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Your Private Shareable Feedback URL
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--vel-text-secondary)', marginTop: '2px' }}>
                  This page is not linked anywhere on the public website. Send this link directly to clients via WhatsApp, Email, or Slack.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <code style={{
                background: '#12121A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: '#E2E8F0',
                fontFamily: 'monospace'
              }}>
                {typeof window !== 'undefined' ? `${window.location.origin}/feedback` : '/feedback'}
              </code>
              <button
                type="button"
                className="vel-btn-solid"
                onClick={handleCopyFeedbackLink}
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {isCopiedFeedbackLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{isCopiedFeedbackLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="vel-search-pill" style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search className="h-3.5 w-3.5" style={{ position: 'absolute', left: '12px', color: 'var(--vel-text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search feedback by client name, email, company, or comments..."
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                className="vel-search-input"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={feedbackRatingFilter}
                onChange={(e) => setFeedbackRatingFilter(e.target.value)}
                style={{
                  background: '#181822',
                  border: '1px solid var(--vel-border)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Ratings</option>
                <option value="5">5 Stars Only</option>
                <option value="4">4 Stars Only</option>
                <option value="3">3 Stars Only</option>
                <option value="2">2 Stars Only</option>
                <option value="1">1 Star Only</option>
              </select>
            </div>
          </div>

          {/* Feedback Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredFeedbacks.length === 0 ? (
              <div className="vel-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--vel-text-tertiary)'
                }}>
                  <MessageSquareQuote className="h-6 w-6" />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                  No Feedback Found
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--vel-text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
                  {feedbackSearch || feedbackRatingFilter !== 'ALL'
                    ? 'No feedback entries match your current search or rating filter.'
                    : 'Send your private feedback link to clients after delivering projects to collect testimonials and workflow reviews.'}
                </p>
                <button
                  type="button"
                  className="vel-btn-solid"
                  onClick={handleCopyFeedbackLink}
                  style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Feedback Link to Share</span>
                </button>
              </div>
            ) : (
              filteredFeedbacks.map((fb) => {
                const starNum = Number(fb.rating) || 5;
                return (
                  <div
                    key={fb.id}
                    className="vel-card"
                    style={{
                      padding: '22px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: '#15151F'
                    }}
                  >
                    {/* Top row: Client info, Rating Stars, Testimonial badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                            {fb.name}
                          </h3>
                          {fb.company && (
                            <span style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 600 }}>
                              • {fb.company}
                            </span>
                          )}
                          {fb.project_type && (
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--vel-text-secondary)',
                              border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                              {fb.project_type}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--vel-text-tertiary)' }}>
                          {fb.email && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail className="h-3 w-3" />
                              {fb.email}
                            </span>
                          )}
                          <span>
                            {fb.created_at ? new Date(fb.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Recent'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Stars */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className="h-3.5 w-3.5"
                              style={{
                                fill: s <= starNum ? '#F59E0B' : 'transparent',
                                color: s <= starNum ? '#F59E0B' : 'rgba(255, 255, 255, 0.2)'
                              }}
                            />
                          ))}
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#FBBF24', marginLeft: '3px' }}>
                            {starNum}.0
                          </span>
                        </div>

                        {/* Consent Badge */}
                        {fb.testimonial_consent ? (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#34D399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Testimonial Consent</span>
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--vel-text-tertiary)',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}>
                            Private Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review Content */}
                    <div style={{
                      background: '#101017',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      fontSize: '0.86rem',
                      lineHeight: '1.55',
                      color: '#F3F4F6'
                    }}>
                      {fb.feedback}
                    </div>

                    {/* Improvements note if present */}
                    {fb.improvements && (
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.05)',
                        border: '1px solid rgba(245, 158, 11, 0.15)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '0.8rem',
                        color: '#E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Suggestions for Improvement:
                        </span>
                        <span>{fb.improvements}</span>
                      </div>
                    )}

                    {/* Bottom action row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeedback(fb.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid transparent',
                          color: 'var(--vel-text-tertiary)',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#F87171';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--vel-text-tertiary)';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Feedback</span>
                      </button>
                    </div>
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
