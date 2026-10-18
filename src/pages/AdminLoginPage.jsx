import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, KeyRound, Eye, EyeOff, Loader2, Shield, ArrowLeft, RefreshCw, Check } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { isAdmin } from '../lib/auth/authUtils';
import {
  validateCurrentDevice,
  registerCurrentDevice,
  requestAdminEmailOtp,
  verifyAdminEmailOtp
} from '../lib/auth/deviceManager';
import './adminLogin.css';

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Authentication Stage: 'credentials' | 'otp'
  const [authStage, setAuthStage] = useState('credentials');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [stagedSession, setStagedSession] = useState(null);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [devCodeHint, setDevCodeHint] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  useEffect(() => {
    let isMounted = true;

    // Check notice query parameter
    try {
      const params = new URLSearchParams(window.location.search);
      const noticeParam = params.get('notice');
      if (noticeParam === 'portal_required') {
        setErrorMessage('Access Restricted: You must authenticate directly through this Admin Portal.');
      }
    } catch {
      // ignore
    }

    async function checkCurrentSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.warn('[AdminLogin] Session profile lookup warning:', profileError);
          }

          const isUserAdmin = isAdmin(profile) || isAdmin(session.user);
          const authOrigin = (sessionStorage.getItem('mne_admin_auth_origin') || localStorage.getItem('mne_admin_auth_origin'));

          if (isUserAdmin && authOrigin === 'admin/login') {
            // Check trusted device status to ensure session validity
            const deviceCheck = await validateCurrentDevice(session.user.id);
            if (deviceCheck.valid) {
              setSuccessMessage('Active admin session detected. Redirecting to Dashboard...');
              setAuthSuccess(true);
              setTimeout(() => {
                window.location.href = '/dashboard/admin';
              }, 700);
            }
          } else if (!isUserAdmin) {
            // Clear unverified session
            await supabase.auth.signOut();
            sessionStorage.removeItem('mne_admin_auth_origin');
            localStorage.removeItem('mne_admin_auth_origin');
          }
        }
      } catch (err) {
        console.warn('[AdminLogin] Session validation error:', err);
      }
    }

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage('');
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.username.trim() || !formData.password) {
      setErrorMessage('Please enter email, username, and password.');
      return;
    }
    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. Authenticate credentials with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('invalid_grant')) {
          setErrorMessage('Incorrect email or password. Please try again.');
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      // 2. Multi-Source Role Verification
      if (data?.session && data?.user) {
        let profile = null;
        let profileError = null;

        try {
          const res = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          profile = res.data;
          profileError = res.error;
        } catch (queryErr) {
          profileError = queryErr;
        }

        if (profileError) {
          console.error('[AdminLogin] Profile retrieval error:', profileError);
        }

        const isUserAdmin = isAdmin(profile) || isAdmin(data.user);

        if (!isUserAdmin) {
          await supabase.auth.signOut();
          setErrorMessage('Access Denied: This account does not have administrator privileges.');
          setIsLoading(false);
          return;
        }

        // 3. Strict Username Verification
        const inputUsername = formData.username.trim().toLowerCase();
        const dbUsername = (profile?.username || '').toLowerCase().trim();
        const dbFullName = (profile?.full_name || '').toLowerCase().trim();
        const emailPrefix = (profile?.email || data.user.email || '').split('@')[0].toLowerCase().trim();

        let isUsernameValid = false;
        if (dbUsername) {
          isUsernameValid = (inputUsername === dbUsername);
        } else {
          isUsernameValid = (inputUsername === dbFullName || inputUsername === emailPrefix || inputUsername === 'admin');
          if (isUsernameValid) {
            try {
              await supabase.from('profiles').update({ username: formData.username.trim() }).eq('id', data.user.id);
            } catch (uErr) {
              console.warn('[AdminLogin] Username update fallback:', uErr);
            }
          }
        }

        if (!isUsernameValid) {
          await supabase.auth.signOut();
          setErrorMessage('Invalid administrator username.');
          setIsLoading(false);
          return;
        }

        // 4. Check if current device is already recognized & trusted (< 30 days)
        const deviceValidation = await validateCurrentDevice(data.user.id);

        if (deviceValidation.valid) {
          // Device is trusted and valid! Bypass OTP
          try {
            sessionStorage.setItem('mne_admin_auth_origin', 'admin/login');
            localStorage.setItem('mne_admin_auth_origin', 'admin/login');
          } catch {
            // ignore
          }

          setAuthSuccess(true);
          setSuccessMessage('Trusted device verified. Redirecting to Dashboard...');
          setTimeout(() => {
            window.location.href = '/dashboard/admin';
          }, 700);
          return;
        }

        // 5. Untrusted or expired device -> Request OTP
        setStagedSession({
          user: data.user,
          profile,
        });

        setIsLoading(true);
        const otpResult = await requestAdminEmailOtp(data.user.id, data.user.email);
        setIsLoading(false);

        if (!otpResult.success) {
          setErrorMessage(otpResult.error || 'Failed to dispatch security code. Please try again.');
          return;
        }

        if (otpResult.devCode) {
          setDevCodeHint(otpResult.devCode);
        }

        setOtpCountdown(otpResult.cooldownSeconds || 60);
        setAuthStage('otp');
        setSuccessMessage('Security verification code sent to your registered admin email.');
      } else {
        setIsLoading(false);
        setErrorMessage('No active session returned. Please try again.');
      }
    } catch (err) {
      console.error('[AdminLogin] Error during sign in:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during admin authentication.');
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    if (!stagedSession?.user) {
      setErrorMessage('Session expired. Please sign in again.');
      setAuthStage('credentials');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const verifyRes = await verifyAdminEmailOtp(
        stagedSession.user.id,
        stagedSession.user.email,
        otpCode.trim()
      );

      if (!verifyRes.success) {
        setIsLoading(false);
        setErrorMessage(verifyRes.error || 'Invalid or expired verification code.');
        return;
      }

      // Register device as trusted if Remember Device was selected
      if (rememberDevice) {
        await registerCurrentDevice(stagedSession.user.id, true);
      } else {
        await registerCurrentDevice(stagedSession.user.id, false);
      }

      // Establish admin clearance
      try {
        sessionStorage.setItem('mne_admin_auth_origin', 'admin/login');
        localStorage.setItem('mne_admin_auth_origin', 'admin/login');
      } catch {
        // ignore
      }

      setAuthSuccess(true);
      setSuccessMessage('Device verified successfully. Redirecting to Dashboard...');
      setTimeout(() => {
        window.location.href = '/dashboard/admin';
      }, 700);
    } catch (err) {
      console.error('[AdminLogin] OTP verification error:', err);
      setErrorMessage(err.message || 'Failed to verify security code.');
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0 || isResending || !stagedSession?.user) return;

    setIsResending(true);
    setErrorMessage('');

    try {
      const res = await requestAdminEmailOtp(stagedSession.user.id, stagedSession.user.email);
      if (res.success) {
        setOtpCountdown(res.cooldownSeconds || 60);
        if (res.devCode) {
          setDevCodeHint(res.devCode);
        }
        setSuccessMessage('A fresh verification code has been dispatched.');
      } else {
        setErrorMessage(res.error || 'Failed to resend code. Please wait before retrying.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToCredentials = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setStagedSession(null);
    setAuthStage('credentials');
    setOtpCode('');
    setDevCodeHint(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="admin-login-root">
      {/* Ambient background glow */}
      <div className="admin-bg-glow-radial" />

      {/* Outer Card Container — Centered */}
      <motion.div
        className="admin-outer-wrapper"
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Inner Card Container */}
        <div className="admin-inner-card">
          {/* Brand Header */}
          <div className="admin-card-brand-header">
            <img src="/image/mne_logo.png" alt="MotionNodeEdits" className="admin-brand-logo" />
            <div className="admin-brand-info">
              <h2 className="admin-brand-title">MotionNodeEdits</h2>
              <span className="admin-brand-badge">Studio Gateway</span>
            </div>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                className="admin-alert-banner admin-alert-banner-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {successMessage && (
              <motion.div
                className="admin-alert-banner admin-alert-banner-success"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================== */}
          {/* STAGE 1: CREDENTIALS FORM                                  */}
          {/* ========================================================== */}
          {authStage === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="admin-login-form" noValidate>
              {/* ADMIN EMAIL */}
              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="admin-email">
                  ADMIN EMAIL
                </label>
                <div className="admin-input-box">
                  <span className="admin-input-icon-prefix">@</span>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading || authSuccess}
                    className="admin-input-field"
                  />
                </div>
              </div>

              {/* USERNAME */}
              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="admin-username">
                  USERNAME
                </label>
                <div className="admin-input-box">
                  <div className="admin-input-icon-prefix">
                    <User size={17} strokeWidth={2.2} />
                  </div>
                  <input
                    id="admin-username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={isLoading || authSuccess}
                    className="admin-input-field"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="admin-password">
                  PASSWORD
                </label>
                <div className="admin-input-box">
                  <div className="admin-input-icon-prefix">
                    <KeyRound size={17} strokeWidth={2.2} />
                  </div>
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading || authSuccess}
                    className="admin-input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="admin-eye-toggle"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={1.9} />
                    ) : (
                      <Eye size={18} strokeWidth={1.9} />
                    )}
                  </button>
                </div>
              </div>

              {/* REMEMBER THIS DEVICE (30-DAY TRUST) */}
              <div className="admin-remember-container">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    disabled={isLoading || authSuccess}
                    className="admin-checkbox-input"
                  />
                  <span className="admin-checkbox-text">
                    Remember this device for 30 days
                  </span>
                </label>
                <span className="admin-checkbox-hint">
                  Skip email verification on this browser for the next 30 days.
                </span>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isLoading || authSuccess}
                className="admin-signin-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Shield size={16} strokeWidth={2.2} />
                    <span>Authenticate Portal</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ========================================================== */
            /* STAGE 2: 6-DIGIT EMAIL OTP VERIFICATION                   */
            /* ========================================================== */
            <form onSubmit={handleOtpSubmit} className="admin-login-form" noValidate>
              <div className="admin-otp-header">
                <div className="admin-otp-badge">
                  <Shield size={13} strokeWidth={2.4} />
                  <span>Security Verification</span>
                </div>
                <h3 className="admin-otp-title">Enter 6-Digit Code</h3>
                <p className="admin-otp-subtitle">
                  A verification code was sent to{' '}
                  <span className="admin-otp-email-chip">{stagedSession?.user?.email}</span>. Valid for 10 minutes.
                </p>
                {devCodeHint && (
                  <div style={{
                    fontSize: '0.72rem',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px dashed rgba(16, 185, 129, 0.3)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    marginTop: '4px',
                    alignSelf: 'center'
                  }}>
                    Development Preview Code: <strong>{devCodeHint}</strong>
                  </div>
                )}
              </div>

              {/* OTP CODE INPUT */}
              <div className="admin-otp-input-wrap">
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="······"
                  value={otpCode}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(cleaned);
                    setErrorMessage('');
                  }}
                  disabled={isLoading || authSuccess}
                  className="admin-otp-code-input"
                />
              </div>

              {/* REMEMBER DEVICE NOTICE */}
              <div className="admin-remember-container" style={{ marginTop: '0' }}>
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    disabled={isLoading || authSuccess}
                    className="admin-checkbox-input"
                  />
                  <span className="admin-checkbox-text">
                    Trust this device for 30 days
                  </span>
                </label>
              </div>

              {/* VERIFY BUTTON */}
              <button
                type="submit"
                disabled={isLoading || authSuccess || otpCode.length !== 6}
                className="admin-signin-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <Shield size={16} strokeWidth={2.2} />
                    <span>Verify & Authorize Device</span>
                  </>
                )}
              </button>

              {/* ACTIONS: RESEND & BACK */}
              <div className="admin-otp-actions-row">
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  disabled={isLoading || authSuccess}
                  className="admin-otp-text-btn"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || authSuccess || otpCountdown > 0 || isResending}
                  className="admin-otp-text-btn"
                >
                  <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
                  <span>
                    {otpCountdown > 0 ? `Resend code in ${otpCountdown}s` : 'Resend Code'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>

      {/* Bottom glowing accent line */}
      <div className="admin-bottom-accent-line" />
    </div>
  );
}

