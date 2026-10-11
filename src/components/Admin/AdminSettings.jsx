import React from 'react';
import { Smartphone } from 'lucide-react';
import WebsiteCMS from './WebsiteCMS';
import InstallPwaButton from '../InstallPwaButton';

export default function AdminSettings({
  activeNav,
  showToast
}) {
  return (
    <>
      {/* ============================================================== */}
      {/* VIEW 6: SETTINGS                                               */}
      {/* ============================================================== */}
      {activeNav === 'settings' && (
        <>
          <div className="vel-page-header">
            <h1 className="vel-page-h1">Settings</h1>
            <p className="vel-page-sub">Studio configuration, integration webhooks, and team roles.</p>
          </div>

          <div className="vel-card" style={{ maxWidth: '600px' }}>
            <div className="vel-field-group">
              <label className="vel-label">Studio Name</label>
              <input type="text" defaultValue="Velocity Edit Studio" className="vel-input" />
            </div>

            <div className="vel-field-group">
              <label className="vel-label">Admin Contact Email</label>
              <input type="email" defaultValue="admin@velocitystudio.io" className="vel-input" />
            </div>

            <div className="vel-field-group">
              <label className="vel-label">Slack Notification Webhook</label>
              <input type="text" defaultValue="https://hooks.slack.com/services/T00/B00/XXXX" className="vel-input" />
            </div>

            <button
              className="vel-btn-solid"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => showToast && showToast('Studio settings saved.')}
            >
              Save Preferences
            </button>
          </div>

          {/* Web & Mobile App Installation Card */}
          <div className="vel-card" style={{ maxWidth: '600px', marginTop: '24px' }}>
            <div className="vel-card-head" style={{ paddingBottom: 0 }}>
              <div className="vel-card-title-sm">
                <Smartphone style={{ width: '15px', height: '15px' }} />
                <span>Mobile & Desktop Web App</span>
              </div>
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'var(--vel-text-secondary)', border: '1px solid var(--vel-border)' }}>
                Offline Ready
              </span>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--vel-text-secondary)', lineHeight: 1.55, margin: 0 }}>
              Add MotionNode Admin Control Room to your iPhone, Android phone, or computer. Runs borderless in full screen with fast launch, zero address bars, and instant access.
            </p>

            <div style={{ alignSelf: 'flex-start', paddingTop: '4px' }}>
              <InstallPwaButton variant="vel-btn" />
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* VIEW: WEBSITE CONTENT MANAGEMENT (CMS)                        */}
      {/* ============================================================== */}
      {activeNav === 'cms' && (
        <WebsiteCMS />
      )}
    </>
  );
}
