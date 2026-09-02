import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

import CustomCursor from '../components/CustomCursor';
import { supabase } from '../supabaseClient';
import './login.css';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

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

  // Handle URL query parameters (e.g., ?tab=signup or ?tab=signin&email=...&signup_success=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const emailParam = params.get('email');
      const signupSuccessParam = params.get('signup_success');

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
        setSuccessMessage('Your account has been created. Please check your email and verify your address before logging in.');
      }
    }
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
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }

        // Direct profile provisioning fallback
        if (data?.user?.id) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: formData.fullName,
              email: formData.email,
              role: 'client',
              status: 'approved',
            });
          } catch (pErr) {
            console.warn('Profile direct provision:', pErr);
          }
        }

        // If Supabase gave an immediate session (Email Confirm disabled), redirect directly to client dashboard!
        if (data?.session) {
          window.location.href = '/dashboard/client';
          return;
        }

        const signupEmail = formData.email;

        // Switch to Sign In tab, keep/pre-fill the email, clear password
        setActiveTab('signin');
        setFormData((prev) => ({
          ...prev,
          email: signupEmail,
          password: '',
        }));
        setSuccessMessage('Account created! Please check your email to confirm your account (or disable "Confirm Email" in Supabase settings), then sign in.');
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

        // Check profiles table and read the user's role column to route correctly
        if (data?.session && data?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', data.user.id)
              .maybeSingle();

            const role = (profile?.role || '').toLowerCase().trim();

            if (role === 'admin') {
              window.location.href = '/dashboard/admin';
            } else if (role === 'editor') {
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

  const handleSocialAuth = (provider) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setAuthSuccess(true);
    }, 1000);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitted(true);
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
                <Sparkles className="h-4 w-4" />
                <span>Sign Up</span>
              </button>
            </div>

            {/* Social Authentication */}
            <div className="auth-social-buttons">
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => handleSocialAuth('google')}
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
                <div className="auth-options-row">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                    />
                    <span>Remember me</span>
                  </label>

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
                <div className="auth-options-row" style={{ alignItems: 'flex-start' }}>
                  <label className="auth-checkbox-label" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      required
                    />
                    <span>
                      I agree to the{' '}
                      <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: '#FF6496', textDecoration: 'underline' }} data-hover-type="link">
                        Terms of Service
                      </a>{' '}
                      & Privacy Policy
                    </span>
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
                    <>
                      <span>{activeTab === 'signin' ? 'Sign In to Workspace' : 'Sign Up'}</span>
                      <Sparkles className="h-4 w-4 text-pink-400" />
                    </>
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
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.82rem',
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
                  href="/client.html"
                  className="auth-submit-btn"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                  data-hover-type="link"
                >
                  Enter Client Portal
                </a>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a
                    href="/editor.html"
                    className="auth-social-btn"
                    style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
                    data-hover-type="link"
                  >
                    Editor Dashboard
                  </a>
                  <a
                    href="/admin.html"
                    className="auth-social-btn"
                    style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
                    data-hover-type="link"
                  >
                    Admin Panel
                  </a>
                </div>
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
              {forgotSubmitted ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '0.9rem' }}>
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>Reset link sent to <strong>{forgotEmail}</strong></span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Please check your inbox and spam folder for instructions to restore access.
                  </p>
                  <button
                    type="button"
                    className="auth-submit-btn"
                    onClick={() => setForgotModalOpen(false)}
                    style={{ marginTop: '8px' }}
                    data-hover-type="link"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Enter your registered email address and we will send you a secure password reset link.
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
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                      data-hover-type="link"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      style={{ flex: 1 }}
                      data-hover-type="link"
                    >
                      Send Reset Link
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

      {/* Footer Minimal */}
      <footer className="auth-footer">
        <div>
          © {new Date().getFullYear()} MotionNodeEdits AI Studio. All rights reserved.
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
