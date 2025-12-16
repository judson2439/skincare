/**
 * @fileoverview Authentication context provider for managing user authentication state.
 * Provides secure authentication with input sanitization and CSRF protection.
 * 
 * @module contexts/AuthContext
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';
import {
  sanitizeInput,
  sanitizeObject,
  setCSRFToken,
  clearCSRFToken,
  getCSRFToken,
} from '@/lib/security';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User profile data stored in the database.
 * @interface UserProfile
 * @property {string} id - Unique user identifier (matches Supabase auth.users.id)
 * @property {string} email - User's email address
 * @property {string} full_name - User's display name
 * @property {string} [phone] - User's phone number
 * @property {'client' | 'professional'} role - User's role in the system
 * @property {string} [avatar_url] - URL to user's profile picture
 * @property {string} [skin_type] - Client's skin type (Normal, Dry, Oily, etc.)
 * @property {string[]} [concerns] - Client's skin concerns
 * @property {string} [business_name] - Professional's business name
 * @property {string} [license_number] - Professional's license number
 * @property {string} [created_at] - ISO timestamp of account creation
 * @property {string} [updated_at] - ISO timestamp of last profile update
 */
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'client' | 'professional';
  avatar_url?: string;
  skin_type?: string;
  concerns?: string[];
  business_name?: string;
  license_number?: string;
  created_at?: string;
  updated_at?: string;
}



/**
 * Authentication context value type.
 * Provides authentication state and methods to all child components.
 * 
 * @interface AuthContextType
 */
interface AuthContextType {
  /** Current Supabase user object, null if not authenticated */
  user: User | null;
  
  /** User's profile data from the database */
  profile: UserProfile | null;
  
  /** Current Supabase session, null if not authenticated */
  session: Session | null;
  
  /** Whether authentication state is being loaded */
  loading: boolean;
  
  /** Current CSRF token for secure requests */
  csrfToken: string | null;
  
  /** 
   * Register a new user account
   * @param email - User's email address
   * @param password - User's password
   * @param userData - Additional profile data
   * @returns Promise with error and session information
   */
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<{ error: AuthError | Error | null; session: Session | null; user?: User | null }>;
  
  /**
   * Sign in an existing user
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with error information
   */
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  
  /** Sign out the current user */
  signOut: () => Promise<void>;
  
  /**
   * Send password reset email
   * @param email - User's email address
   * @returns Promise with error information
   */
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  
  /**
   * Update user's password
   * @param newPassword - The new password
   * @returns Promise with error information
   */
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | Error | null }>;
  
  /**
   * Update user's profile data
   * @param updates - Partial profile data to update
   * @returns Promise with error information
   */
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  
  /** Refresh profile data from the database */
  refreshProfile: () => Promise<void>;
  
  /** Fetch a new CSRF token from the server */
  refreshCSRFToken: () => Promise<void>;
  
  /**
   * Resend verification email to user
   * @param email - User's email address
   * @returns Promise with error information
   */
  resendVerificationEmail: (email: string) => Promise<{ error: AuthError | Error | null }>;
}


// ============================================================================
// CONTEXT CREATION
// ============================================================================

/**
 * Authentication context instance.
 * @constant {React.Context<AuthContextType | undefined>}
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider component.
 * 
 * @function useAuth
 * @returns {AuthContextType} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * function ProfilePage() {
 *   const { user, profile, signOut } = useAuth();
 * 
 *   if (!user) {
 *     return <LoginPrompt />;
 *   }
 * 
 *   return (
 *     <div>
 *       <h1>Welcome, {profile?.full_name}</h1>
 *       <button onClick={signOut}>Logout</button>
 *     </div>
 *   );
 * }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER PROPS
// ============================================================================

/**
 * Props for the AuthProvider component.
 * @interface AuthProviderProps
 * @property {ReactNode} children - Child components to wrap
 */
interface AuthProviderProps {
  children: ReactNode;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Authentication provider component.
 * Wraps the application to provide authentication state and methods.
 * 
 * Features:
 * - Automatic session persistence and restoration
 * - Real-time auth state synchronization
 * - Input sanitization for XSS protection
 * - CSRF token management
 * - Profile data management
 * 
 * @component
 * @param {AuthProviderProps} props - Component props
 * @returns {JSX.Element} Provider component wrapping children
 * 
 * @example
 * // Wrap your app with AuthProvider
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Router>
 *         <Routes>
 *           <Route path="/" element={<Home />} />
 *           <Route path="/profile" element={<Profile />} />
 *         </Routes>
 *       </Router>
 *     </AuthProvider>
 *   );
 * }
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // ========================================================================
  // STATE
  // ========================================================================
  
  /** Current Supabase user */
  const [user, setUser] = useState<User | null>(null);
  
  /** User's profile from database */
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  /** Current Supabase session */
  const [session, setSession] = useState<Session | null>(null);
  
  /** Loading state during auth operations */
  const [loading, setLoading] = useState(true);
  
  /** Current CSRF token */
  const [csrfToken, setCsrfTokenState] = useState<string | null>(null);

  // ========================================================================
  // CSRF TOKEN MANAGEMENT
  // ========================================================================

  /**
   * Fetches a new CSRF token from the secure-auth edge function.
   * Stores the token in both session storage and component state.
   * 
   * @async
   * @function refreshCSRFToken
   * @returns {Promise<void>}
   */
  const refreshCSRFToken = useCallback(async () => {
    try {
      // Use a short timeout to prevent blocking
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const { data, error } = await supabase.functions.invoke('secure-auth', {
        body: { action: 'csrf' },
      });
      
      clearTimeout(timeoutId);

      if (!error && data?.csrfToken) {
        setCSRFToken(data.csrfToken);
        setCsrfTokenState(data.csrfToken);
      }
    } catch (err) {
      // Silently fail - CSRF token is optional enhancement
      console.log('CSRF token fetch skipped');
    }
  }, []);



  // ========================================================================
  // PROFILE MANAGEMENT
  // ========================================================================

  /**
   * Fetches user profile data from the database.
   * 
   * @async
   * @function fetchProfile
   * @param {string} userId - The user's ID to fetch profile for
   * @returns {Promise<UserProfile | null>} The user profile or null if not found
   * @private
   */
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      // Profile may not exist yet for newly created users
      if (!data) {
        console.log('No profile found for user, may be newly created');
        return null;
      }
      
      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  /**
   * Refreshes the current user's profile data from the database.
   * 
   * @async
   * @function refreshProfile
   * @returns {Promise<void>}
   */
  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  // ========================================================================
  // AUTH STATE INITIALIZATION
  // ========================================================================

  /**
   * Effect to initialize authentication state on mount.
   * - Restores session from storage
   * - Fetches user profile
   * - Sets up auth state change listener
   * - Manages CSRF tokens
   */
  useEffect(() => {
    /**
     * Initializes authentication state from stored session.
     * @async
     */
    const initAuth = async () => {
      try {
        // Set a maximum timeout for the entire auth initialization
        const initTimeout = setTimeout(() => {
          console.log('Auth initialization timeout - setting loading to false');
          setLoading(false);
        }, 5000); // 5 second max timeout

        // Get existing session from Supabase
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // If user is authenticated, fetch their profile
        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
          
          // Fetch CSRF token in background (don't block on it)
          refreshCSRFToken().catch(() => {
            console.log('CSRF token fetch failed silently');
          });
        }
        
        clearTimeout(initTimeout);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // User signed in - fetch profile and refresh CSRF token
        const profileData = await fetchProfile(newSession.user.id);
        setProfile(profileData);
        // Don't await CSRF token - do it in background
        refreshCSRFToken().catch(() => {});
      } else {
        // User signed out - clear profile and CSRF token
        setProfile(null);
        clearCSRFToken();
        setCsrfTokenState(null);
      }

      // Handle explicit sign out event
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        clearCSRFToken();
        setCsrfTokenState(null);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [refreshCSRFToken]);


  // ========================================================================
  // AUTHENTICATION METHODS
  // ========================================================================

  /**
   * Registers a new user with email and password.
   * All user data is sanitized to prevent XSS attacks.
   * 
   * @async
   * @function signUp
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {Partial<UserProfile>} userData - Additional profile data
   * @returns {Promise<{error: AuthError | Error | null, session: Session | null, user?: User | null}>}
   * 
   * @example
   * const { error, session } = await signUp(
   *   'user@example.com',
   *   'SecurePassword123!',
   *   { full_name: 'John Doe', role: 'client' }
   * );
   * 
   * if (error) {
   *   showError(error.message);
   * } else if (session) {
   *   // User is logged in
   *   redirectToDashboard();
   * } else {
   *   // Email confirmation required
   *   showConfirmationMessage();
   * }
   */
  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      // Sanitize all user-provided data to prevent XSS attacks
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
      const sanitizedUserData = {
        full_name: sanitizeInput(userData.full_name || ''),
        phone: userData.phone ? sanitizeInput(userData.phone) : null,
        role: userData.role || 'client',
        avatar_url: userData.avatar_url ? sanitizeInput(userData.avatar_url) : null,
        skin_type: userData.skin_type ? sanitizeInput(userData.skin_type) : null,
        concerns: userData.concerns ? userData.concerns.map(c => sanitizeInput(c)) : null,
        business_name: userData.business_name ? sanitizeInput(userData.business_name) : null,
        license_number: userData.license_number ? sanitizeInput(userData.license_number) : null,
      };
      
      // =========================================================================
      // CRITICAL: Email Verification Configuration
      // =========================================================================
      // 
      // The `email_verified` field in raw_user_meta_data is AUTOMATICALLY set by
      // Supabase based on the "Confirm email" setting in the Dashboard.
      // 
      // YOU CANNOT CONTROL THIS FROM CODE!
      // 
      // If you see `email_verified: true` immediately after signup, it means
      // "Confirm email" is DISABLED in your Supabase Dashboard.
      //
      // TO FIX THIS:
      // 1. Go to Supabase Dashboard
      // 2. Navigate to: Authentication > Providers > Email
      // 3. ENABLE the "Confirm email" toggle
      // 4. Click "Save"
      //
      // When "Confirm email" is ENABLED:
      // - email_verified will be FALSE initially
      // - email_confirmed_at will be NULL until verified
      // - User CANNOT log in until they click the verification link
      // - Supabase sends a verification email automatically
      //
      // When "Confirm email" is DISABLED (default):
      // - email_verified is set to TRUE immediately
      // - email_confirmed_at is set immediately
      // - User can log in right away without verification
      //
      // DO NOT try to set email_verified in the options.data below - Supabase
      // will override it based on the Dashboard setting anyway.
      // =========================================================================
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          // This URL is where users will be redirected after clicking the email confirmation link
          // Make sure this URL is added to the allowed redirect URLs in Supabase Dashboard
          emailRedirectTo: `${window.location.origin}/confirm-email`,
          // Only include non-auth related metadata
          // DO NOT include email_verified here - Supabase manages this automatically
          data: {
            full_name: sanitizedUserData.full_name,
            role: sanitizedUserData.role,
          }
        }
      });


      if (error) return { error, session: null, user: null };

      // Create user profile in database
      // Note: Email verification status is tracked in auth.users.email_confirmed_at
      // and should be accessed via user.email_confirmed_at, not stored in user_profiles
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: sanitizedEmail,
            full_name: sanitizedUserData.full_name,
            phone: sanitizedUserData.phone,
            role: sanitizedUserData.role,
            avatar_url: sanitizedUserData.avatar_url,
            skin_type: sanitizedUserData.skin_type,
            concerns: sanitizedUserData.concerns,
            business_name: sanitizedUserData.business_name,
            license_number: sanitizedUserData.license_number,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          return { error: profileError, session: null, user: data.user };
        }
      }


      // If session is null but user exists, email confirmation is required
      // This is the expected behavior when "Confirm email" is enabled in Supabase
      if (data.session) {
        await refreshCSRFToken();
      }

      return { error: null, session: data.session, user: data.user };
    } catch (error) {
      return { error: error as Error, session: null, user: null };
    }
  };



  /**
   * Signs in an existing user with email and password.
   * Email is sanitized before authentication.
   * 
   * @async
   * @function signIn
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<{error: AuthError | Error | null}>}
   * 
   * @example
   * const { error } = await signIn('user@example.com', 'password123');
   * if (error) {
   *   showError('Invalid credentials');
   * } else {
   *   redirectToDashboard();
   * }
   */
  const signIn = async (email: string, password: string) => {
    try {
      // Sanitize email to prevent injection attacks
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (!error) {
        // Fetch CSRF token after successful login
        await refreshCSRFToken();
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  /**
   * Signs out the current user and clears all security tokens.
   * 
   * @async
   * @function signOut
   * @returns {Promise<void>}
   * 
   * @description
   * This function:
   * 1. Calls secure logout endpoint to clear httpOnly cookies
   * 2. Signs out from Supabase
   * 3. Clears local state (user, profile, session)
   * 4. Clears CSRF token
   */
  const signOut = async () => {
    try {
      // Call secure logout endpoint to clear httpOnly cookies on server
      await supabase.functions.invoke('secure-auth', {
        body: { action: 'logout' },
      });
    } catch (err) {
      console.error('Error calling secure logout:', err);
    }


    // Clear local auth state
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    
    // Clear CSRF token from storage and state
    clearCSRFToken();
    setCsrfTokenState(null);
  };

  /**
   * Sends a password reset email to the specified address.
   * 
   * @async
   * @function resetPassword
   * @param {string} email - User's email address
   * @returns {Promise<{error: AuthError | Error | null}>}
   * 
   * @example
   * const { error } = await resetPassword('user@example.com');
   * if (!error) {
   *   showMessage('Check your email for reset instructions');
   * }
   */
  const resetPassword = async (email: string) => {
    try {
      // Sanitize email before sending
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
      
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  /**
   * Updates the current user's password.
   * 
   * @async
   * @function updatePassword
   * @param {string} newPassword - The new password
   * @returns {Promise<{error: AuthError | Error | null}>}
   * 
   * @description
   * After successful password update, a new CSRF token is fetched
   * to ensure continued security.
   */
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (!error) {
        // Refresh CSRF token after password change for security
        await refreshCSRFToken();
      }
      
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  /**
   * Updates the current user's profile data.
   * All input is sanitized to prevent XSS attacks.
   * 
   * @async
   * @function updateProfile
   * @param {Partial<UserProfile>} updates - Profile fields to update
   * @returns {Promise<{error: Error | null}>}
   * 
   * @example
   * const { error } = await updateProfile({
   *   full_name: 'Jane Doe',
   *   phone: '+1234567890'
   * });
   * 
   * if (!error) {
   *   showSuccess('Profile updated');
   * }
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      // Sanitize all update fields to prevent XSS
      const sanitizedUpdates: Partial<UserProfile> = {};
      
      if (updates.full_name !== undefined) {
        sanitizedUpdates.full_name = sanitizeInput(updates.full_name);
      }
      if (updates.phone !== undefined) {
        sanitizedUpdates.phone = updates.phone ? sanitizeInput(updates.phone) : undefined;
      }
      if (updates.avatar_url !== undefined) {
        sanitizedUpdates.avatar_url = updates.avatar_url ? sanitizeInput(updates.avatar_url) : undefined;
      }
      if (updates.skin_type !== undefined) {
        sanitizedUpdates.skin_type = updates.skin_type ? sanitizeInput(updates.skin_type) : undefined;
      }
      if (updates.concerns !== undefined) {
        sanitizedUpdates.concerns = updates.concerns ? updates.concerns.map(c => sanitizeInput(c)) : undefined;
      }
      if (updates.business_name !== undefined) {
        sanitizedUpdates.business_name = updates.business_name ? sanitizeInput(updates.business_name) : undefined;
      }
      if (updates.license_number !== undefined) {
        sanitizedUpdates.license_number = updates.license_number ? sanitizeInput(updates.license_number) : undefined;
      }

      // Update profile in database
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...sanitizedUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Refresh local profile state on success
      if (!error) {
        await refreshProfile();
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  /**
   * Resends the verification email to the specified address.
   * 
   * @async
   * @function resendVerificationEmail
   * @param {string} email - User's email address
   * @returns {Promise<{error: AuthError | Error | null}>}
   * 
   * @example
   * const { error } = await resendVerificationEmail('user@example.com');
   * if (!error) {
   *   showMessage('Verification email sent');
   * }
   */
  const resendVerificationEmail = async (email: string) => {
    try {
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: sanitizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`,
        },
      });
      
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // ========================================================================
  // CONTEXT VALUE
  // ========================================================================

  /**
   * Context value object containing all auth state and methods.
   */
  const value = {
    user,
    profile,
    session,
    loading,
    csrfToken,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
    refreshCSRFToken,
    resendVerificationEmail,
  };


  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
