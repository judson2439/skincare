/**
 * @fileoverview Authentication context provider for managing user authentication state.
 * Provides secure authentication with input sanitization and session management.
 * 
 * @module contexts/AuthContext
 * @version 1.3.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { sanitizeInput } from '@/lib/security';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User profile data stored in the database.
 * @interface UserProfile
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
  professional_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Data required for user signup
 * @interface SignUpData
 */
interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'client' | 'professional';
  skin_type?: string;
  concerns?: string[];
  business_name?: string;
  license_number?: string;
  avatarFile?: File;
}

/**
 * Result of signup operation
 * @interface SignUpResult
 */
interface SignUpResult {
  error: AuthError | Error | null;
  session: Session | null;
  user: User | null;
  requiresEmailConfirmation: boolean;
}

/**
 * Result of signin operation
 * @interface SignInResult
 */
interface SignInResult {
  error: AuthError | Error | null;
  user: User | null;
  profile: UserProfile | null;
}

/**
 * Authentication context value type.
 * @interface AuthContextType
 */
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isSessionValid: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  
  signUp: (data: SignUpData) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<{ success: boolean; error?: string }>;
  clearSessionAndRedirect: () => Promise<void>;
}


// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider component.
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

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Authentication provider component.
 * Wraps the application to provide authentication state and methods.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // ========================================================================
  // STATE
  // ========================================================================
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);

  // ========================================================================
  // SESSION INITIALIZATION & AUTH STATE LISTENER
  // ========================================================================

  useEffect(() => {
    /**
     * Initialize session on mount using supabase.auth.getSession() and getUser()
     * This handles page refresh scenarios
     */
    const initializeSession = async () => {
      try {
        console.log('[AuthContext] Initializing session...');
        
        // Step 1: Get current session using supabase.auth.getSession()
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthContext] Error getting session:', sessionError);
          setLoading(false);
          setIsSessionValid(false);
          return;
        }

        // If no session exists, user is not logged in
        if (!sessionData.session) {
          console.log('[AuthContext] No active session found');
          setUser(null);
          setProfile(null);
          setSession(null);
          setIsSessionValid(false);
          setLoading(false);
          return;
        }

        console.log('[AuthContext] Session found, validating...');

        // Step 2: Validate session by getting user with supabase.auth.getUser()
        // This makes a request to the Supabase Auth server to validate the JWT
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          console.error('[AuthContext] Session invalid or user not found:', userError);
          // Session is invalid, clear everything
          await clearSessionAndRedirect();
          return;
        }

        console.log('[AuthContext] User validated:', userData.user.id);

        // Step 3: Fetch user profile from user_profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userData.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[AuthContext] Error fetching profile:', profileError);
          // User exists but profile fetch failed - still set user and session
          setUser(userData.user);
          setSession(sessionData.session);
          setProfile(null);
          setIsSessionValid(true);
          setLoading(false);
          return;
        }

        // Step 4: Set all state
        setUser(userData.user);
        setSession(sessionData.session);
        setProfile(profileData as UserProfile | null);
        setIsSessionValid(true);
        
        console.log('[AuthContext] Session initialized successfully', {
          userId: userData.user.id,
          role: profileData?.role
        });

      } catch (error) {
        console.error('[AuthContext] Unexpected error during session initialization:', error);
        setIsSessionValid(false);
      } finally {
        setLoading(false);
      }
    };

    // Initialize session on mount
    initializeSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[AuthContext] Auth state changed:', event);

        if (event === 'SIGNED_IN' && currentSession) {
          // User signed in - update state
          setSession(currentSession);
          setUser(currentSession.user);
          setIsSessionValid(true);

          // Fetch profile
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .maybeSingle();

          if (profileData) {
            setProfile(profileData as UserProfile);
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out - clear state
          setUser(null);
          setProfile(null);
          setSession(null);
          setIsSessionValid(false);
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          // Token was refreshed - update session
          setSession(currentSession);
          setIsSessionValid(true);
        } else if (event === 'USER_UPDATED' && currentSession) {
          // User was updated - refresh user data
          setUser(currentSession.user);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ========================================================================
  // AVATAR UPLOAD HELPER
  // ========================================================================

  /**
   * Uploads avatar to progress-photos bucket
   * @param userId - The user's ID
   * @param avatarFile - The avatar file to upload
   * @returns The public URL of the uploaded avatar or null
   */
  const uploadAvatar = async (userId: string, avatarFile: File): Promise<string | null> => {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(avatarFile.type)) {
        console.error('Invalid file type for avatar');
        return null;
      }

      // Validate file size (max 5MB)
      if (avatarFile.size > 5 * 1024 * 1024) {
        console.error('Avatar file too large');
        return null;
      }

      // Get file extension
      const fileExt = avatarFile.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        console.error('Invalid file extension');
        return null;
      }

      // Create unique filename
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to progress-photos bucket
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      return null;
    }
  };

  // ========================================================================
  // AUTHENTICATION METHODS
  // ========================================================================

  /**
   * Registers a new user with comprehensive profile creation.
   * Uses the signup-with-avatar edge function to handle:
   * 1. User creation in auth.users
   * 2. Avatar upload to progress-photos bucket (bypasses RLS with service role)
   * 3. Profile creation in user_profiles table
   * 4. Sending confirmation email
   * 
   * @param data - SignUpData containing all user information
   * @returns SignUpResult with error, session, user, and confirmation status
   */
  const signUp = async (data: SignUpData): Promise<SignUpResult> => {
    try {
      // Sanitize all user-provided data
      const sanitizedEmail = sanitizeInput(data.email.toLowerCase().trim());
      const sanitizedFullName = sanitizeInput(data.full_name.trim());
      const sanitizedPhone = data.phone ? sanitizeInput(data.phone.trim()) : null;
      const sanitizedSkinType = data.skin_type ? sanitizeInput(data.skin_type) : null;
      const sanitizedConcerns = data.concerns ? data.concerns.map(c => sanitizeInput(c)) : null;
      const sanitizedBusinessName = data.business_name ? sanitizeInput(data.business_name.trim()) : null;
      const sanitizedLicenseNumber = data.license_number ? sanitizeInput(data.license_number.trim()) : null;

      // Create FormData for the edge function
      const formData = new FormData();
      formData.append('email', sanitizedEmail);
      formData.append('password', data.password);
      formData.append('fullName', sanitizedFullName);
      formData.append('role', data.role);
      
      if (sanitizedPhone) {
        formData.append('phone', sanitizedPhone);
      }
      if (sanitizedSkinType) {
        formData.append('skinType', sanitizedSkinType);
      }
      if (sanitizedConcerns && sanitizedConcerns.length > 0) {
        formData.append('concerns', JSON.stringify(sanitizedConcerns));
      }
      if (sanitizedBusinessName) {
        formData.append('businessName', sanitizedBusinessName);
      }
      if (sanitizedLicenseNumber) {
        formData.append('licenseNumber', sanitizedLicenseNumber);
      }
      if (data.avatarFile) {
        formData.append('avatar', data.avatarFile);
      }

      // Call the signup-with-avatar edge function using supabase.functions.fetch
      const response = await supabase.functions.invoke('signup-with-avatar', {
        method: 'POST',
        body: formData,
      });

      // Supabase functions.invoke returns: { data, error }
      // API result should be in response.data, not .json()
      const { data: result, error: invokeError } = response;

      if (invokeError || !result || result.error) {
        return {
          error: new Error(
            invokeError?.message || result?.error || 'Failed to create account'
          ),
          session: null,
          user: null,
          requiresEmailConfirmation: false,
        };
      }

      // Signup successful
      return {
        error: null,
        session: null, // Session will be created after email confirmation
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          user_metadata: {
            full_name: result.user.full_name,
            role: result.user.role,
          },
        } as unknown as User : null,
        requiresEmailConfirmation: result.requiresEmailConfirmation ?? true,
      };
    } catch (error) {
      console.error('SignUp error:', error);
      return {
        error: error as Error,
        session: null,
        user: null,
        requiresEmailConfirmation: false,
      };
    }
  };



  /**
   * Signs in an existing user with email and password.
   * 1. Authenticates with auth.users table via Supabase Auth
   * 2. Fetches user profile from public.user_profiles table
   * 3. Returns both auth result and profile with role for navigation
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns SignInResult with error, user, and profile (including role)
   */
  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    try {
      // Step 1: Sanitize email input
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());

      // Step 2: Authenticate with auth.users table
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      // If authentication fails, return error
      if (authError) {
        return {
          error: authError,
          user: null,
          profile: null,
        };
      }

      // Step 3: Check if we have a user from auth
      if (!authData.user) {
        return {
          error: new Error('Authentication failed: No user returned'),
          user: null,
          profile: null,
        };
      }

      // Step 4: Verify session was stored using getSession()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('Session not stored after sign in:', sessionError);
        return {
          error: new Error('Failed to establish session'),
          user: null,
          profile: null,
        };
      }

      // Step 5: Fetch user profile from public.user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile after login:', profileError);
        // User is authenticated but profile fetch failed
        // Still return success but with null profile
        return {
          error: null,
          user: authData.user,
          profile: null,
        };
      }

      if (!profileData) {
        console.warn('No profile found for authenticated user');
        return {
          error: null,
          user: authData.user,
          profile: null,
        };
      }

      // Step 6: Update local state
      setUser(authData.user);
      setSession(sessionData.session);
      setProfile(profileData as UserProfile);
      setIsSessionValid(true);

      // Step 7: Return success with user and profile
      return {
        error: null,
        user: authData.user,
        profile: profileData as UserProfile,
      };
    } catch (error) {
      console.error('SignIn error:', error);
      return {
        error: error as Error,
        user: null,
        profile: null,
      };
    }
  };

  /**
   * Signs out the current user and clears all local state.
   */
  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }

      // Clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsSessionValid(false);

      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as Error };
    }
  };

  /**
   * Clears the session and redirects to the home page.
   * Used when session is invalid or expired.
   */
  const clearSessionAndRedirect = async (): Promise<void> => {
    try {
      console.log('[AuthContext] Clearing session and redirecting...');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsSessionValid(false);
      setLoading(false);

      // Redirect to home page
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('[AuthContext] Error clearing session:', error);
      // Still clear local state even if signOut fails
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsSessionValid(false);
      setLoading(false);
    }
  };

  /**
   * Refreshes the current session and re-fetches user profile.
   * Useful for validating session on protected routes.
   */
  const refreshSession = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[AuthContext] Error refreshing session:', sessionError);
        return { success: false, error: sessionError.message };
      }

      if (!sessionData.session) {
        return { success: false, error: 'No active session' };
      }

      // Validate user
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.error('[AuthContext] User validation failed:', userError);
        return { success: false, error: userError?.message || 'User not found' };
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[AuthContext] Error fetching profile:', profileError);
      }

      // Update state
      setUser(userData.user);
      setSession(sessionData.session);
      setProfile(profileData as UserProfile | null);
      setIsSessionValid(true);

      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Unexpected error refreshing session:', error);
      return { success: false, error: 'Unexpected error' };
    }
  };

  /**
   * Updates the current user's password.
   */
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  /**
   * Updates the current user's profile data.
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
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

      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...sanitizedUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (!error && user) {
        // Fetch updated profile
        const { data: updatedProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (updatedProfile) {
          setProfile(updatedProfile as UserProfile);
        }
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // ========================================================================
  // CONTEXT VALUE
  // ========================================================================

  const value = {
    user,
    profile,
    session,
    loading,
    isSessionValid,
    setUser,
    setProfile,
    setSession,
    setLoading,
    signUp,
    signIn,
    signOut,
    updatePassword,
    updateProfile,
    refreshSession,
    clearSessionAndRedirect,
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
