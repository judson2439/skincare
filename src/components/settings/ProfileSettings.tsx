// ProfileSettings.tsx - Dedicated profile settings page for users
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import ProfessionalNotificationPreferences from '@/components/notifications/ProfessionalNotificationPreferences';
import {
  User,
  Camera,
  Save,
  Loader2,
  Phone,
  Mail,
  Droplets,
  AlertCircle,
  Check,
  X,
  Upload,
  Trash2,
  Shield,
  Bell,
  Eye,
  EyeOff,
  ClipboardList
} from 'lucide-react';

// Skin type options
const SKIN_TYPES = [
  'Normal',
  'Dry',
  'Oily',
  'Combination',
  'Sensitive'
];

// Common skin concerns
const SKIN_CONCERNS = [
  'Acne',
  'Hyperpigmentation',
  'Dark spots',
  'Fine lines',
  'Wrinkles',
  'Dehydration',
  'Redness',
  'Irritation',
  'Texture',
  'Uneven tone',
  'Acne scars',
  'Large pores',
  'Dullness',
  'Sun damage',
  'Melasma'
];

interface ProfileSettingsProps {
  onClose?: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose }) => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [skinType, setSkinType] = useState(profile?.skin_type || '');
  const [concerns, setConcerns] = useState<string[]>(profile?.concerns || []);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'professional-notifications'>('profile');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const isProfessional = profile?.role === 'professional';

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setSkinType(profile.skin_type || '');
      setConcerns(profile.concerns || []);
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    const profileChanged = 
      fullName !== (profile?.full_name || '') ||
      phone !== (profile?.phone || '') ||
      skinType !== (profile?.skin_type || '') ||
      JSON.stringify(concerns) !== JSON.stringify(profile?.concerns || []) ||
      avatarFile !== null;
    setHasChanges(profileChanged);
  }, [fullName, phone, skinType, concerns, avatarFile, profile]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (phone && !/^[\d\s\-\+\(\)]{10,}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle avatar selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file (JPG, PNG, etc.)',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload avatar to storage
  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      return null;
    }
  };

  // Toggle concern selection
  const toggleConcern = (concern: string) => {
    setConcerns(prev => 
      prev.includes(concern)
        ? prev.filter(c => c !== concern)
        : [...prev, concern]
    );
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    if (!user) return;

    setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        setUploadingAvatar(true);
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
        } else {
          toast({
            title: 'Avatar Upload Failed',
            description: 'Could not upload profile picture. Other changes will still be saved.',
            variant: 'destructive'
          });
        }
        setUploadingAvatar(false);
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          skin_type: skinType || null,
          concerns: concerns.length > 0 ? concerns : null,
          avatar_url: newAvatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile data
      await refreshProfile();

      // Clear file state
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });

      setHasChanges(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    // Validate passwords
    if (!newPassword) {
      toast({ title: 'Error', description: 'Please enter a new password', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated.',
      });

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      toast({
        title: 'Password Change Failed',
        description: error.message || 'Failed to change password. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Get display avatar
  const displayAvatar = avatarPreview || avatarUrl || null;

  return (
    <div className="min-h-screen bg-[#F9F7F5]">
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-500 mt-1">Manage your account information and preferences</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'account'
                ? 'bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            Account
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          {isProfessional && (
            <button
              onClick={() => setActiveTab('professional-notifications')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'professional-notifications'
                  ? 'bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Pro Alerts
            </button>
          )}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-serif font-bold text-lg text-gray-900 mb-4">Profile Picture</h2>
              
              <div className="flex items-center gap-6">
                {/* Avatar Preview */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-xl font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </button>
                    {(avatarPreview || avatarUrl) && (
                      <button
                        onClick={handleRemoveAvatar}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-serif font-bold text-lg text-gray-900 mb-4">Personal Information</h2>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none transition-all ${
                        errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none transition-all ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Skin Profile (for clients) */}
            {profile?.role === 'client' && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="font-serif font-bold text-lg text-gray-900 mb-4">Skin Profile</h2>
                
                <div className="space-y-4">
                  {/* Skin Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skin Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SKIN_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setSkinType(type)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            skinType === type
                              ? 'bg-[#CFAFA3] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skin Concerns */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skin Concerns
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Select all that apply to help your skincare professional personalize your routine.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SKIN_CONCERNS.map((concern) => (
                        <button
                          key={concern}
                          onClick={() => toggleConcern(concern)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            concerns.includes(concern)
                              ? 'bg-[#CFAFA3] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {concerns.includes(concern) && <Check className="w-3 h-3 inline mr-1" />}
                          {concern}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              {hasChanges && (
                <p className="text-sm text-amber-600 flex items-center gap-1 mr-auto">
                  <AlertCircle className="w-4 h-4" />
                  You have unsaved changes
                </p>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={saving || !hasChanges}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-serif font-bold text-lg text-gray-900 mb-4">Account Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Account Type</p>
                    <p className="text-sm text-gray-500 capitalize">{profile?.role || 'User'}</p>
                  </div>
                  <div className="px-3 py-1 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-full text-sm font-medium capitalize">
                    {profile?.role}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Member Since</p>
                    <p className="text-sm text-gray-500">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif font-bold text-lg text-gray-900">Password</h2>
                <button
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="text-sm text-[#CFAFA3] font-medium hover:underline"
                >
                  {showPasswordSection ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {showPasswordSection ? (
                <div className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 6 characters
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Keep your account secure by using a strong password that you don't use elsewhere.
                </p>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm">
              <h2 className="font-serif font-bold text-lg text-red-600 mb-4">Danger Zone</h2>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => {
                  toast({
                    title: 'Contact Support',
                    description: 'To delete your account, please contact support@skinaura.ai',
                  });
                }}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <NotificationPreferences />
        )}

        {/* Professional Notifications Tab */}
        {activeTab === 'professional-notifications' && isProfessional && (
          <ProfessionalNotificationPreferences />
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
