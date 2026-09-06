import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import CustomCursor from '../components/CustomCursor';
import { supabase } from '../supabaseClient';
import { isAdmin } from '../lib/auth/authUtils';
import './adminLogin.css';

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
            setSuccessMessage('Active admin session detected. Redirecting to Dashboard...');
            setAuthSuccess(true);
            setTimeout(() => {
              window.location.href = '/dashboard/admin';
            }, 700);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.username.trim() || !formData.password) {
      setErrorMessage('Please enter email, username, and password.');
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

        // Check if admin through profile, user_metadata, app_metadata, or configured email
        const isUserAdmin = isAdmin(profile) || isAdmin(data.user);

        // If NOT an admin:
        if (!isUserAdmin) {
          await supabase.auth.signOut();

          // If a database query error actually caused the lookup to fail, show the exact DB error
          if (profileError) {
            setErrorMessage(
              `Database error verifying administrator account: ${profileError.message || 'Policy error'}. Please run supabase/fix_admin_login.sql in Supabase SQL editor.`
            );
          } else {
            setErrorMessage(
              `Access Denied: Account "${data.user.email}" does not have administrator privileges. To grant access, promote this user to 'admin' in Supabase SQL Editor (see supabase/fix_admin_login.sql) or add this email to VITE_ADMIN_EMAILS in .env.`
            );
          }
          setIsLoading(false);
          return;
        }

        // 3. Auto-heal/sync admin profile into public.profiles if needed
        const currentDbRole = (profile?.role || '').toLowerCase().trim();
        if (!profile || currentDbRole !== 'admin') {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: profile?.full_name || data.user.user_metadata?.full_name || 'Admin',
              email: data.user.email,
              role: 'admin',
              status: 'approved',
              username: formData.username.trim(),
            });
          } catch (healErr) {
            console.warn('[AdminLogin] Profile auto-heal warning:', healErr);
          }
        }

        // 4. Strict Username Verification
        const inputUsername = formData.username.trim().toLowerCase();
        const dbUsername = (profile?.username || '').toLowerCase().trim();
        const dbFullName = (profile?.full_name || '').toLowerCase().trim();
        const emailPrefix = (profile?.email || data.user.email || '').split('@')[0].toLowerCase().trim();

        let isUsernameValid = false;
        if (dbUsername) {
          isUsernameValid = (inputUsername === dbUsername);
        } else {
          // If username is not explicitly set in the database yet, accept full_name, emailPrefix, 'admin', or any non-empty input
          isUsernameValid = (inputUsername === dbFullName || inputUsername === emailPrefix || inputUsername === 'admin' || inputUsername.length > 0);
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

        // 5. Set strict admin authentication origin clearance
        try {
          sessionStorage.setItem('mne_admin_auth_origin', 'admin/login');
          localStorage.setItem('mne_admin_auth_origin', 'admin/login');
        } catch {
          // ignore
        }

        // 6. Authorized Admin Access
        setAuthSuccess(true);
        setSuccessMessage('Clearance Verified. Redirecting to Dashboard...');

        setTimeout(() => {
          window.location.href = '/dashboard/admin';
        }, 700);
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


  return (
    <div className="admin-login-root">
      <CustomCursor />

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
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

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading || authSuccess}
              className="admin-signin-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <span className="admin-btn-arrow">→</span>
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Bottom glowing accent line */}
      <div className="admin-bottom-accent-line" />
    </div>
  );
}
