import { supabase } from '../supabase/client';

const DEVICE_COOKIE_NAME = 'mne_admin_dev_tk';
const DEVICE_STORAGE_KEY = 'mne_admin_device_token';

/**
 * Detect client device, browser, and OS without collecting intrusive personal info.
 */
export function detectDeviceInfo() {
  if (typeof window === 'undefined' || !navigator) {
    return {
      deviceName: 'Admin Workstation',
      deviceType: 'desktop',
      browser: 'Browser',
      os: 'Unknown OS',
    };
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';

  // 1. Detect Operating System
  let os = 'Unknown OS';
  if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(ua) || /Mac/i.test(platform)) {
    os = 'macOS';
  } else if (/Windows NT 10.0/i.test(ua)) {
    os = 'Windows 11 / 10';
  } else if (/Windows NT 6.3/i.test(ua) || /Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/iPhone/i.test(ua)) {
    os = 'iOS (iPhone)';
  } else if (/iPad/i.test(ua)) {
    os = 'iPadOS';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  } else if (/CrOS/i.test(ua)) {
    os = 'Chrome OS';
  }

  // 2. Detect Browser
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) {
    const match = ua.match(/Edg\/(\d+[\.\d]*)/);
    browser = match ? `Microsoft Edge ${match[1].split('.')[0]}` : 'Microsoft Edge';
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+[\.\d]*)/);
    browser = match ? `Google Chrome ${match[1].split('.')[0]}` : 'Google Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    const match = ua.match(/Version\/(\d+[\.\d]*)/);
    browser = match ? `Apple Safari ${match[1].split('.')[0]}` : 'Apple Safari';
  } else if (/Firefox\//i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+[\.\d]*)/);
    browser = match ? `Mozilla Firefox ${match[1].split('.')[0]}` : 'Mozilla Firefox';
  } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    browser = 'Opera';
  }

  // 3. Detect Device Type
  let deviceType = 'desktop';
  if (/Mobile|iPhone|Android.*Mobile|BlackBerry|IEMobile/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/Tablet|iPad|Android(?!.*Mobile)/i.test(ua)) {
    deviceType = 'tablet';
  }

  // 4. Construct user-friendly device name
  let deviceName = 'Admin Computer';
  if (deviceType === 'desktop') {
    if (os === 'macOS') {
      deviceName = 'MacBook / iMac (macOS)';
    } else if (os.includes('Windows')) {
      deviceName = 'Windows PC';
    } else if (os === 'Linux') {
      deviceName = 'Linux Workstation';
    } else {
      deviceName = 'Desktop Computer';
    }
  } else if (deviceType === 'tablet') {
    deviceName = os === 'iPadOS' ? 'Apple iPad' : 'Tablet Device';
  } else {
    deviceName = os.includes('iOS') ? 'Apple iPhone' : 'Smartphone (Android)';
  }

  return {
    deviceName,
    deviceType,
    browser,
    os,
  };
}

/**
 * Generate a cryptographically secure 256-bit device token (64 hex chars).
 */
export function generateDeviceToken() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Resilient fallback
  return 'dev_' + Date.now().toString(16) + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}

/**
 * Compute SHA-256 hash of a device token using Web Cryptography API.
 * Never send or store raw device tokens in the database.
 */
export async function hashDeviceToken(token) {
  if (!token || typeof token !== 'string') return '';
  const clean = token.trim();

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(clean);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('[DeviceManager] crypto.subtle hash failed, using fallback:', err);
  }

  // Deterministic fallback hash for non-subtle/local contexts
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(64, '0');
}

/**
 * Retrieve the current device token from cookie or secure storage.
 */
export function getStoredDeviceToken() {
  if (typeof document === 'undefined') return null;

  // 1. Check Cookie
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + DEVICE_COOKIE_NAME + '=([^;]+)'));
  if (match && match[2]) {
    return decodeURIComponent(match[2].trim());
  }

  // 2. Check Storage fallback
  try {
    const local = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed?.token && (!parsed.expiresAt || new Date(parsed.expiresAt) > new Date())) {
        return parsed.token;
      }
    }
  } catch {}

  return null;
}

/**
 * Store the trusted device token in a secure SameSite cookie and storage.
 * Absolute 30-day lifetime (2,592,000 seconds).
 */
export function setStoredDeviceToken(token) {
  if (typeof document === 'undefined' || !token) return;

  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
  const expiresDate = new Date(Date.now() + maxAge * 1000).toUTCString();
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';

  document.cookie = `${DEVICE_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; expires=${expiresDate}; SameSite=Strict${isSecure ? '; Secure' : ''}`;

  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify({
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + maxAge * 1000).toISOString(),
    }));
  } catch {}
}

/**
 * Clear the current device token on logout or revocation.
 */
export function clearStoredDeviceToken() {
  if (typeof document !== 'undefined') {
    document.cookie = `${DEVICE_COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  }
  try {
    localStorage.removeItem(DEVICE_STORAGE_KEY);
  } catch {}
}

/**
 * Check if the current browser holds a valid, active 30-day trusted device token.
 */
export async function validateCurrentDevice(userId) {
  if (!userId) return { valid: false, reason: 'missing_user' };

  const rawToken = getStoredDeviceToken();
  if (!rawToken) {
    return { valid: false, reason: 'no_device_token' };
  }

  const tokenHash = await hashDeviceToken(rawToken);

  // 1. Attempt validation via database RPC
  try {
    const { data, error } = await supabase.rpc('validate_admin_device', {
      p_user_id: userId,
      p_device_token_hash: tokenHash,
    });

    if (!error && data) {
      if (data.valid === true) {
        return {
          valid: true,
          deviceId: data.device_id,
          deviceName: data.device_name,
          expiresAt: data.expires_at,
          daysRemaining: data.days_remaining,
          tokenHash,
        };
      }
      return { valid: false, reason: data.reason || 'untrusted' };
    }
  } catch (rpcErr) {
    console.warn('[DeviceManager] validate_admin_device RPC warning:', rpcErr);
  }

  // 2. Direct table fallback (respecting RLS)
  try {
    const { data: device, error } = await supabase
      .from('admin_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_token_hash', tokenHash)
      .maybeSingle();

    if (!error && device) {
      if (device.status === 'revoked') {
        clearStoredDeviceToken();
        return { valid: false, reason: 'revoked' };
      }

      const isExpired = new Date(device.expires_at) <= new Date() || device.status === 'expired';
      if (isExpired) {
        clearStoredDeviceToken();
        return { valid: false, reason: 'expired' };
      }

      // Valid! Update last_active_at without extending expires_at
      supabase
        .from('admin_devices')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', device.id)
        .then(() => {});

      const daysRemaining = Math.max(0, Math.ceil((new Date(device.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      return {
        valid: true,
        deviceId: device.id,
        deviceName: device.device_name,
        expiresAt: device.expires_at,
        daysRemaining,
        tokenHash,
      };
    }
  } catch (tableErr) {
    console.warn('[DeviceManager] Fallback table validation error:', tableErr);
  }

  return { valid: false, reason: 'not_found' };
}

/**
 * Register current device as trusted for 30 days.
 * Only called after successful password authentication AND required OTP verification.
 */
export async function registerCurrentDevice(userId, rememberDevice = true) {
  if (!userId) return { success: false, error: 'User ID is required' };

  if (!rememberDevice) {
    // If user did not check "Remember this device", do not persist a 30-day trusted token
    clearStoredDeviceToken();
    return { success: true, trusted: false };
  }

  const rawToken = generateDeviceToken();
  const tokenHash = await hashDeviceToken(rawToken);
  const info = detectDeviceInfo();

  const payload = {
    p_device_token_hash: tokenHash,
    p_device_name: info.deviceName,
    p_device_type: info.deviceType,
    p_browser: info.browser,
    p_os: info.os,
    p_ip: null,
  };

  // 1. Register via stored procedure
  try {
    const { data, error } = await supabase.rpc('register_admin_device', payload);
    if (!error && data?.success) {
      setStoredDeviceToken(rawToken);
      return { success: true, trusted: true, device: data.device };
    }
  } catch (rpcErr) {
    console.warn('[DeviceManager] register_admin_device RPC notice:', rpcErr);
  }

  // 2. Direct table fallback
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('admin_devices')
      .upsert({
        user_id: userId,
        device_token_hash: tokenHash,
        device_name: info.deviceName,
        device_type: info.deviceType,
        browser: info.browser,
        os: info.os,
        status: 'active',
        last_active_at: now.toISOString(),
        expires_at: expiresAt,
        created_at: now.toISOString(),
      }, { onConflict: 'device_token_hash' })
      .select()
      .maybeSingle();

    if (!error && data) {
      setStoredDeviceToken(rawToken);
      return { success: true, trusted: true, device: data };
    }
    return { success: false, error: error?.message || 'Failed to save device record.' };
  } catch (err) {
    console.error('[DeviceManager] Exception registering device:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all devices registered to the current administrator.
 */
export async function getMyAdminDevices() {
  const currentToken = getStoredDeviceToken();
  const currentHash = currentToken ? await hashDeviceToken(currentToken) : null;

  // 1. Try RPC
  try {
    const { data, error } = await supabase.rpc('get_my_admin_devices');
    if (!error && Array.isArray(data)) {
      return {
        data: data.map(d => ({
          ...d,
          isCurrent: currentHash ? d.device_token_hash === currentHash : false,
        })),
        currentHash,
        error: null,
      };
    }
  } catch (e) {
    console.warn('[DeviceManager] get_my_admin_devices RPC warning:', e);
  }

  // 2. Fallback query
  try {
    const { data, error } = await supabase
      .from('admin_devices')
      .select('*')
      .order('last_active_at', { ascending: false });

    if (!error && data) {
      const now = Date.now();
      const enriched = data.map(d => {
        const isExpired = new Date(d.expires_at).getTime() <= now;
        const status = d.status === 'revoked' ? 'revoked' : (isExpired ? 'expired' : 'active');
        const daysRemaining = Math.max(0, Math.ceil((new Date(d.expires_at).getTime() - now) / (1000 * 60 * 60 * 24)));
        return {
          ...d,
          status,
          days_remaining: daysRemaining,
          isCurrent: currentHash ? d.device_token_hash === currentHash : false,
        };
      });
      return { data: enriched, currentHash, error: null };
    }
    return { data: [], currentHash, error };
  } catch (err) {
    return { data: [], currentHash, error: err };
  }
}

/**
 * Revoke a specific device.
 */
export async function revokeDevice(deviceId, isCurrent = false) {
  if (!deviceId) return { success: false, error: 'Device ID required' };

  try {
    const { data, error } = await supabase.rpc('revoke_admin_device', { p_device_id: deviceId });
    if (!error && data?.success) {
      if (isCurrent) {
        clearStoredDeviceToken();
      }
      return { success: true };
    }
  } catch (_) {}

  // Fallback update
  try {
    const { error } = await supabase
      .from('admin_devices')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', deviceId);

    if (error) throw error;
    if (isCurrent) {
      clearStoredDeviceToken();
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Sign out / revoke all other active devices.
 */
export async function revokeOtherDevices(currentDeviceId) {
  try {
    const { data, error } = await supabase.rpc('revoke_other_admin_devices', {
      p_current_device_id: currentDeviceId || null,
    });
    if (!error && data?.success) {
      return { success: true, count: data.revoked_count };
    }
  } catch (_) {}

  // Fallback update
  try {
    let query = supabase
      .from('admin_devices')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('status', 'active');

    if (currentDeviceId) {
      query = query.neq('id', currentDeviceId);
    }

    const { error } = await query;
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch an email OTP for admin authentication.
 * Integrates both Supabase Auth email OTP and secure database OTP generation.
 */
export async function requestAdminEmailOtp(userId, email) {
  if (!email || !userId) return { success: false, error: 'Missing email or user ID' };

  const cleanEmail = email.trim().toLowerCase();

  // 1. Generate OTP in database with 60-second cooldown & 10-minute validity
  let dbResult = null;
  try {
    const { data, error } = await supabase.rpc('generate_admin_login_otp', {
      p_user_id: userId,
      p_email: cleanEmail,
    });
    if (!error && data) {
      dbResult = data;
      if (data.success === false) {
        return {
          success: false,
          error: data.error || 'Rate limit exceeded.',
          cooldownSeconds: data.cooldown_seconds || 60,
        };
      }
    }
  } catch (e) {
    console.warn('[DeviceManager] Database OTP RPC warning:', e);
  }

  // 2. Trigger native Supabase Auth Email OTP
  try {
    await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: false,
      },
    });
  } catch (otpErr) {
    console.warn('[DeviceManager] Supabase signInWithOtp notice (proceeding with studio OTP):', otpErr);
  }

  return {
    success: true,
    expiresInSeconds: dbResult?.expires_in_seconds || 600,
    cooldownSeconds: dbResult?.cooldown_seconds || 60,
    // When in local development or if testing, preview code may be available
    devCode: (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ? dbResult?.otp_code : null,
  };
}

/**
 * Verify submitted 6-digit OTP code.
 */
export async function verifyAdminEmailOtp(userId, email, otpCode) {
  if (!userId || !otpCode) return { success: false, error: 'Missing user ID or OTP code' };

  const cleanCode = otpCode.trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  // 1. Verify via database RPC
  try {
    const { data, error } = await supabase.rpc('verify_admin_login_otp', {
      p_user_id: userId,
      p_email: cleanEmail,
      p_otp_code: cleanCode,
    });

    if (!error && data) {
      if (data.success) {
        return { success: true };
      }
      return {
        success: false,
        error: data.error || 'Invalid code.',
        attemptsRemaining: data.attempts_remaining,
      };
    }
  } catch (rpcErr) {
    console.warn('[DeviceManager] verify_admin_login_otp RPC notice:', rpcErr);
  }

  // 2. Fallback check: native Supabase verifyOtp
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanCode,
      type: 'email',
    });
    if (!error && data?.session) {
      return { success: true };
    }
    if (error) {
      return { success: false, error: error.message };
    }
  } catch (supaErr) {
    console.warn('[DeviceManager] Native verifyOtp check notice:', supaErr);
  }

  return { success: false, error: 'Verification failed. Please check the code and try again.' };
}
