import React, { useState, useEffect, useCallback } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Calendar,
  RefreshCw,
  LogOut,
  Trash2,
  X,
  KeyRound,
  Activity,
  Globe,
  Monitor
} from 'lucide-react';
import {
  getMyAdminDevices,
  revokeDevice,
  revokeOtherDevices,
  clearStoredDeviceToken
} from '../../lib/auth/deviceManager';

function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function formatRelativeTime(isoString) {
  if (!isoString) return 'Never';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

export default function AdminLoginDevices({ showToast }) {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deviceToRevoke, setDeviceToRevoke] = useState(null);
  const [showRevokeOthersModal, setShowRevokeOthersModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDevices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await getMyAdminDevices();
      if (res.error) {
        if (showToast) showToast('Failed to load registered devices: ' + (res.error.message || 'Error'), 'error');
      } else {
        setDevices(res.data || []);
      }
    } catch (err) {
      console.error('[AdminLoginDevices] Fetch error:', err);
      if (showToast) showToast('Error retrieving login devices.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const currentDevice = devices.find((d) => d.isCurrent);
  const otherActiveDevices = devices.filter((d) => !d.isCurrent && d.status === 'active');
  const activeCount = devices.filter((d) => d.status === 'active').length;

  const handleRevokeConfirm = async () => {
    if (!deviceToRevoke) return;
    setActionLoading(true);

    try {
      const res = await revokeDevice(deviceToRevoke.id, deviceToRevoke.isCurrent);
      if (res.success) {
        if (showToast) showToast(`Device "${deviceToRevoke.device_name}" revoked successfully.`, 'success');
        
        // If the current device was revoked, clear local credentials and inform admin
        if (deviceToRevoke.isCurrent) {
          clearStoredDeviceToken();
          setTimeout(() => {
            window.location.href = '/admin/login?notice=revoked';
          }, 1200);
        } else {
          setDeviceToRevoke(null);
          await fetchDevices(true);
        }
      } else {
        if (showToast) showToast(res.error || 'Failed to revoke device.', 'error');
      }
    } catch (err) {
      console.error('[AdminLoginDevices] Error during device revocation:', err);
      if (showToast) showToast('Error during device revocation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeOthersConfirm = async () => {
    setActionLoading(true);

    try {
      const res = await revokeOtherDevices(currentDevice?.id);
      if (res.success) {
        if (showToast) showToast('All other active admin devices have been signed out.', 'success');
        setShowRevokeOthersModal(false);
        await fetchDevices(true);
      } else {
        if (showToast) showToast(res.error || 'Failed to sign out other devices.', 'error');
      }
    } catch (err) {
      console.error('[AdminLoginDevices] Error terminating other sessions:', err);
      if (showToast) showToast('Error terminating other sessions.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Keyboard accessibility for modals
  useEffect(() => {
    if (!deviceToRevoke && !showRevokeOthersModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !actionLoading) {
        if (deviceToRevoke) setDeviceToRevoke(null);
        if (showRevokeOthersModal) setShowRevokeOthersModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deviceToRevoke, showRevokeOthersModal, actionLoading]);

  const getDeviceIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'mobile') return <Smartphone className="h-5 w-5 text-indigo-400" />;
    if (t === 'tablet') return <Tablet className="h-5 w-5 text-purple-400" />;
    return <Laptop className="h-5 w-5 text-sky-400" />;
  };

  const renderStatusBadge = (device) => {
    const isRevoked = device.status === 'revoked';
    const isTrusted = device.is_trusted !== false;
    const isExpired = isTrusted && (device.status === 'expired' || (device.expires_at && new Date(device.expires_at) <= new Date()));

    if (isRevoked) {
      return (
        <span className="mne-dev-badge mne-dev-badge-revoked">
          <ShieldAlert className="h-3 w-3" />
          <span>Revoked</span>
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="mne-dev-badge mne-dev-badge-expired">
          <Clock className="h-3 w-3" />
          <span>Expired</span>
        </span>
      );
    }
    if (isTrusted) {
      return (
        <span className="mne-dev-badge mne-dev-badge-trusted">
          <ShieldCheck className="h-3 w-3" />
          <span>Trusted (30-day Trust)</span>
        </span>
      );
    }
    return (
      <span className="mne-dev-badge mne-dev-badge-normal">
        <KeyRound className="h-3 w-3" />
        <span>Normal Login</span>
      </span>
    );
  };

  const trustedCount = devices.filter((d) => d.status === 'active' && d.is_trusted !== false).length;

  return (
    <div className="vel-content-pane mne-devices-pane">
      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="mne-dev-header">
        <div className="mne-dev-header-left">
          <div className="mne-dev-title-row">
            <h2 className="mne-dev-title">Login Devices</h2>
            <span className="mne-dev-count-pill">
              {activeCount} Active ({trustedCount} Trusted)
            </span>
          </div>
          <p className="mne-dev-subtitle">
            Manage authenticated browsers and workstations. Displays both 30-day trusted devices and standard single-session logins.
          </p>
        </div>

        <div className="mne-dev-header-actions">
          <button
            onClick={() => fetchDevices(true)}
            disabled={isRefreshing || isLoading}
            className="vel-btn-secondary mne-dev-btn"
            title="Refresh devices list"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {otherActiveDevices.length > 0 && (
            <button
              onClick={() => setShowRevokeOthersModal(true)}
              className="vel-btn-danger mne-dev-btn"
              title="Terminate sessions on all other browsers"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out Other Devices ({otherActiveDevices.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CURRENT DEVICE BANNER (IF DETECTED)                                */}
      {/* ------------------------------------------------------------------ */}
      {currentDevice && (
        <div className="mne-dev-current-card">
          <div className="mne-dev-current-glow" />
          <div className="mne-dev-current-inner">
            <div className="mne-dev-current-left">
              <div className="mne-dev-current-icon-box">
                {getDeviceIcon(currentDevice.device_type)}
              </div>
              <div className="mne-dev-current-info">
                <div className="mne-dev-current-tag-row">
                  <span className="mne-dev-current-badge">
                    <Activity className="h-3 w-3" />
                    <span>THIS DEVICE (CURRENT SESSION)</span>
                  </span>
                  {renderStatusBadge(currentDevice)}
                </div>
                <h3 className="mne-dev-current-name">{currentDevice.device_name}</h3>
                <div className="mne-dev-meta-list">
                  <span className="mne-dev-meta-item">
                    <Globe className="h-3.5 w-3.5" />
                    {currentDevice.browser || 'Web Browser'}
                  </span>
                  <span className="mne-dev-meta-sep">•</span>
                  <span className="mne-dev-meta-item">
                    <Monitor className="h-3.5 w-3.5" />
                    {currentDevice.os || 'Desktop OS'}
                  </span>
                  <span className="mne-dev-meta-sep">•</span>
                  <span className="mne-dev-meta-item">
                    <Clock className="h-3.5 w-3.5" />
                    Active: {formatRelativeTime(currentDevice.last_active_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mne-dev-current-right">
              {currentDevice.is_trusted !== false ? (
                <div className="mne-dev-expiry-box">
                  <div className="mne-dev-expiry-label">TRUST EXPIRATION</div>
                  <div className="mne-dev-expiry-value">
                    {currentDevice.days_remaining !== undefined && currentDevice.days_remaining !== null
                      ? `${currentDevice.days_remaining} Days Remaining`
                      : 'Active 30 Days'}
                  </div>
                  <div className="mne-dev-expiry-sub">
                    Expires {formatDateTime(currentDevice.expires_at)}
                  </div>
                </div>
              ) : (
                <div className="mne-dev-expiry-box">
                  <div className="mne-dev-expiry-label">TRUST STATUS</div>
                  <div className="mne-dev-expiry-value" style={{ color: '#93c5fd' }}>
                    Normal Login
                  </div>
                  <div className="mne-dev-expiry-sub">
                    Single Session (OTP required on next login)
                  </div>
                </div>
              )}
              <button
                onClick={() => setDeviceToRevoke(currentDevice)}
                className="mne-dev-revoke-btn"
                title="Revoke trust on this device"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Revoke Current Device</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ALL REGISTERED DEVICES LIST                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="mne-dev-section-title-row">
        <h3 className="mne-dev-section-title">
          All Registered Devices ({devices.length})
        </h3>
        <span className="mne-dev-section-sub">
          Authenticated devices tracked with server-side authorization and strict RLS.
        </span>
      </div>

      {isLoading ? (
        <div className="mne-dev-empty-box">
          <RefreshCw className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="mne-dev-empty-text">Loading registered login devices...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="mne-dev-empty-box">
          <ShieldCheck className="h-10 w-10 text-emerald-400 mb-2" />
          <h4 className="mne-dev-empty-title">No Devices Registered</h4>
          <p className="mne-dev-empty-text">
            When you sign in as an admin through the portal, your authenticated workstation will be registered here.
          </p>
        </div>
      ) : (
        <div className="mne-dev-grid">
          {devices.map((device) => {
            const isCurr = Boolean(device.isCurrent);
            const isRevoked = device.status === 'revoked';
            const isTrusted = device.is_trusted !== false;
            const isExpired = isTrusted && (device.status === 'expired' || (device.expires_at && new Date(device.expires_at) <= new Date()));

            return (
              <div
                key={device.id}
                className={`mne-dev-card ${isCurr ? 'mne-dev-card-current' : ''} ${
                  isRevoked ? 'mne-dev-card-revoked' : ''
                }`}
              >
                <div className="mne-dev-card-top">
                  <div className="mne-dev-card-type-row">
                    <div className="mne-dev-type-badge">
                      {getDeviceIcon(device.device_type)}
                      <span className="capitalize">{device.device_type || 'Device'}</span>
                    </div>
                    <div className="mne-dev-status-wrap">
                      {isCurr && (
                        <span className="mne-dev-curr-pill">Current Device</span>
                      )}
                      {renderStatusBadge(device)}
                    </div>
                  </div>

                  <h4 className="mne-dev-card-name" title={device.device_name}>
                    {device.device_name}
                  </h4>

                  <div className="mne-dev-card-specs">
                    <div className="mne-dev-spec-item">
                      <span className="mne-dev-spec-label">Browser:</span>
                      <span className="mne-dev-spec-val">{device.browser || 'Unknown'}</span>
                    </div>
                    <div className="mne-dev-spec-item">
                      <span className="mne-dev-spec-label">OS:</span>
                      <span className="mne-dev-spec-val">{device.os || 'Unknown OS'}</span>
                    </div>
                  </div>
                </div>

                <div className="mne-dev-card-dates">
                  <div className="mne-dev-date-row">
                    <span className="mne-dev-date-label">
                      <Calendar className="h-3 w-3" /> Registered:
                    </span>
                    <span className="mne-dev-date-val">{formatDateTime(device.created_at)}</span>
                  </div>
                  <div className="mne-dev-date-row">
                    <span className="mne-dev-date-label">
                      <Clock className="h-3 w-3" /> Last Active:
                    </span>
                    <span className="mne-dev-date-val">
                      {formatRelativeTime(device.last_active_at)} ({formatDateTime(device.last_active_at)})
                    </span>
                  </div>
                  <div className="mne-dev-date-row">
                    <span className="mne-dev-date-label">
                      <ShieldCheck className="h-3 w-3" /> {isTrusted ? '30-Day Expiry:' : 'Trust Status:'}
                    </span>
                    <span className={`mne-dev-date-val ${isExpired ? 'text-amber-400' : ''}`}>
                      {isTrusted ? (
                        <>
                          {formatDateTime(device.expires_at)}
                          {device.days_remaining !== undefined && device.days_remaining !== null && !isExpired && !isRevoked && (
                            <span className="text-sky-400 ml-1">({device.days_remaining}d left)</span>
                          )}
                        </>
                      ) : (
                        <span style={{ color: '#93c5fd' }}>Normal Login (Requires OTP)</span>
                      )}
                    </span>
                  </div>
                </div>


                <div className="mne-dev-card-footer">
                  {isRevoked ? (
                    <span className="mne-dev-revoked-note">
                      Access revoked. Cannot be reused without fresh OTP verification.
                    </span>
                  ) : (
                    <button
                      onClick={() => setDeviceToRevoke(device)}
                      className="mne-dev-card-action-btn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{isCurr ? 'Revoke Current Device' : 'Revoke Device'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CONFIRMATION MODAL: REVOKE SINGLE DEVICE                           */}
      {/* ------------------------------------------------------------------ */}
      {deviceToRevoke && (
        <div className="vel-modal-backdrop" onClick={() => !actionLoading && setDeviceToRevoke(null)}>
          <div
            className="vel-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-device-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vel-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <h3 id="revoke-device-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Revoke Device Access?
                </h3>
              </div>
              <button
                disabled={actionLoading}
                onClick={() => setDeviceToRevoke(null)}
                aria-label="Close modal"
                style={{ background: 'transparent', border: 'none', color: 'var(--vel-text-tertiary)', cursor: 'pointer' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="vel-modal-body">
              <p style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                Are you sure you want to revoke <strong>{deviceToRevoke.device_name}</strong> ({deviceToRevoke.browser}, {deviceToRevoke.os})?
              </p>

              {deviceToRevoke.isCurrent ? (
                <div style={{
                  margin: '14px 0 0',
                  padding: '12px 14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: '#fca5a5',
                  lineHeight: 1.5
                }}>
                  <strong>Notice:</strong> This is your <em>current active device</em>. Revoking it will clear your trusted cookie and immediately end your session. You will be redirected to the login portal.
                </div>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--vel-text-secondary)', marginTop: '8px' }}>
                  This device will lose its 30-day trusted status. The user on that browser will be logged out and required to complete email OTP verification before gaining access again.
                </p>
              )}
            </div>

            <div className="vel-modal-foot">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeviceToRevoke(null)}
                className="vel-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRevokeConfirm}
                className="vel-btn-danger"
              >
                {actionLoading ? 'Revoking Access...' : 'Confirm Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CONFIRMATION MODAL: SIGN OUT ALL OTHER DEVICES                     */}
      {/* ------------------------------------------------------------------ */}
      {showRevokeOthersModal && (
        <div className="vel-modal-backdrop" onClick={() => !actionLoading && setShowRevokeOthersModal(false)}>
          <div
            className="vel-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-others-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vel-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogOut className="h-5 w-5 text-amber-400" />
                <h3 id="revoke-others-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Sign Out Other Devices?
                </h3>
              </div>
              <button
                disabled={actionLoading}
                onClick={() => setShowRevokeOthersModal(false)}
                aria-label="Close modal"
                style={{ background: 'transparent', border: 'none', color: 'var(--vel-text-tertiary)', cursor: 'pointer' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="vel-modal-body">
              <p style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                This will revoke trust and terminate sessions on all other browsers and workstations (<strong>{otherActiveDevices.length} active devices</strong>).
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--vel-text-secondary)', marginTop: '8px' }}>
                Your current session on this computer will remain uninterrupted. Any other device attempting to access the admin portal will be forced to re-authenticate with credentials and email OTP.
              </p>
            </div>

            <div className="vel-modal-foot">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowRevokeOthersModal(false)}
                className="vel-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRevokeOthersConfirm}
                className="vel-btn-danger"
              >
                {actionLoading ? 'Signing Out Other Devices...' : 'Sign Out Other Devices'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
