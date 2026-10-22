import React, { useState } from 'react';
import { Smartphone, Save, Check, RotateCcw, BellRing } from 'lucide-react';
import WebsiteCMS from './WebsiteCMS';
import InstallPwaButton from '../InstallPwaButton';

const DEFAULT_SETTINGS = {
  studioName: 'MotionNodeEdits Studio',
  adminEmail: 'support@motionnodeedits.com',
  supportPhone: '+91 93902 46849',
  slackWebhook: '',
  notifyNewOrder: true,
  notifyDelivery: true,
  autoApproveClients: false
};

const STORAGE_KEY = 'mne_studio_settings';

export default function AdminSettings({
  activeNav,
  showToast
}) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_SETTINGS;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSavedSuccess(true);
      if (showToast) showToast('MotionNodeEdits studio preferences saved.');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      if (showToast) showToast(`Failed to save settings: ${err.message}`);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all studio settings to MotionNodeEdits defaults?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem(STORAGE_KEY);
      if (showToast) showToast('Settings restored to defaults.');
    }
  };

  return (
    <>
      {/* ============================================================== */}
      {/* VIEW 6: SETTINGS                                               */}
      {/* ============================================================== */}
      {activeNav === 'settings' && (
        <>
          <div className="vel-page-header">
            <h1 className="vel-page-h1">Settings</h1>
            <p className="vel-page-sub">Studio configuration, contact endpoints, notifications, and application preferences.</p>
          </div>

          <form onSubmit={handleSave} className="vel-card" style={{ maxWidth: '640px', gap: '20px' }}>
            <div className="vel-card-head" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              <span className="vel-card-title-sm">STUDIO IDENTITY & CONTACT</span>
            </div>

            <div className="vel-field-group">
              <label className="vel-label">Studio Name</label>
              <input
                type="text"
                value={settings.studioName}
                onChange={(e) => handleChange('studioName', e.target.value)}
                className="vel-input"
                placeholder="MotionNodeEdits Studio"
                required
              />
            </div>

            <div className="vel-form-grid-2">
              <div className="vel-field-group">
                <label className="vel-label">Admin Contact Email</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => handleChange('adminEmail', e.target.value)}
                  className="vel-input"
                  placeholder="support@motionnodeedits.com"
                  required
                />
              </div>

              <div className="vel-field-group">
                <label className="vel-label">Support WhatsApp / Phone</label>
                <input
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                  className="vel-input"
                  placeholder="+91 93902 46849"
                />
              </div>
            </div>

            <div className="vel-card-head" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BellRing className="h-4 w-4 text-white/50" />
                <span className="vel-card-title-sm">NOTIFICATION CHANNELS & WEBHOOKS</span>
              </div>
            </div>

            <div className="vel-field-group">
              <label className="vel-label">Slack / Discord Webhook URL (Optional)</label>
              <input
                type="url"
                value={settings.slackWebhook}
                onChange={(e) => handleChange('slackWebhook', e.target.value)}
                className="vel-input"
                placeholder="https://hooks.slack.com/services/..."
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--vel-text-secondary)', marginTop: '4px' }}>
                Receive immediate studio alerts for new orders and milestone approvals.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--vel-text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.notifyNewOrder}
                  onChange={(e) => handleChange('notifyNewOrder', e.target.checked)}
                  style={{ accentColor: '#22c55e', width: '16px', height: '16px' }}
                />
                <span>Email notification whenever a client submits a new project</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: 'var(--vel-text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.notifyDelivery}
                  onChange={(e) => handleChange('notifyDelivery', e.target.checked)}
                  style={{ accentColor: '#22c55e', width: '16px', height: '16px' }}
                />
                <span>Alert admin immediately when an editor uploads a deliverable cut</span>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                className="vel-btn-solid"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {savedSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                <span>{savedSuccess ? 'Preferences Saved' : 'Save Preferences'}</span>
              </button>

              <button
                type="button"
                className="vel-btn-outline"
                onClick={handleReset}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Defaults</span>
              </button>
            </div>
          </form>

          {/* Web & Mobile App Installation Card */}
          <div className="vel-card" style={{ maxWidth: '640px', marginTop: '24px' }}>
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
