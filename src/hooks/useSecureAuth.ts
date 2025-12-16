/**
 * @fileoverview Secure authentication hook with rate limiting, validation, and CSRF protection.
 * Provides a complete authentication solution with enhanced security features.
 * 
 * @module hooks/useSecureAuth
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  validateInput,
  validateForm,
  sanitizeInput,
  setCSRFToken,
  getCSRFToken,
  clearCSRFToken,
  RateLimiter,
} from '@/lib/security';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SecureUser {
  id: string;
  email: string;
  full_name?: string;
  role?: 'client' | 'professional';
  phone?: string;
  avatar_url?: string;
  skin_type?: string;
  concerns?: string[];
  business_name?: string;
  license_number?: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
  user?: SecureUser;
  requiresEmailConfirmation?: boolean;
}

// ============================================================================
// RATE LIMITER INSTANCE
// ============================================================================

const loginRateLimiter = new RateLimiter(5, 60000);

// ============================================================================
// HELPER: Timeout wrapper for promises
// ============================================================================

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    )
  ]);
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSecureAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // SIGNUP - Now returns quickly to allow fallback
  // ============================================================================

  const secureSignUp = useCallback(async (
    email: string,
    password: string,
    userData: {
      full_name?: string;
      role?: 'client' | 'professional';
      phone?: string;
    }
  ): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Client-side validation
      const validation = validateForm(
        { email, password, full_name: userData.full_name },
        {
          email: 'email',
          password: { required: true, minLength: 8 },
          full_name: { required: false, minLength: 2, maxLength: 100 },
        }
      );

      if (!validation.valid) {
        const firstError = Object.values(validation.errors)[0];
        setError(firstError);
        return { success: false, error: firstError };
      }

      // Step 2: Sanitize all inputs
      const sanitizedData = {
        email: email.toLowerCase().trim(),
        password,
        full_name: sanitizeInput(userData.full_name),
        role: userData.role || 'client',
        phone: userData.phone ? sanitizeInput(userData.phone) : undefined,
      };

      // Step 3: Try secure auth with a short timeout (3 seconds)
      // If it fails or times out, we'll fall back to standard auth
      try {
        const { data, error: fnError } = await withTimeout(
          supabase.functions.invoke('secure-auth', {
            body: {
              action: 'signup',
              ...sanitizedData,
            },
          }),
          3000 // 3 second timeout
        );

        if (!fnError && data?.success) {
          if (data?.csrfToken) {
            setCSRFToken(data.csrfToken);
          }
          return {
            success: true,
            user: data?.user,
            requiresEmailConfirmation: data?.requiresEmailConfirmation,
          };
        }
      } catch (timeoutErr) {
        console.log('Secure auth timed out or failed, using standard auth');
      }

      // Return false to indicate secure auth didn't work - let caller use standard auth
      return { success: false, error: 'useStandardAuth' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // SIGNIN - Now returns quickly to allow fallback
  // ============================================================================

  const secureSignIn = useCallback(async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Check rate limiting
      if (!loginRateLimiter.canAttempt()) {
        const waitTime = Math.ceil(loginRateLimiter.getTimeUntilReset() / 1000);
        const errorMessage = `Too many login attempts. Please wait ${waitTime} seconds.`;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      loginRateLimiter.recordAttempt();

      // Step 2: Validate email format
      const emailValidation = validateInput(email, 'email');
      if (!emailValidation.valid) {
        setError(emailValidation.error!);
        return { success: false, error: emailValidation.error };
      }

      if (!password || password.length < 1) {
        const errorMessage = 'Password is required';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Step 3: Try secure auth with a short timeout
      try {
        const { data, error: fnError } = await withTimeout(
          supabase.functions.invoke('secure-auth', {
            body: {
              action: 'login',
              email: email.toLowerCase().trim(),
              password,
            },
          }),
          3000 // 3 second timeout
        );

        if (!fnError && data?.success) {
          if (data?.csrfToken) {
            setCSRFToken(data.csrfToken);
          }
          loginRateLimiter.reset();
          return {
            success: true,
            user: data?.user,
          };
        }
      } catch (timeoutErr) {
        console.log('Secure auth timed out or failed, using standard auth');
      }

      // Return false to indicate secure auth didn't work
      return { success: false, error: 'useStandardAuth' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // SIGNOUT
  // ============================================================================

  const secureSignOut = useCallback(async (): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Try to call secure logout but don't wait too long
      try {
        await withTimeout(
          supabase.functions.invoke('secure-auth', {
            body: { action: 'logout' },
          }),
          2000
        );
      } catch {
        // Ignore timeout/errors - we'll still sign out locally
      }

      clearCSRFToken();
      await supabase.auth.signOut();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // SESSION VERIFICATION
  // ============================================================================

  const verifySession = useCallback(async (): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);

    try {
      const csrfToken = getCSRFToken();

      const { data, error: fnError } = await withTimeout(
        supabase.functions.invoke('secure-auth', {
          body: { action: 'verify' },
          headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
        }),
        3000
      );

      if (fnError || !data?.authenticated) {
        return { success: false, error: data?.error || 'Session invalid' };
      }

      return {
        success: true,
        user: data?.user,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session verification failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // SESSION REFRESH
  // ============================================================================

  const refreshSession = useCallback(async (): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await withTimeout(
        supabase.functions.invoke('secure-auth', {
          body: { action: 'refresh' },
        }),
        3000
      );

      if (fnError) {
        const errorMessage = fnError.message || 'Session refresh failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (data?.error) {
        setError(data.error);
        return { success: false, error: data.error };
      }

      if (data?.csrfToken) {
        setCSRFToken(data.csrfToken);
      }

      return {
        success: true,
        user: data?.user,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session refresh failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // CSRF TOKEN MANAGEMENT
  // ============================================================================

  const fetchCSRFToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error: fnError } = await withTimeout(
        supabase.functions.invoke('secure-auth', {
          body: { action: 'csrf' },
        }),
        3000
      );

      if (fnError || !data?.csrfToken) {
        return null;
      }

      setCSRFToken(data.csrfToken);
      return data.csrfToken;
    } catch {
      return null;
    }
  }, []);

  // ============================================================================
  // RATE LIMIT INFO
  // ============================================================================

  const getRemainingAttempts = useCallback((): number => {
    return loginRateLimiter.getRemainingAttempts();
  }, []);

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    loading,
    error,
    secureSignUp,
    secureSignIn,
    secureSignOut,
    verifySession,
    refreshSession,
    fetchCSRFToken,
    getRemainingAttempts,
    clearError: () => setError(null),
  };
}

export default useSecureAuth;
