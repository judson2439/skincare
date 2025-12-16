import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { checkPasswordStrength, type PasswordStrength } from '@/lib/security';
import {
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Shield
} from 'lucide-react';

// Password strength indicator component
const PasswordStrengthIndicator: React.FC<{ strength: PasswordStrength }> = ({ strength }) => {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const color = colors[strength.score];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index <= strength.score ? color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${
          strength.score <= 1 ? 'text-red-500' :
          strength.score === 2 ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {strength.label}
        </span>
        {strength.suggestions.length > 0 && (
          <span className="text-xs text-gray-400">{strength.suggestions[0]}</span>
        )}
      </div>
    </div>
  );
};

const ResetPassword: React.FC = () => {
  const { updatePassword, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  // Check if user has a valid session (came from email link)
  useEffect(() => {
    if (!session) {
      // If no session, redirect to home after a delay
      const timer = setTimeout(() => {
        toast({
          title: 'Session Expired',
          description: 'Please request a new password reset link.',
          variant: 'destructive',
        });
        navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [session, navigate, toast]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength && passwordStrength.score < 2) {
      newErrors.password = 'Please choose a stronger password';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Could not update password',
          variant: 'destructive',
        });
      } else {
        setSuccess(true);
        toast({
          title: 'Password Updated',
          description: 'Your password has been successfully changed.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9F7F5] via-white to-[#F9F7F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2D2A3E] mb-2">Password Updated!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully changed. You can now sign in with your new password.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F7F5] via-white to-[#F9F7F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#CFAFA3] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-[#2D2A3E]" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2D2A3E]">Set New Password</h2>
          <p className="text-gray-500 mt-1">Enter your new password below</p>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
          <Shield className="w-4 h-4 text-green-500" />
          <span>Your password is securely encrypted</span>
        </div>

        {!session ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Verifying your session...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: '' }); }}
                  className={`w-full pl-12 pr-12 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none transition-all`}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              {passwordStrength && <PasswordStrengthIndicator strength={passwordStrength} />}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors({ ...errors, confirmPassword: '' }); }}
                  className={`w-full pl-12 pr-4 py-3 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none transition-all`}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Password requirements */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Password requirements:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  At least 8 characters
                </li>
                <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  One uppercase letter
                </li>
                <li className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-600' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  One lowercase letter
                </li>
                <li className={`flex items-center gap-2 ${/\d/.test(password) ? 'text-green-600' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  One number
                </li>
                <li className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  One special character
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        )}

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

export default ResetPassword;
