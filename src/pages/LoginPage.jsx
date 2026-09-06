import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

import CustomCursor from '../components/CustomCursor';
import { supabase, signInWithGoogle } from '../supabaseClient';
import { isGoogleUser, isAdmin } from '../lib/auth/authUtils';
import './login.css';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Password Recovery Mode States (when user clicks reset link in email)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    rememberMe: true,
    agreeTerms: true,
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle URL query parameters and recovery mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const emailParam = params.get('email');
      const signupSuccessParam = params.get('signup_success');
      const typeParam = params.get('type');

      // Check URL hash for recovery token (e.g. #access_token=...&type=recovery)
      const hash = window.location.hash ? window.location.hash.substring(1) : '';
      const hashParams = new URLSearchParams(hash);
      if (typeParam === 'recovery' || hashParams.get('type') === 'recovery') {
        setIsRecoveryMode(true);
      }

      if (tabParam === 'signup' || tabParam === 'register') {
        setActiveTab('signup');
      } else if (tabParam === 'signin') {
        setActiveTab('signin');
      }

      if (emailParam) {
        setFormData((prev) => ({
          ...prev,
          email: emailParam,
        }));
      }

      if (signupSuccessParam === 'true' || signupSuccessParam === '1') {
        setActiveTab('signin');
        setSuccessMessage('Registration submitted! Your account is pending admin approval. Once approved, you will be able to log in.');
      }

      const statusParam = params.get('status');
      if (statusParam === 'pending') {
        setActiveTab('signin');
        setErrorMessage('⏳ Your account is pending admin approval. You will be able to log in once an administrator approves your account.');
      }

      // If an existing admin session is detected on public login, silently terminate it
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(({ data: p }) => {
              if ((p?.role || '').toLowerCase().trim() === 'admin') {
                supabase.auth.signOut();
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('mne_admin_auth_origin');
                  localStorage.removeItem('mne_admin_auth_origin');
                }
              }
            });
        }
      });
    }

    // Listen for Supabase auth state change (e.g. PASSWORD_RECOVERY event when user opens email reset link)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (activeTab === 'signup' && !formData.fullName) {
      setErrorMessage('Please enter your full name or brand name.');
      return;
    }
    if (activeTab === 'signup' && !formData.agreeTerms) {
      setErrorMessage('Please accept the Terms of Service & Privacy Policy to sign up.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (activeTab === 'signup') {
        const signupEmail = (formData.email || '').trim().toLowerCase();

        // 1. BLOCK SIGNUP WITH ADMIN EMAIL
        try {
          const { data: rpcData } = await supabase.rpc('check_can_reset_password', {
            target_email: signupEmail,
          });
          if (rpcData && rpcData.allowed === false) {
            setErrorMessage('Access Denied: Registration is strictly blocked for this email address.');
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('[Signup] Admin validation check:', err);
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: 'client',
            },
          },
        });

        if (error) {
          // If already registered and is an admin
          try {
            const { data: rpcData } = await supabase.rpc('check_can_reset_password', {
              target_email: signupEmail,
            });
            if (rpcData && rpcData.allowed === false) {
              setErrorMessage('Access Denied: Registration is strictly blocked for this email address.');
              setIsLoading(false);
              return;
            }
          } catch (_) {}
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }

        // If user already exists in auth.users (empty identities)
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          try {
            const { data: rpcData } = await supabase.rpc('check_can_reset_password', {
              target_email: signupEmail,
            });
            if (rpcData && rpcData.allowed === false) {
              setErrorMessage('Access Denied: Registration is strictly blocked for this email address.');
              setIsLoading(false);
              return;
            }
          } catch (_) {}
          setErrorMessage('An account with this email address already exists. Please sign in.');
          setIsLoading(false);
          return;
        }

        // Direct profile provisioning fallback with pending status
        if (data?.user?.id) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: formData.fullName,
              email: formData.email,
              role: 'client',
              status: 'pending',
            });
          } catch (pErr) {
            console.warn('Profile direct provision:', pErr);
          }
        }

        // If Supabase gave an immediate session, sign out so unapproved user cannot access dashboard
        if (data?.session) {
          await supabase.auth.signOut();
        }

        // Switch to Sign In tab, keep/pre-fill the email, clear password
        setActiveTab('signin');
        setFormData((prev) => ({
          ...prev,
          email: signupEmail,
          password: '',
        }));
        setSuccessMessage('Registration submitted! Your account is currently pending administrator approval. Once approved, you will be able to sign in.');
        setIsLoading(false);

        // Update URL query parameters so if refreshed, the state and email persist
        if (typeof window !== 'undefined') {
          const loginPath = window.location.pathname.includes('.html') ? '/login.html' : '/login';
          const newUrl = `${loginPath}?tab=signin&email=${encodeURIComponent(signupEmail)}&signup_success=true`;
          window.history.replaceState({}, '', newUrl);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setErrorMessage('Email not confirmed. Please check your inbox or disable "Confirm Email" in your Supabase Auth settings.');
          } else {
            setErrorMessage(error.message);
          }
          setIsLoading(false);
          return;
        }

        // Check profiles table and read the user's role and approval status
        if (data?.session && data?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, status')
              .eq('id', data.user.id)
              .maybeSingle();

            const role = (profile?.role || '').toLowerCase().trim();
            const status = (profile?.status || '').toLowerCase().trim();
            const userIsGoogle = isGoogleUser(data.user);

            // Block access if account was rejected or suspended by administrator
            if (role !== 'admin' && status === 'rejected') {
              await supabase.auth.signOut();
              setErrorMessage('Your account was suspended or declined by an administrator. Please contact support.');
              setIsLoading(false);
              return;
            }

            // Google OAuth users bypass pending approval!
            if (!userIsGoogle && role !== 'admin' && status === 'pending') {
              await supabase.auth.signOut();
              setErrorMessage('⏳ Your account is pending administrator approval. You will be able to log in once an admin approves your account.');
              setIsLoading(false);
              return;
            }

            // If Google user is pending, auto-approve in DB
            if (userIsGoogle && status !== 'approved') {
              try {
                await supabase.from('profiles').update({ status: 'approved' }).eq('id', data.user.id);
              } catch (_) {}
            }

            // STRICT RULE: Admins CANNOT log in from normal /login.
            // Pretend the account does not exist on this client login panel for security!
            if (role === 'admin') {
              await supabase.auth.signOut();
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('mne_admin_auth_origin');
                localStorage.removeItem('mne_admin_auth_origin');
              }
              setErrorMessage('We cannot find any account with this email address. Please sign up first.');
              setIsLoading(false);
              return;
            }

            if (role === 'editor') {
              window.location.href = '/dashboard/editor';
            } else {
              window.location.href = '/dashboard/client';
            }
          } catch (err) {
            // Default fallback if query fails
            window.location.href = '/dashboard/client';
          }
        } else {
          setIsLoading(false);
          setErrorMessage('No active session found. Please try again.');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${baseOrigin}/dashboard/client`;

      const { data, error } = await signInWithGoogle({
        redirectTo: redirectUrl,
      });

      if (error) {
        setErrorMessage(`Google sign-in is currently unavailable: ${error.message}`);
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Google sign-in is not configured. Please use email and password.');
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider) => {
    if (provider.toLowerCase() === 'google') {
      return handleGoogleLogin();
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const envSiteUrl = import.meta.env.VITE_SITE_URL;
      const baseOrigin = (envSiteUrl && envSiteUrl.startsWith('http'))
        ? envSiteUrl.replace(/\/$/, '')
        : (typeof window !== 'undefined' ? window.location.origin : '');
      const redirectUrl = `${baseOrigin}/dashboard/client`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.toLowerCase(),
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        setErrorMessage(`${provider} sign-in is currently unavailable: ${error.message}`);
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage(`${provider} sign-in is not configured. Please use email and password.`);
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const emailToReset = forgotEmail ? forgotEmail.trim() : '';
    if (!emailToReset) return;

    setForgotLoading(true);
    setForgotError('');

    try {
      // 1. Privacy-preserving security check:
      try {
        const { data: rpcData } = await supabase.rpc('check_can_reset_password', {
          target_email: emailToReset
        });
        if (rpcData && rpcData.allowed === false) {
          // Silently withhold reset dispatch for admin accounts without revealing their role
          setForgotSubmitted(true);
          setForgotLoading(false);
          return;
        }
      } catch (err) {
        // Fallback: proceed to standard flow
      }

      // 2. Dispatch Supabase password reset email with recovery redirect link
      const envSiteUrl = import.meta.env.VITE_SITE_URL;
      const baseOrigin = (envSiteUrl && envSiteUrl.startsWith('http'))
        ? envSiteUrl.replace(/\/$/, '')
        : (typeof window !== 'undefined' ? window.location.origin : '');
      const redirectUrl = `${baseOrigin}/login?type=recovery`;
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: redirectUrl,
      });

      if (error) {
        // Only show technical error if it's a rate limit or network issue
        console.warn('[Password Reset] Notice:', error.message);
      }

      // Always show generic confirmation to prevent user enumeration
      setForgotSubmitted(true);
      setForgotLoading(false);
    } catch (err) {
      setForgotSubmitted(true);
      setForgotLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setRecoveryError('Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setRecoveryError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError('Passwords do not match. Please re-enter.');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError('');

    try {
      // 1. Capture user's email so we can pre-fill it on the Sign In form
      let userEmail = '';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          userEmail = user.email;
        }
      } catch (e) {
        // ignore if not available
      }

      // 2. Update password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setRecoveryError(error.message || 'Failed to update password.');
        setRecoveryLoading(false);
        return;
      }

      // 3. Explicitly sign out so the user must authenticate with the new password
      await supabase.auth.signOut();

      setRecoverySuccess(true);
      setRecoveryLoading(false);

      // 4. Return to Sign In screen after short delay
      setTimeout(() => {
        setIsRecoveryMode(false);
        setRecoverySuccess(false);
        setNewPassword('');
        setConfirmPassword('');
        setActiveTab('signin');
        if (userEmail) {
          setFormData((prev) => ({ ...prev, email: userEmail, password: '' }));
        }
        setSuccessMessage('Password changed successfully! Please sign in with your new password.');

        // Clean up URL parameters and recovery hash
        if (typeof window !== 'undefined') {
          const loginPath = window.location.pathname.includes('.html') ? '/login.html' : '/login';
          window.history.replaceState({}, '', `${loginPath}?tab=signin&password_reset=success`);
        }
      }, 1500);
    } catch (err) {
      setRecoveryError(err.message || 'An unexpected error occurred.');
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="auth-page-root">
      <CustomCursor />

      {/* Ambient background glows */}
      <div className="auth-ambient-glow-1" />
      <div className="auth-ambient-glow-2" />
      <div className="auth-grid-bg" />

      {/* Top Header */}
      <header className="auth-header">
        <a href="/" className="nav-logo" data-hover-type="link" style={{ textDecoration: 'none' }}>
          <span className="logo-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/image/mne_logo.png" 
              alt="MotionNodeEdits Logo"
              className="logo-img-circular"
              width="36"
              height="36"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.12)'
              }}
            />
            <div className="nav-logo-text-wrap" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span className="nav-logo-brand" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF' }}>
                MotionNodeEdits
              </span>
              <span className="nav-logo-subtitle" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                Client & Creator Workspace
              </span>
            </div>
          </span>
        </a>

        <a href="/" className="auth-back-link" data-hover-type="link">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </a>
      </header>

      {/* Main Container */}
      <main className="auth-main-container">
        {/* Centered Glassmorphism Login / Signup Card */}
        <div className="auth-form-card-wrapper">
          <div className="auth-form-card">
            {/* Header Tabs */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
                onClick={() => { setActiveTab('signin'); setErrorMessage(''); }}
                data-hover-type="link"
              >
                <Lock className="h-4 w-4" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => { setActiveTab('signup'); setErrorMessage(''); setSuccessMessage(''); }}
                data-hover-type="link"
              >
                <span>Sign Up</span>
              </button>
            </div>

            {/* Social Authentication */}
            <div className="auth-social-buttons">
              <button
                type="button"
                className="auth-social-btn"
                onClick={handleGoogleLogin}
                data-hover-type="link"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.54 0 2.93.56 4.02 1.48l3.01-3.01C17.21 1.77 14.77 1 12 1 7.42 1 3.49 3.6 1.63 7.37l3.65 2.83C6.16 7.43 8.84 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.16-1.99 3.71-4.94 3.71-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.2c-.22-.66-.35-1.36-.35-2.2s.13-1.54.35-2.2L1.63 6.97C.59 9.05 0 11.45 0 14s.59 4.95 1.63 7.03l3.65-2.83z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.07.73-2.45 1.16-4.22 1.16-3.16 0-5.84-2.43-6.72-5.2L1.63 15.97C3.49 19.74 7.42 23 12 23z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            {/* Success Message display ABOVE the form */}
            {activeTab === 'signin' && successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  color: '#4ade80',
                  fontSize: '0.84rem',
                  lineHeight: '1.45',
                  marginBottom: '16px'
                }}
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeTab === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="auth-form-group"
                >
                  <label className="auth-label" htmlFor="fullName">
                    Full Name or Studio / Brand Name
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Alex Morgan / Apex Media"
                      value={formData.fullName}
                      onChange={handleChange}
                      required={activeTab === 'signup'}
                      data-hover-type="link"
                    />
                  </div>
                </motion.div>
              )}

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="email">
                  Business Email
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="auth-input"
                    placeholder="alex@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    data-hover-type="link"
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <div className="auth-label">
                  <label htmlFor="password">Password</label>
                </div>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    data-hover-type="link"
                  />
                  <button
                    type="button"
                    className="auth-input-action-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    data-hover-type="link"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              {activeTab === 'signin' ? (
                <div className="auth-options-row" style={{ justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="auth-forgot-btn"
                    onClick={() => { setForgotModalOpen(true); setForgotSubmitted(false); }}
                    data-hover-type="link"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : (
                <div className="auth-options-row" style={{ alignItems: 'center', gap: '10px', justifyContent: 'flex-start' }}>
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="agreeTerms">
                      <div className="tick_mark"></div>
                    </label>
                  </div>
                  <label htmlFor="agreeTerms" style={{ fontSize: '0.8rem', lineHeight: '1.4', cursor: 'pointer', margin: 0, color: 'var(--text-secondary, #8E8F94)' }}>
                    I agree to the{' '}
                    <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: '#FF6496', textDecoration: 'underline' }} data-hover-type="link">
                      Terms of Service
                    </a>{' '}
                    & Privacy Policy
                  </label>
                </div>
              )}

              {/* Submit CTA */}
              <div className="auth-submit-btn-wrapper">
                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isLoading}
                  data-hover-type="link"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{activeTab === 'signin' ? 'Authenticating...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <span>{activeTab === 'signin' ? 'Sign In to Workspace' : 'Sign Up'}</span>
                  )}
                </button>
              </div>

              {activeTab === 'signin' && (
                <p className="auth-terms-note">
                  By continuing, you agree to MotionNodeEdits's{' '}
                  <a href="/terms.html" target="_blank" rel="noopener noreferrer" data-hover-type="link">
                    Terms of Service
                  </a>{' '}
                  and Privacy Notice.
                </p>
              )}
            </form>

            {/* Error Message display under the form */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.84rem',
                  marginTop: '16px'
                }}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {authSuccess && (
          <div className="auth-modal-backdrop">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="auth-modal-card"
            >
              <div className="auth-modal-icon-wrap">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                  {activeTab === 'signin' ? 'Welcome Back!' : 'Account Created Successfully!'}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {activeTab === 'signin'
                    ? `Logged in as ${formData.email || 'Client'}. Launching your studio dashboard...`
                    : `Welcome to MotionNodeEdits, ${formData.fullName || 'Creator'}! Your account has been created.`}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <a
                  href="/dashboard/client"
                  className="auth-submit-btn"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                  data-hover-type="link"
                >
                  Continue to Portal
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="auth-modal-backdrop" onClick={() => setForgotModalOpen(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="auth-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>
                Reset Your Password
              </h3>

              {forgotError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  marginTop: '12px'
                }}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSubmitted ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '0.9rem' }}>
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>Reset link sent to <strong>{forgotEmail}</strong></span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Please check your inbox and spam folder. Click the secure link in the email to set your new password and regain access to your workspace.
                  </p>
                  <button
                    type="button"
                    className="auth-submit-btn"
                    onClick={() => { setForgotModalOpen(false); setForgotSubmitted(false); }}
                    style={{ marginTop: '8px' }}
                    data-hover-type="link"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Enter your registered email address. We will verify your account and send a secure link to create a new password.
                  </p>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="alex@company.com"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                      required
                      autoFocus
                      data-hover-type="link"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={forgotLoading}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      data-hover-type="link"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Send Reset Link</span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="auth-social-btn"
                      onClick={() => setForgotModalOpen(false)}
                      data-hover-type="link"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Set New Password Recovery Modal (Triggered by reset email link) */}
      <AnimatePresence>
        {isRecoveryMode && (
          <div className="auth-modal-backdrop">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="auth-modal-card"
              style={{ maxWidth: '440px' }}
            >
              <div className="auth-modal-icon-wrap" style={{ background: 'rgba(255, 100, 150, 0.15)', borderColor: 'rgba(255, 100, 150, 0.3)' }}>
                <Lock className="h-6 w-6" style={{ color: '#FF6496' }} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                  Create New Password
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Enter and confirm your new password below to recover your account and sign in.
                </p>
              </div>

              {recoveryError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  marginTop: '12px'
                }}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoverySuccess ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '0.92rem' }}>
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>Password updated successfully! Redirecting to login...</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                  <div className="auth-form-group">
                    <label className="auth-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem' }}>
                      New Password
                    </label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="auth-input"
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setRecoveryError(''); }}
                        required
                        minLength={6}
                        autoFocus
                        data-hover-type="link"
                      />
                      <button
                        type="button"
                        className="auth-input-action-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        data-hover-type="link"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label className="auth-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem' }}>
                      Confirm New Password
                    </label>
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="auth-input"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setRecoveryError(''); }}
                        required
                        minLength={6}
                        data-hover-type="link"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={recoveryLoading}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      data-hover-type="link"
                    >
                      {recoveryLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <span>Save New Password</span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="auth-social-btn"
                      onClick={() => setIsRecoveryMode(false)}
                      data-hover-type="link"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Minimal */}
      <footer className="auth-footer">
        <div>
          © {new Date().getFullYear()} MotionNodeEdits. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} data-hover-type="link">
            Terms & Policy
          </a>
          <a href="/work.html" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} data-hover-type="link">
            Our Work
          </a>
          <a href="/about.html" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} data-hover-type="link">
            About Studio
          </a>
        </div>
      </footer>
    </div>
  );
}
