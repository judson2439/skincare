-- ============================================================================
-- Email Verification Schema Updates
-- Version: 2.0
-- Description: Cleanup script to remove email_confirmed columns from user_profiles.
--              Email verification status should be read directly from auth.users.email_confirmed_at
-- ============================================================================

-- ============================================================================
-- IMPORTANT: Email Verification Status
-- ============================================================================
-- 
-- Email verification status is managed by Supabase in the auth.users table.
-- The field auth.users.email_confirmed_at contains the timestamp when the
-- user verified their email (NULL if not verified).
--
-- DO NOT store email_confirmed in user_profiles - use auth.users directly.
-- Access it via the Supabase User object: user.email_confirmed_at
--
-- In your frontend code:
--   const { data: { user } } = await supabase.auth.getUser();
--   const isEmailConfirmed = user?.email_confirmed_at !== null;
--
-- ============================================================================

-- Drop the sync trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- Drop the sync function if it exists
DROP FUNCTION IF EXISTS public.sync_email_confirmation();

-- Drop the manual sync function if it exists
DROP FUNCTION IF EXISTS public.sync_all_email_confirmations();

-- Drop the view if it exists
DROP VIEW IF EXISTS public.user_email_status;

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_user_profiles_email_confirmed;

-- Remove email_confirmed column from user_profiles if it exists
ALTER TABLE user_profiles DROP COLUMN IF EXISTS email_confirmed;

-- Remove email_confirmed_at column from user_profiles if it exists
ALTER TABLE user_profiles DROP COLUMN IF EXISTS email_confirmed_at;

-- ============================================================================
-- TRIGGER: Handle new user creation (simplified - no email_confirmed fields)
-- ============================================================================

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user if it doesn't exist
  -- This is a fallback in case the frontend fails to create the profile
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name, 
    role,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- HOW TO CHECK EMAIL VERIFICATION STATUS
-- ============================================================================
--
-- Option 1: In Frontend (Recommended)
-- ------------------------------------
-- The Supabase User object includes email_confirmed_at:
--
--   import { useAuth } from '@/contexts/AuthContext';
--   
--   function MyComponent() {
--     const { user } = useAuth();
--     const isEmailVerified = user?.email_confirmed_at != null;
--     
--     if (!isEmailVerified) {
--       return <VerifyEmailPrompt />;
--     }
--     return <Dashboard />;
--   }
--
-- Option 2: In SQL Queries
-- ------------------------
-- Join with auth.users to get email confirmation status:
--
--   SELECT 
--     up.*,
--     au.email_confirmed_at IS NOT NULL as is_email_verified
--   FROM user_profiles up
--   JOIN auth.users au ON up.id = au.id
--   WHERE au.email_confirmed_at IS NOT NULL;
--
-- Option 3: Create a View (if needed frequently)
-- ----------------------------------------------
-- CREATE VIEW user_profiles_with_email_status AS
-- SELECT 
--   up.*,
--   au.email_confirmed_at,
--   au.email_confirmed_at IS NOT NULL as is_email_verified
-- FROM user_profiles up
-- LEFT JOIN auth.users au ON up.id = au.id;
--
-- ============================================================================
