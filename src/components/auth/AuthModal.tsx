/**
 * @fileoverview Authentication modal component for user login and registration.
 * Provides a secure, user-friendly interface for authentication with role selection,
 * password strength indicators, and comprehensive form validation.
 * 
 * @module components/auth/AuthModal
 * @version 1.2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  validateInput,
  sanitizeInput,
  checkPasswordStrength,
  type PasswordStrength,
} from '@/lib/security';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  Users,
  ArrowLeft,
  Loader2,
  Building,
  FileText,
  Droplets,
  CheckCircle,
  Camera,
  Shield,
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  initialRole?: 'client' | 'professional';
}

type AuthView = 'select-role' | 'login' | 'signup' | 'forgot-password' | 'check-email';

// ============================================================================
// CONSTANTS
// ============================================================================

const SKIN_TYPES = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];

const SKIN_CONCERNS = [
  'Acne', 'Hyperpigmentation', 'Dark spots', 'Fine lines', 'Wrinkles',
  'Dehydration', 'Redness', 'Texture', 'Uneven tone', 'Dullness'
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login', initialRole }) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<AuthView>(initialRole ? initialMode : 'select-role');
  const [selectedRole, setSelectedRole] = useState<'client' | 'professional' | null>(initialRole || null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [skinType, setSkinType] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Validation and security state
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

  // Client-side validation
  const validateFormData = (isSignup: boolean): boolean => {
    const newErrors: Record<string, string> = {};

    const emailValidation = validateInput(email, 'email');
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error!;
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (isSignup && password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (isSignup) {
      if (!fullName || fullName.trim().length < 2) {
        newErrors.fullName = 'Full name is required (at least 2 characters)';
      } else if (fullName.length > 100) {
        newErrors.fullName = 'Name must be less than 100 characters';
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (passwordStrength && passwordStrength.score < 2) {
        newErrors.password = 'Please choose a stronger password';
      }

      if (selectedRole === 'professional') {
        if (!businessName || businessName.trim().length < 2) {
          newErrors.businessName = 'Business name is required';
        }
      }

      if (phone) {
        const phoneValidation = validateInput(phone, 'phone');
        if (!phoneValidation.valid) {
          newErrors.phone = phoneValidation.error!;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle avatar file selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Please select a valid image file (JPG, PNG, GIF, WebP)', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setAvatarFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle login form submission.
   * Uses the new signIn function from AuthContext that:
   * 1. Authenticates with auth.users table
   * 2. Fetches profile from user_profiles table
   * 3. Returns profile with role for navigation
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFormData(false)) return;

    setLoading(true);
    try {
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
      
      // Call the new signIn function from AuthContext
      const result = await signIn(sanitizedEmail, password);

      if (result.error) {
        toast({
          title: 'Login Failed',
          description: result.error.message || 'Invalid email or password',
          variant: 'destructive',
        });
        return;
      }

      // Login successful
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });

      // Close the modal
      onClose();
      resetForm();

      // Navigate based on user role from profile
      if (result.profile?.role === 'client') {
        navigate('/client');
      } else if (result.profile?.role === 'professional') {
        navigate('/professional');
      } else {
        // Fallback if no profile or role found - go to home
        console.warn('No profile role found, navigating to home');
        navigate('/');
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



  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFormData(true) || !selectedRole) return;

    setLoading(true);
    try {
      // Call the new signUp function from AuthContext
      const result = await signUp({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        role: selectedRole,
        skin_type: selectedRole === 'client' ? skinType : undefined,
        concerns: selectedRole === 'client' && selectedConcerns.length > 0 ? selectedConcerns : undefined,
        business_name: selectedRole === 'professional' ? businessName.trim() : undefined,
        license_number: selectedRole === 'professional' ? licenseNumber.trim() : undefined,
        avatarFile: avatarFile || undefined,
      });

      if (result.error) {
        toast({
          title: 'Signup Failed',
          description: result.error.message || 'Could not create account',
          variant: 'destructive',
        });
        return;
      }

      if (result.requiresEmailConfirmation) {
        // Email confirmation is required
        setView('check-email');
        toast({
          title: 'Account Created!',
          description: 'Please check your email to verify your account.',
        });
      } else if (result.session) {
        // User is logged in immediately
        toast({
          title: 'Welcome to SkinAura PRO!',
          description: 'Your account has been created successfully.',
        });
        onClose();
        resetForm();
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidation = validateInput(email, 'email');
    if (!emailValidation.valid) {
      setErrors({ email: emailValidation.error! });
      return;
    }

    setLoading(true);
    try {
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
      const { error } = await resetPassword(sanitizedEmail);
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Could not send reset email',
          variant: 'destructive',
        });
      } else {
        setResetEmailSent(true);
        toast({
          title: 'Email Sent',
          description: 'Check your email for password reset instructions.',
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

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
    setSkinType('');
    setSelectedConcerns([]);
    setBusinessName('');
    setLicenseNumber('');
    setAvatarFile(null);
    setAvatarPreview('');
    setErrors({});
    setResetEmailSent(false);
    setPasswordStrength(null);
  };

  const handleRoleSelect = (role: 'client' | 'professional') => {
    setSelectedRole(role);
    setView('login');
  };

  const toggleConcern = (concern: string) => {
    setSelectedConcerns(prev =>
      prev.includes(concern)
        ? prev.filter(c => c !== concern)
        : [...prev, concern]
    );
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  // Role Selection View
  const renderRoleSelection = () => (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-8 h-8 text-[#2D2A3E]" />
      </div>
      <h2 className="text-2xl font-serif font-bold text-[#2D2A3E] mb-2">Welcome to SkinAura PRO</h2>
      <p className="text-gray-600 mb-8">Choose how you'd like to continue</p>

      <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
        <Shield className="w-4 h-4 text-green-500" />
        <span>Secured with encryption & CSRF protection</span>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleRoleSelect('client')}
          className="w-full p-6 bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10 border-2 border-[#CFAFA3]/30 rounded-2xl hover:border-[#CFAFA3] hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-7 h-7 text-[#2D2A3E]" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg text-[#2D2A3E]">I'm a Client</h3>
              <p className="text-sm text-gray-500">Track your skincare routine and earn rewards</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleRoleSelect('professional')}
          className="w-full p-6 bg-gradient-to-r from-[#2D2A3E]/5 to-[#3D3A4E]/5 border-2 border-[#2D2A3E]/20 rounded-2xl hover:border-[#2D2A3E] hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2D2A3E] to-[#3D3A4E] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg text-[#2D2A3E]">I'm a Professional</h3>
              <p className="text-sm text-gray-500">Manage clients and track their progress</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  // Login Form
  const renderLoginForm = () => (
    <div>
      <button
        onClick={() => { setView('select-role'); setSelectedRole(null); resetForm(); }}
        className="flex items-center gap-2 text-gray-500 hover:text-[#CFAFA3] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center mb-8">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedRole === 'client' ? 'from-[#CFAFA3] to-[#E8D5D0]' : 'from-[#2D2A3E] to-[#3D3A4E]'} flex items-center justify-center mx-auto mb-4`}>
          {selectedRole === 'client' ? <User className="w-7 h-7 text-[#2D2A3E]" /> : <Users className="w-7 h-7 text-white" />}
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#2D2A3E]">
          {selectedRole === 'client' ? 'Client Login' : 'Professional Login'}
        </h2>
        <p className="text-gray-500 mt-1">Welcome back! Sign in to continue.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: '' }); }}
              className={`w-full pl-12 pr-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none transition-all`}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: '' }); }}
              className={`w-full pl-12 pr-12 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none transition-all`}
              placeholder="••••••••"
              autoComplete="current-password"
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
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setView('forgot-password')}
            className="text-sm text-[#CFAFA3] hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            selectedRole === 'client'
              ? 'bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white hover:shadow-lg hover:shadow-[#CFAFA3]/30'
              : 'bg-[#2D2A3E] text-white hover:bg-[#3D3A4E]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-gray-500 mt-6">
        Don't have an account?{' '}
        <button onClick={() => setView('signup')} className="text-[#CFAFA3] font-medium hover:underline">
          Sign up
        </button>
      </p>
    </div>
  );



  // Signup Form
  const renderSignupForm = () => (
    <div>
      <button
        onClick={() => { setView('login'); resetForm(); }}
        className="flex items-center gap-2 text-gray-500 hover:text-[#CFAFA3] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to login
      </button>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-[#2D2A3E]">
          Create {selectedRole === 'client' ? 'Client' : 'Professional'} Account
        </h2>
        <p className="text-gray-500 mt-1">Join SkinAura PRO today</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleAvatarSelect}
          className="hidden"
        />

        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Profile Picture (Optional)</label>
          <div className="relative">
            {avatarPreview ? (
              <div className="relative">
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#CFAFA3]/30"
                />
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#CFAFA3] text-white rounded-full flex items-center justify-center hover:bg-[#B89A8E] transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-[#CFAFA3] hover:bg-[#CFAFA3]/5 transition-all group"
              >
                <Camera className="w-8 h-8 text-gray-400 group-hover:text-[#CFAFA3] transition-colors" />
                <span className="text-xs text-gray-400 group-hover:text-[#CFAFA3] mt-1">Add Photo</span>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">JPG, PNG, GIF, WebP up to 5MB</p>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setErrors({ ...errors, fullName: '' }); }}
                className={`w-full pl-12 pr-4 py-3 border ${errors.fullName ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none`}
                placeholder="Your full name"
                autoComplete="name"
                maxLength={100}
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: '' }); }}
                className={`w-full pl-12 pr-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none`}
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors({ ...errors, phone: '' }); }}
                className={`w-full pl-12 pr-4 py-3 border ${errors.phone ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none`}
                placeholder="+1 (555) 000-0000"
                autoComplete="tel"
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: '' }); }}
                className={`w-full pl-12 pr-4 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none`}
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            {passwordStrength && <PasswordStrengthIndicator strength={passwordStrength} />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors({ ...errors, confirmPassword: '' }); }}
                className={`w-full pl-12 pr-4 py-3 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none`}
                placeholder="Confirm password"
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#CFAFA3]"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPassword ? 'Hide passwords' : 'Show passwords'}
          </button>
        </div>

        {/* Client-specific fields */}
        {selectedRole === 'client' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skin Type</label>
              <div className="relative">
                <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none appearance-none bg-white"
                >
                  <option value="">Select your skin type</option>
                  {SKIN_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skin Concerns (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {SKIN_CONCERNS.map(concern => (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleConcern(concern)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedConcerns.includes(concern)
                        ? 'bg-[#CFAFA3] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {concern}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Professional-specific fields */}
        {selectedRole === 'professional' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business/Practice Name *</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => { setBusinessName(e.target.value); setErrors({ ...errors, businessName: '' }); }}
                  className={`w-full pl-12 pr-4 py-3 border ${errors.businessName ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none`}
                  placeholder="Your business name"
                  maxLength={200}
                />
              </div>
              {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number (optional)</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  placeholder="Professional license number"
                  maxLength={50}
                />
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            selectedRole === 'client'
              ? 'bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white hover:shadow-lg hover:shadow-[#CFAFA3]/30'
              : 'bg-[#2D2A3E] text-white hover:bg-[#3D3A4E]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-gray-500 mt-6">
        Already have an account?{' '}
        <button onClick={() => setView('login')} className="text-[#CFAFA3] font-medium hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );

  // Forgot Password Form
  const renderForgotPassword = () => (
    <div>
      <button
        onClick={() => { setView('login'); setResetEmailSent(false); }}
        className="flex items-center gap-2 text-gray-500 hover:text-[#CFAFA3] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to login
      </button>

      {resetEmailSent ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2D2A3E] mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          <button
            onClick={() => { setView('login'); setResetEmailSent(false); resetForm(); }}
            className="w-full py-3 bg-[#2D2A3E] text-white rounded-xl font-medium hover:bg-[#3D3A4E] transition-all"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-[#2D2A3E]" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#2D2A3E]">Reset Password</h2>
            <p className="text-gray-500 mt-1">Enter your email to receive reset instructions</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: '' }); }}
                  className={`w-full pl-12 pr-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none transition-all`}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        </>
      )}
    </div>
  );

  // Check Email View (after signup)
  const renderCheckEmail = () => (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-serif font-bold text-[#2D2A3E] mb-2">Verify Your Email</h2>
      <p className="text-gray-600 mb-6">
        We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Didn't receive the email? Check your spam folder or try signing up again.
      </p>
      <button
        onClick={() => { setView('login'); resetForm(); }}
        className="w-full py-3 bg-[#2D2A3E] text-white rounded-xl font-medium hover:bg-[#3D3A4E] transition-all"
      >
        Back to Login
      </button>
    </div>
  );

  // Render current view
  const renderView = () => {
    switch (view) {
      case 'select-role':
        return renderRoleSelection();
      case 'login':
        return renderLoginForm();
      case 'signup':
        return renderSignupForm();
      case 'forgot-password':
        return renderForgotPassword();
      case 'check-email':
        return renderCheckEmail();
      default:
        return renderRoleSelection();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-end rounded-t-3xl">
          <button
            onClick={() => { onClose(); resetForm(); setView('select-role'); setSelectedRole(null); }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
