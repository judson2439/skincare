/**
 * @fileoverview Email confirmation callback page.
 * Handles the email verification link from Supabase.
 * 
 * Email verification status is stored in auth.users.email_confirmed_at
 * and should be accessed via user.email_confirmed_at from the Supabase User object.
 * 
 * @module pages/ConfirmEmail
 * @version 2.0.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Mail,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

type ConfirmationStatus = 'loading' | 'success' | 'error' | 'expired';

const ConfirmEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token hash from URL (Supabase uses hash-based routing for auth)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');

        // Also check query params (some Supabase versions use query params)
        const queryParams = new URLSearchParams(window.location.search);
        const tokenHash = queryParams.get('token_hash');
        const queryType = queryParams.get('type');

        // Check for error in URL
        if (errorCode || errorDescription) {
          console.error('Email confirmation error:', errorCode, errorDescription);
          setStatus('error');
          setErrorMessage(errorDescription || 'Email confirmation failed');
          return;
        }

        // Handle token_hash based verification (newer Supabase versions)
        if (tokenHash && queryType === 'signup') {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'signup',
          });

          if (error) {
            console.error('OTP verification error:', error);
            setStatus('error');
            setErrorMessage(error.message);
            return;
          }

          if (data.user) {
            setUserEmail(data.user.email || '');
            // Email verification status is now in auth.users.email_confirmed_at
            // No need to update user_profiles - just show success
            setStatus('success');
            toast({
              title: 'Email Verified!',
              description: 'Your email has been successfully verified. Welcome to SkinAura PRO!',
            });
            return;
          }
        }

        // If we have tokens and it's a signup confirmation (hash-based)
        if (accessToken && type === 'signup') {
          // Set the session with the tokens
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setStatus('error');
            setErrorMessage(sessionError.message);
            return;
          }

          if (sessionData.user) {
            setUserEmail(sessionData.user.email || '');
            // Email verification status is now in auth.users.email_confirmed_at
            // No need to update user_profiles - just show success
            setStatus('success');
            toast({
              title: 'Email Verified!',
              description: 'Your email has been successfully verified. Welcome to SkinAura PRO!',
            });
          }
        } else if (type === 'recovery' || queryType === 'recovery') {
          // This is a password recovery, redirect to reset password page
          navigate('/reset-password' + window.location.hash + window.location.search);
          return;
        } else {
          // Try to get current session - user might already be confirmed
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Check if email is already confirmed in auth.users
            if (session.user.email_confirmed_at) {
              setUserEmail(session.user.email || '');
              setStatus('success');
            } else {
              setStatus('loading');
              // Wait a moment and check again
              setTimeout(async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email_confirmed_at) {
                  setUserEmail(user.email || '');
                  setStatus('success');
                } else {
                  setStatus('error');
                  setErrorMessage('Email confirmation is pending. Please check your email for the verification link.');
                }
              }, 2000);
            }
          } else {
            // No session and no tokens - might be expired or invalid link
            setStatus('expired');
            setErrorMessage('This confirmation link has expired or is invalid.');
          }
        }
      } catch (error: any) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'An unexpected error occurred');
      }
    };

    handleEmailConfirmation();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if this is from email confirmation
        // The email_confirmed_at field in auth.users is the source of truth
        if (session.user.email_confirmed_at) {
          setUserEmail(session.user.email || '');
          setStatus('success');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);


  const handleResendEmail = async () => {
    if (!userEmail) {
      toast({
        title: 'Error',
        description: 'No email address found. Please try signing up again.',
        variant: 'destructive',
      });
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`,
        },
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email Sent!',
          description: 'A new verification email has been sent to your inbox.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend verification email',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-[#CFAFA3]/20 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-[#CFAFA3] animate-spin" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#2D2A3E] mb-2">
              Verifying Your Email
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your email address...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#2D2A3E] mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-2">
              Your email has been successfully verified.
            </p>
            {userEmail && (
              <p className="text-sm text-gray-500 mb-6">
                <strong>{userEmail}</strong>
              </p>
            )}
            <p className="text-gray-600 mb-8">
              Welcome to SkinAura PRO! You can now access all features of your account.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#2D2A3E] mb-2">
              Link Expired
            </h2>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'This confirmation link has expired. Please request a new verification email.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Resend Verification Email
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#2D2A3E] mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'We could not verify your email address. Please try again.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Resend Verification Email
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F7F5] via-white to-[#F9F7F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl">
        {renderContent()}

        {/* Footer branding */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-[#2D2A3E]" />
            </div>
            <span className="text-sm font-medium">SkinAura PRO</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
