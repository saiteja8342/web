import React from 'react';
import {
  User,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { isGoogleUser } from '../../lib/auth/authUtils';
import InstallPwaButton from '../InstallPwaButton';

export default function ClientProfileSettings({
  clientProfile,
  currentUser,
  getAccountAvatar,
  defaultAvatar,
  profileSubTab,
  setProfileSubTab,
  profileForm,
  setProfileForm,
  handleUpdateProfile,
  isSavingProfile,
  hasProfileChanges,
  handleChangePassword,
  passwordForm,
  setPasswordForm,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isChangingPassword,
  hasPasswordChanges
}) {
  return (
    <>
      <div className="cp-header-block">
        <h1 className="cp-title-h1">Profile & Security</h1>
        <p className="cp-subtext">Manage your profile, personal details, and account security.</p>
      </div>

      <div className="cp-profile-layout">
        {/* Left Column: Summary Card & Navigation Tabs */}
        <div className="cp-profile-left-col">
          {/* Top Card: Account Profile Settings Summary */}
          <div className="cp-profile-summary-card">
            <div className="cp-avatar-wrap">
              <img
                src={getAccountAvatar()}
                alt={clientProfile?.full_name || 'Client'}
                className="cp-avatar-img"
                onError={(e) => {
                  if (defaultAvatar) e.currentTarget.src = defaultAvatar;
                }}
              />
            </div>

            <div>
              <span className="cp-profile-card-label">ACCOUNT</span>
              <h2 className="cp-profile-card-title">Profile Settings</h2>
              <p className="cp-profile-card-desc">
                Update your account details, change your password, and manage account security.
              </p>
            </div>
          </div>

          {/* Bottom Card: Navigation Menu */}
          <div className="cp-profile-subnav-card">
            <button
              type="button"
              className={`cp-profile-subnav-btn ${profileSubTab === 'profile' ? 'active' : ''}`}
              onClick={() => setProfileSubTab('profile')}
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </button>
            <button
              type="button"
              className={`cp-profile-subnav-btn ${profileSubTab === 'password' ? 'active' : ''}`}
              onClick={() => setProfileSubTab('password')}
            >
              <Eye className="h-4 w-4" />
              <span>Change Password</span>
            </button>
            <button
              type="button"
              className={`cp-profile-subnav-btn ${profileSubTab === 'app' ? 'active' : ''}`}
              onClick={() => setProfileSubTab('app')}
            >
              <Smartphone className="h-4 w-4" />
              <span>Mobile & Web App</span>
            </button>
          </div>
        </div>

        {/* Right Column: Active Tab Content */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div className="cp-profile-main-card">
            {profileSubTab === 'app' ? (
              /* TAB: Install Web App */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="cp-profile-main-header">
                  <span className="cp-profile-tag">APPLICATION</span>
                  <h2 className="cp-profile-main-title">Mobile & Desktop App</h2>
                  <p className="cp-profile-main-subtext">
                    Install MotionNode as a standalone app on your iPhone, Android phone, or computer. Runs full-screen with instant 1-tap access.
                  </p>
                </div>

                <div className="cp-profile-helper-box" style={{ lineHeight: 1.6 }}>
                  Access your client orders, timestamped video revisions, and project downloads directly from your home screen just like a native mobile app without any browser URL bar.
                </div>

                <InstallPwaButton variant="cp-btn" />
              </div>
            ) : profileSubTab === 'profile' ? (
              /* TAB 1: Personal Information */
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="cp-profile-main-header">
                  <span className="cp-profile-tag">PROFILE</span>
                  <h2 className="cp-profile-main-title">Personal Information</h2>
                  <p className="cp-profile-main-subtext">
                    Keep your account details up to date so support and service access stay aligned.
                  </p>
                </div>

                <div className="cp-form-group">
                  <label className="cp-form-label">
                    <span className="cp-form-required">*</span> Username
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm(p => ({ ...p, username: e.target.value }))}
                    placeholder="Username"
                    className="cp-form-input"
                    required
                  />
                </div>

                <div className="cp-form-group">
                  <label className="cp-form-label">
                    <span className="cp-form-required">*</span> Email
                  </label>
                  <div className="cp-form-input-wrap">
                    <input
                      type="email"
                      value={clientProfile?.email || currentUser?.email || ''}
                      disabled
                      className="cp-form-input"
                      style={{ paddingRight: '36px' }}
                    />
                    <Lock className="h-4 w-4" style={{ position: 'absolute', right: '12px', color: 'var(--cp-text-tertiary)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div className="cp-form-group">
                    <label className="cp-form-label">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Your full name"
                      className="cp-form-input"
                    />
                  </div>

                  <div className="cp-form-group">
                    <label className="cp-form-label">Company / Brand</label>
                    <input
                      type="text"
                      value={profileForm.company_name}
                      onChange={(e) => setProfileForm(p => ({ ...p, company_name: e.target.value }))}
                      placeholder="e.g. Acme Media"
                      className="cp-form-input"
                    />
                  </div>
                </div>

                <div className="cp-form-group">
                  <label className="cp-form-label">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="cp-form-input"
                  />
                </div>

                <div className="cp-profile-helper-box">
                  Your email is used for account recovery, service updates, and support communication.
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile || !hasProfileChanges}
                  className="cp-btn-primary-action"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              /* TAB 2: Change Password */
              <div>
                <div className="cp-profile-main-header" style={{ marginBottom: '18px' }}>
                  <span className="cp-profile-tag">SECURITY</span>
                  <h2 className="cp-profile-main-title">Change Password</h2>
                  <p className="cp-profile-main-subtext">
                    Choose a strong password you do not reuse on other services.
                  </p>
                </div>

                {isGoogleUser(currentUser) ? (
                  <div style={{ background: 'var(--cp-bg-card-inner)', border: '1px solid var(--cp-border)', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: '#FFFFFF', marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '0.86rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                        Signed in with Google
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--cp-text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                        Your account is authenticated securely via Google OAuth. To update your password or login security, manage your settings directly in your Google Account.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div className="cp-form-group">
                      <label className="cp-form-label">
                        <span className="cp-form-required">*</span> Current Password
                      </label>
                      <div className="cp-form-input-wrap">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                          placeholder="Current password"
                          className="cp-form-input"
                          style={{ paddingRight: '40px' }}
                          required
                        />
                        <button
                          type="button"
                          className="cp-input-eye-btn"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          tabIndex={-1}
                          aria-label="Toggle current password visibility"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="cp-form-group">
                      <label className="cp-form-label">
                        <span className="cp-form-required">*</span> New Password
                      </label>
                      <div className="cp-form-input-wrap">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                          placeholder="New password"
                          className="cp-form-input"
                          style={{ paddingRight: '40px' }}
                          required
                        />
                        <button
                          type="button"
                          className="cp-input-eye-btn"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          tabIndex={-1}
                          aria-label="Toggle new password visibility"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="cp-form-group">
                      <label className="cp-form-label">
                        <span className="cp-form-required">*</span> Confirm Password
                      </label>
                      <div className="cp-form-input-wrap">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                          placeholder="Confirm password"
                          className="cp-form-input"
                          style={{ paddingRight: '40px' }}
                          required
                        />
                        <button
                          type="button"
                          className="cp-input-eye-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                          aria-label="Toggle confirm password visibility"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="cp-profile-helper-box">
                      Use at least one unique password for MotionNodeEdits and rotate it if you share device access.
                    </div>

                    <button
                      type="submit"
                      disabled={isChangingPassword || !hasPasswordChanges}
                      className="cp-btn-primary-action"
                    >
                      {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Centered Brand Copyright Footer */}
          <div className="cp-profile-footer">
            MotionNodeEdits 2026
          </div>
        </div>
      </div>
    </>
  );
}
