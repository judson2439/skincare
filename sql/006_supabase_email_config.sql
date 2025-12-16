-- ============================================================================
-- Supabase Email Verification Configuration Guide
-- Version: 2.0
-- Description: Instructions for configuring email verification in Supabase
-- ============================================================================

-- ============================================================================
-- IMPORTANT: Email Verification Status Location
-- ============================================================================
--
-- Email verification status is stored in auth.users.email_confirmed_at
-- This is managed automatically by Supabase.
--
-- DO NOT store email_confirmed in user_profiles table.
-- Access the verification status via:
--   - Frontend: user.email_confirmed_at (from Supabase User object)
--   - SQL: auth.users.email_confirmed_at
--
-- ============================================================================

-- ============================================================================
-- WARNING: Email Verification is DISABLED by Default
-- ============================================================================
--
-- By default, Supabase does NOT require email verification. This means:
-- - Users can log in immediately after signup
-- - email_confirmed_at is set immediately
-- - email_verified in raw_user_meta_data is set to true
--
-- To ENABLE email verification, you must configure it in the Supabase Dashboard.
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable Email Confirmation in Supabase Dashboard
-- ============================================================================
--
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to: Authentication > Providers > Email
-- 3. Find the "Confirm email" toggle and ENABLE it
-- 4. Click "Save"
--
-- When "Confirm email" is ENABLED:
-- - Supabase will send a verification email on signup
-- - Users CANNOT log in until they click the verification link
-- - The signup API will return a user but NO session (session = null)
-- - email_confirmed_at will be NULL until the user verifies
--
-- IMPORTANT: Without this setting enabled, email verification will NOT work!
--
-- ============================================================================

-- ============================================================================
-- STEP 2: Configure Site URL and Redirect URLs
-- ============================================================================
--
-- 1. Go to: Authentication > URL Configuration
-- 2. Set "Site URL" to your application's base URL:
--    - Development: http://localhost:5173 (or your dev port)
--    - Production: https://your-app-domain.com
--
-- 3. Add redirect URLs to "Redirect URLs":
--    - http://localhost:5173/confirm-email
--    - http://localhost:5173/reset-password
--    - https://your-app-domain.com/confirm-email
--    - https://your-app-domain.com/reset-password
--
-- These URLs are where users will be redirected after:
-- - Clicking the email confirmation link
-- - Clicking the password reset link
--
-- ============================================================================

-- ============================================================================
-- STEP 3: Customize Email Templates (Optional)
-- ============================================================================
--
-- 1. Go to: Authentication > Email Templates
-- 2. Customize the following templates:
--
-- CONFIRM SIGNUP TEMPLATE:
-- Subject: Confirm your SkinAura PRO account
-- Body:
/*
<h2>Welcome to SkinAura PRO!</h2>
<p>Thank you for signing up. Please confirm your email address by clicking the button below:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #CFAFA3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Confirm Email</a></p>
<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
<p>Best regards,<br>The SkinAura PRO Team</p>
*/

-- RESET PASSWORD TEMPLATE:
-- Subject: Reset your SkinAura PRO password
-- Body:
/*
<h2>Password Reset Request</h2>
<p>We received a request to reset your password. Click the button below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #CFAFA3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></p>
<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>
<p>Best regards,<br>The SkinAura PRO Team</p>
*/

-- ============================================================================

-- ============================================================================
-- STEP 4: Configure SMTP (Required for Production)
-- ============================================================================
--
-- For production, you should configure a custom SMTP server for better
-- email deliverability. Supabase's built-in email has rate limits.
--
-- 1. Go to: Project Settings > Auth
-- 2. Scroll to "SMTP Settings"
-- 3. Enable "Custom SMTP"
-- 4. Configure your SMTP provider:
--
-- Popular SMTP providers:
-- - SendGrid (recommended)
-- - Mailgun
-- - Amazon SES
-- - Postmark
-- - Resend
--
-- Example SendGrid configuration:
-- - Host: smtp.sendgrid.net
-- - Port: 587
-- - Username: apikey
-- - Password: your-sendgrid-api-key
-- - Sender email: noreply@your-domain.com
-- - Sender name: SkinAura PRO
--
-- ============================================================================

-- ============================================================================
-- HOW EMAIL VERIFICATION WORKS
-- ============================================================================
--
-- 1. User signs up with email and password
-- 2. If "Confirm email" is enabled:
--    - Supabase creates the user in auth.users
--    - email_confirmed_at is NULL
--    - Supabase sends a verification email
--    - The signup API returns user but NO session
-- 3. User clicks the verification link in email
-- 4. Supabase verifies the token and sets email_confirmed_at
-- 5. User is redirected to /confirm-email with access tokens
-- 6. The app sets the session and user can now log in
--
-- ============================================================================

-- ============================================================================
-- CHECKING EMAIL VERIFICATION STATUS
-- ============================================================================
--
-- In Frontend (React):
-- ---------------------
-- import { useAuth } from '@/contexts/AuthContext';
--
-- function MyComponent() {
--   const { user } = useAuth();
--   
--   // Check if email is verified
--   const isEmailVerified = user?.email_confirmed_at != null;
--   
--   if (!isEmailVerified) {
--     return <VerifyEmailPrompt />;
--   }
--   
--   return <Dashboard />;
-- }
--
-- In SQL Queries:
-- ---------------
-- SELECT 
--   id,
--   email,
--   email_confirmed_at,
--   email_confirmed_at IS NOT NULL as is_verified
-- FROM auth.users
-- WHERE id = 'user-uuid';
--
-- ============================================================================

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
--
-- Issue: Users can log in without verifying email
-- Solution: Enable "Confirm email" in Authentication > Providers > Email
--
-- Issue: Verification emails not being sent
-- Solutions:
-- 1. Check that "Confirm email" is enabled
-- 2. Check spam/junk folder
-- 3. Verify SMTP settings if using custom SMTP
-- 4. Check Supabase logs for email errors
--
-- Issue: Verification link doesn't work
-- Solutions:
-- 1. Check that redirect URL is in allowed list
-- 2. Ensure Site URL is correct
-- 3. Check if link has expired (24 hours default)
--
-- Issue: User stuck in unverified state
-- Solution: Resend verification email using:
--   await supabase.auth.resend({ type: 'signup', email: userEmail })
--
-- ============================================================================

-- ============================================================================
-- USEFUL QUERIES FOR DEBUGGING
-- ============================================================================

-- Check auth.users email status:
/*
SELECT 
  id,
  email,
  email_confirmed_at,
  email_confirmed_at IS NOT NULL as is_verified,
  raw_user_meta_data->>'full_name' as name,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
*/

-- Find users with unverified emails:
/*
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as name,
  created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;
*/

-- Manually verify a user's email (use with caution):
/*
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
*/

-- ============================================================================
-- PRODUCTION CHECKLIST
-- ============================================================================
--
-- [ ] "Confirm email" is ENABLED in Authentication > Providers > Email
-- [ ] Site URL is set to production domain
-- [ ] Redirect URLs include production /confirm-email and /reset-password
-- [ ] Custom SMTP is configured for better deliverability
-- [ ] Email templates are customized with your branding
-- [ ] Tested signup flow end-to-end
-- [ ] Tested password reset flow end-to-end
-- [ ] Tested resend verification email functionality
--
-- ============================================================================
