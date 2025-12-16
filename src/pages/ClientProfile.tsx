import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClientData } from '@/hooks/useClientData';
import { useClientRoutines } from '@/hooks/useClientRoutines';
import { useAppointments } from '@/hooks/useAppointments';
import { useProgressPhotos } from '@/hooks/useProgressPhotos';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Droplets,
  AlertCircle,
  Calendar,
  Clock,
  Camera,
  Edit,
  Save,
  X,
  ChevronRight,
  Loader2,
  Sparkles,
  Sun,
  Moon,
  Check,
  Flame,
  Trophy,
  Star,
  ArrowLeft,
  FileText,
  Heart,
  Target,
  Package
} from 'lucide-react';

// Skin type options
const SKIN_TYPES = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];

// Common skin concerns
const SKIN_CONCERNS = [
  'Acne',
  'Hyperpigmentation',
  'Dark Spots',
  'Fine Lines',
  'Wrinkles',
  'Dehydration',
  'Redness',
  'Sensitivity',
  'Uneven Texture',
  'Large Pores',
  'Dullness',
  'Scarring',
  'Melasma',
  'Sun Damage',
  'Oiliness'
];

const ClientProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const clientData = useClientData();
  const clientRoutines = useClientRoutines();
  const appointments = useAppointments();
  const progressPhotos = useProgressPhotos();
  const { toast } = useToast();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [skinType, setSkinType] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setSkinType(profile.skin_type || '');
      setConcerns(profile.concerns || []);
    }
  }, [profile]);

  // Redirect if not logged in or not a client
  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'client')) {
      navigate('/');
    }
  }, [user, profile, authLoading, navigate]);

  // Handle save profile
  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName,
      phone: phone || undefined,
      skin_type: skinType || undefined,
      concerns: concerns.length > 0 ? concerns : undefined,
    });
    setSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
      setIsEditing(false);
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

  // Get upcoming appointments
  const upcomingAppointments = appointments.getUpcomingAppointments(3);

  // Get recent photos
  const recentPhotos = progressPhotos.photos.slice(0, 4);

  // Loading state
  if (authLoading || clientData.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9F7F5] via-white to-[#F9F7F5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin mx-auto" />
          <p className="text-gray-500 mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Stats
  const stats = clientData.stats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F7F5] via-white to-[#F9F7F5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-[#CFAFA3] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#2D2A3E]" />
              </div>
              <span className="font-serif font-bold text-[#2D2A3E]">SkinAura PRO</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-[#2D2A3E]" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-white">
                <span className="text-xs font-bold text-white">{stats?.current_streak || 0}</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-1">
                {profile?.full_name || 'Welcome'}
              </h1>
              <p className="text-white/70 mb-3">{user?.email}</p>
              <div className="flex flex-wrap gap-2">
                {profile?.skin_type && (
                  <span className="px-3 py-1 bg-white/10 text-white text-sm rounded-full flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> {profile.skin_type} Skin
                  </span>
                )}
                <span className="px-3 py-1 bg-[#CFAFA3]/30 text-[#CFAFA3] text-sm rounded-full flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> {stats?.level || 'Bronze'} Level
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-xl font-bold">{stats?.current_streak || 0}</span>
              </div>
              <p className="text-xs text-white/60">Current Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xl font-bold">{stats?.longest_streak || 0}</span>
              </div>
              <p className="text-xs text-white/60">Best Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-[#CFAFA3] mb-1">
                <Star className="w-4 h-4" />
                <span className="text-xl font-bold">{stats?.points || 0}</span>
              </div>
              <p className="text-xs text-white/60">Total Points</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                <Check className="w-4 h-4" />
                <span className="text-xl font-bold">{stats?.total_routines_completed || 0}</span>
              </div>
              <p className="text-xs text-white/60">Routines Done</p>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
            <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">Edit Profile Information</h2>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  placeholder="Your full name"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Skin Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skin Type</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Skin Concerns</label>
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
                      {concern}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Skin Profile Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="w-5 h-5 text-[#CFAFA3]" />
            <h2 className="text-lg font-serif font-bold text-gray-900">Skin Profile</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Skin Type */}
            <div className="p-4 bg-gradient-to-br from-[#CFAFA3]/10 to-transparent rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Skin Type</p>
              <p className="text-lg font-medium text-gray-900">
                {profile?.skin_type || 'Not specified'}
              </p>
            </div>

            {/* Concerns */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-transparent rounded-xl">
              <p className="text-sm text-gray-500 mb-2">Skin Concerns</p>
              {profile?.concerns && profile.concerns.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {profile.concerns.map((concern, i) => (
                    <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {concern}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No concerns specified</p>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Routines Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#CFAFA3]" />
              <h2 className="text-lg font-serif font-bold text-gray-900">My Routines</h2>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-[#CFAFA3] hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {clientRoutines.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#CFAFA3] animate-spin" />
            </div>
          ) : clientRoutines.hasAssignedRoutine ? (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Morning Routine */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Morning Routine</h3>
                    <p className="text-xs text-gray-500">{clientRoutines.getMorningRoutine().length} steps</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {clientRoutines.getMorningRoutine().slice(0, 3).map((step) => (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 text-xs flex items-center justify-center font-medium">
                        {step.step}
                      </span>
                      <span className="text-gray-700 truncate">{step.product}</span>
                    </div>
                  ))}
                  {clientRoutines.getMorningRoutine().length > 3 && (
                    <p className="text-xs text-gray-400 pl-7">+{clientRoutines.getMorningRoutine().length - 3} more</p>
                  )}
                </div>
              </div>

              {/* Evening Routine */}
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Evening Routine</h3>
                    <p className="text-xs text-gray-500">{clientRoutines.getEveningRoutine().length} steps</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {clientRoutines.getEveningRoutine().slice(0, 3).map((step) => (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 text-xs flex items-center justify-center font-medium">
                        {step.step}
                      </span>
                      <span className="text-gray-700 truncate">{step.product}</span>
                    </div>
                  ))}
                  {clientRoutines.getEveningRoutine().length > 3 && (
                    <p className="text-xs text-gray-400 pl-7">+{clientRoutines.getEveningRoutine().length - 3} more</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No routines assigned yet</p>
              <p className="text-sm text-gray-400 mt-1">Your skincare professional will assign routines for you</p>
            </div>
          )}
        </div>

        {/* Upcoming Appointments Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#CFAFA3]" />
              <h2 className="text-lg font-serif font-bold text-gray-900">Upcoming Appointments</h2>
            </div>
          </div>

          {appointments.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#CFAFA3] animate-spin" />
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-[#CFAFA3]/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#CFAFA3]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{apt.title}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(apt.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No upcoming appointments</p>
              <p className="text-sm text-gray-400 mt-1">Book an appointment with your skincare professional</p>
            </div>
          )}
        </div>

        {/* Progress Photos Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#CFAFA3]" />
              <h2 className="text-lg font-serif font-bold text-gray-900">Progress Photos</h2>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-[#CFAFA3] hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {progressPhotos.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#CFAFA3] animate-spin" />
            </div>
          ) : recentPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recentPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={photo.photo_url}
                    alt={photo.title || 'Progress photo'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      photo.photo_type === 'before' ? 'bg-blue-500 text-white' :
                      photo.photo_type === 'after' ? 'bg-green-500 text-white' :
                      'bg-purple-500 text-white'
                    }`}>
                      {photo.photo_type.charAt(0).toUpperCase() + photo.photo_type.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Camera className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No progress photos yet</p>
              <p className="text-sm text-gray-400 mt-1">Start documenting your skincare journey</p>
            </div>
          )}
        </div>

        {/* Treatment History Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#CFAFA3]" />
              <h2 className="text-lg font-serif font-bold text-gray-900">Treatment History</h2>
            </div>
          </div>

          {/* Treatment history would come from a client-side hook - showing placeholder for now */}
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">Treatment history coming soon</p>
            <p className="text-sm text-gray-400 mt-1">Your professional treatments will be tracked here</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#2D2A3E]" />
              </div>
              <span className="font-serif font-bold text-gray-900">SkinAura PRO</span>
            </div>
            <p className="text-sm text-gray-400">© 2025 SkinAura AI. Skincare is Selfcare.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientProfile;
