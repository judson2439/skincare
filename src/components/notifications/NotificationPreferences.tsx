import React, { useState, useEffect } from 'react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useTwilioSMS } from '@/hooks/useTwilioSMS';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  BellOff,
  Smartphone,
  Clock,
  Flame,
  Sun,
  Moon,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Send,
  Settings,
  Globe,
  MessageSquare,
  Volume2,
  VolumeX,
  ChevronRight,
  Shield,
  Zap,
  Heart,
  Package,
  Trophy,
  Calendar,
  Sparkles,
  Phone,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface NotificationPreferencesProps {
  onClose?: () => void;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (AZ)' },
  { value: 'America/Anchorage', label: 'Alaska (AK)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HI)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const TIME_OPTIONS = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
];

const formatTime = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ onClose }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const {
    loading,
    saving,
    preferences,
    pushSupported,
    pushPermission,
    serviceWorkerReady,
    updatePreferences,
    requestPushPermission,
    disablePushNotifications,
    sendTestNotification,
  } = useNotificationPreferences();

  const {
    sending: sendingSMS,
    verifying: verifyingSMS,
    sendTestSMS,
    optInToSMS,
    optOutOfSMS,
    validatePhoneNumber,
    formatPhoneForDisplay,
  } = useTwilioSMS();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{ valid: boolean; error?: string } | null>(null);
  const [testSMSSent, setTestSMSSent] = useState(false);
  const [showSMSOptInModal, setShowSMSOptInModal] = useState(false);

  // Initialize phone number from preferences
  useEffect(() => {
    if (preferences?.phone_number) {
      setPhoneNumber(preferences.phone_number);
    }
  }, [preferences?.phone_number]);

  // Validate phone number on change
  useEffect(() => {
    if (phoneNumber.trim()) {
      const validation = validatePhoneNumber(phoneNumber);
      setPhoneValidation(validation);
    } else {
      setPhoneValidation(null);
    }
  }, [phoneNumber, validatePhoneNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-gray-600">Unable to load notification preferences</p>
      </div>
    );
  }

  const handleTogglePush = async () => {
    if (preferences.push_enabled) {
      const result = await disablePushNotifications();
      if (result.success) {
        toast({ title: 'Push Notifications Disabled', description: 'You will no longer receive browser notifications' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } else {
      const result = await requestPushPermission();
      if (result.success) {
        toast({ title: 'Push Notifications Enabled', description: 'You will now receive browser notifications' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    }
  };

  const handleToggleSMS = async () => {
    if (preferences.sms_enabled) {
      // Opt out
      const result = await optOutOfSMS();
      if (result.success) {
        toast({ title: 'SMS Reminders Disabled', description: 'You will no longer receive text message reminders' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } else {
      // Show opt-in modal if no phone number
      if (!preferences.phone_number) {
        setShowSMSOptInModal(true);
      } else {
        // Re-enable with existing phone
        const result = await updatePreferences({ sms_enabled: true });
        if (result.success) {
          toast({ title: 'SMS Reminders Enabled', description: `Reminders will be sent to ${formatPhoneForDisplay(preferences.phone_number)}` });
        }
      }
    }
  };

  const handleSMSOptIn = async () => {
    if (!phoneNumber.trim()) {
      toast({ title: 'Error', description: 'Please enter a phone number', variant: 'destructive' });
      return;
    }

    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      toast({ title: 'Error', description: validation.error || 'Invalid phone number', variant: 'destructive' });
      return;
    }

    const result = await optInToSMS(validation.formatted);
    if (result.success) {
      toast({ 
        title: 'SMS Opt-In Successful!', 
        description: 'You will now receive skincare routine reminders via text message.' 
      });
      setShowSMSOptInModal(false);
      setShowPhoneInput(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleTestSMS = async () => {
    const phoneToTest = phoneNumber || preferences.phone_number;
    if (!phoneToTest) {
      toast({ title: 'Error', description: 'Please enter a phone number first', variant: 'destructive' });
      return;
    }

    const validation = validatePhoneNumber(phoneToTest);
    if (!validation.valid) {
      toast({ title: 'Error', description: validation.error || 'Invalid phone number', variant: 'destructive' });
      return;
    }

    const result = await sendTestSMS(validation.formatted);
    if (result.success) {
      setTestSMSSent(true);
      toast({ 
        title: 'Test SMS Sent!', 
        description: `Check your phone (${formatPhoneForDisplay(validation.formatted)}) for the test message.` 
      });
      // Reset after 5 seconds
      setTimeout(() => setTestSMSSent(false), 5000);
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to send test SMS', variant: 'destructive' });
    }
  };

  const handleUpdatePhone = async () => {
    if (!phoneNumber.trim()) {
      toast({ title: 'Error', description: 'Please enter a phone number', variant: 'destructive' });
      return;
    }

    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      toast({ title: 'Error', description: validation.error || 'Invalid phone number', variant: 'destructive' });
      return;
    }
    
    const result = await updatePreferences({ 
      phone_number: validation.formatted,
    });
    
    if (result.success) {
      toast({ title: 'Phone Number Updated', description: 'Your phone number has been saved' });
      setShowPhoneInput(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleTimeChange = async (field: 'am_reminder_time' | 'pm_reminder_time', value: string) => {
    const result = await updatePreferences({ [field]: value + ':00' });
    if (result.success) {
      toast({ title: 'Reminder Time Updated' });
    }
  };

  const handleToggleReminder = async (field: 'am_reminder_enabled' | 'pm_reminder_enabled' | 'streak_warning_enabled' | 'feedback_notifications_enabled' | 'product_recommendations_enabled' | 'challenge_notifications_enabled' | 'appointment_reminders_enabled') => {
    const result = await updatePreferences({ [field]: !preferences[field] });
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleTimezoneChange = async (timezone: string) => {
    const result = await updatePreferences({ timezone });
    if (result.success) {
      toast({ title: 'Timezone Updated' });
    }
  };

  const handleStreakWarningHoursChange = async (hours: number) => {
    const result = await updatePreferences({ streak_warning_hours: hours });
    if (result.success) {
      toast({ title: 'Streak Warning Time Updated' });
    }
  };

  const handleTestNotification = () => {
    sendTestNotification(
      'Test Notification',
      'Your notifications are working! Keep up your skincare routine.'
    );
    toast({ title: 'Test Notification Sent', description: 'Check your browser notifications' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Notification Settings</h2>
          <p className="text-gray-500">Customize your routine reminders and alerts</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Notification Methods */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#CFAFA3]" />
          Notification Methods
        </h3>

        {/* Browser Push Notifications */}
        <div className="border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                preferences.push_enabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {preferences.push_enabled ? (
                  <Volume2 className="w-5 h-5 text-green-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Browser Push Notifications</p>
                <p className="text-sm text-gray-500">
                  {!pushSupported 
                    ? 'Not supported in this browser' 
                    : pushPermission === 'denied'
                    ? 'Permission denied - enable in browser settings'
                    : serviceWorkerReady
                    ? 'Get instant notifications in your browser'
                    : 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {preferences.push_enabled && (
                <button
                  onClick={handleTestNotification}
                  className="px-3 py-1.5 text-sm text-[#CFAFA3] hover:bg-[#CFAFA3]/10 rounded-lg transition-colors"
                >
                  Test
                </button>
              )}
              <button
                onClick={handleTogglePush}
                disabled={!pushSupported || pushPermission === 'denied' || saving}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  preferences.push_enabled ? 'bg-[#CFAFA3]' : 'bg-gray-200'
                } ${(!pushSupported || pushPermission === 'denied') ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  preferences.push_enabled ? 'translate-x-8' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* SMS Notifications with Opt-In */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                preferences.sms_enabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Smartphone className={`w-5 h-5 ${preferences.sms_enabled ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">SMS Reminders (Twilio)</p>
                <p className="text-sm text-gray-500">
                  {preferences.sms_enabled && preferences.phone_number
                    ? `Sending to ${formatPhoneForDisplay(preferences.phone_number)}`
                    : 'Opt-in to receive text message reminders'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {preferences.sms_enabled && preferences.phone_number && (
                <button
                  onClick={handleTestSMS}
                  disabled={sendingSMS}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                    testSMSSent 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-[#CFAFA3] hover:bg-[#CFAFA3]/10'
                  }`}
                >
                  {sendingSMS ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : testSMSSent ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> Sent!
                    </>
                  ) : (
                    'Test SMS'
                  )}
                </button>
              )}
              <button
                onClick={handleToggleSMS}
                disabled={saving || verifyingSMS}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  preferences.sms_enabled ? 'bg-[#CFAFA3]' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  preferences.sms_enabled ? 'translate-x-8' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* SMS Status & Phone Management */}
          {preferences.sms_enabled && preferences.phone_number && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">SMS Notifications Active</p>
                  <p className="text-sm text-green-700 mt-1">
                    You're opted in to receive skincare routine reminders via text message.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {formatPhoneForDisplay(preferences.phone_number)}
                    </span>
                    <button
                      onClick={() => setShowPhoneInput(true)}
                      className="text-sm text-green-600 hover:text-green-700 underline ml-2"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phone Number Update Form */}
          {showPhoneInput && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Phone Number</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none ${
                      phoneValidation?.valid === false ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {phoneValidation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {phoneValidation.valid ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleUpdatePhone}
                  disabled={saving || !phoneValidation?.valid}
                  className="px-4 py-2 bg-[#CFAFA3] text-white rounded-xl font-medium hover:bg-[#B89A8E] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowPhoneInput(false);
                    setPhoneNumber(preferences.phone_number || '');
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {phoneValidation?.error && (
                <p className="text-sm text-red-600 mt-2">{phoneValidation.error}</p>
              )}
            </div>
          )}

          {/* SMS Info Box */}
          {!preferences.sms_enabled && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">About SMS Reminders</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Receive text message reminders for your morning and evening skincare routines. 
                    Standard messaging rates may apply. You can opt out at any time.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reminder Schedule */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#CFAFA3]" />
          Routine Reminders
        </h3>

        {/* Timezone */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Globe className="w-4 h-4" />
            Your Timezone
          </label>
          <select
            value={preferences.timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>

        {/* Morning Reminder */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Morning Routine</p>
              <p className="text-sm text-gray-500">AM skincare reminder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={preferences.am_reminder_time?.slice(0, 5) || '07:00'}
              onChange={(e) => handleTimeChange('am_reminder_time', e.target.value)}
              disabled={!preferences.am_reminder_enabled}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none disabled:opacity-50"
            >
              {TIME_OPTIONS.filter(t => parseInt(t.split(':')[0]) < 12).map((time) => (
                <option key={time} value={time}>{formatTime(time)}</option>
              ))}
            </select>
            <button
              onClick={() => handleToggleReminder('am_reminder_enabled')}
              disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.am_reminder_enabled ? 'bg-amber-500' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                preferences.am_reminder_enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Evening Reminder */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Evening Routine</p>
              <p className="text-sm text-gray-500">PM skincare reminder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={preferences.pm_reminder_time?.slice(0, 5) || '19:00'}
              onChange={(e) => handleTimeChange('pm_reminder_time', e.target.value)}
              disabled={!preferences.pm_reminder_enabled}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none disabled:opacity-50"
            >
              {TIME_OPTIONS.filter(t => parseInt(t.split(':')[0]) >= 12).map((time) => (
                <option key={time} value={time}>{formatTime(time)}</option>
              ))}
            </select>
            <button
              onClick={() => handleToggleReminder('pm_reminder_enabled')}
              disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.pm_reminder_enabled ? 'bg-indigo-500' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                preferences.pm_reminder_enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Streak Protection */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Streak Protection
        </h3>

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Streak at Risk Alerts</p>
              <p className="text-sm text-gray-500">Get notified before you lose your streak</p>
            </div>
          </div>
          <button
            onClick={() => handleToggleReminder('streak_warning_enabled')}
            disabled={saving}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              preferences.streak_warning_enabled ? 'bg-orange-500' : 'bg-gray-200'
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              preferences.streak_warning_enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {preferences.streak_warning_enabled && (
          <div className="p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warn me this many hours before midnight:
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((hours) => (
                <button
                  key={hours}
                  onClick={() => handleStreakWarningHoursChange(hours)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    preferences.streak_warning_hours === hours
                      ? 'bg-orange-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  {hours} hour{hours > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              If you haven't completed your routine by {24 - preferences.streak_warning_hours}:00, you'll get a warning notification.
            </p>
          </div>
        )}
      </div>

      {/* Other Notification Types */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-serif font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#CFAFA3]" />
          Other Notifications
        </h3>

        <div className="space-y-4">
          {/* Feedback Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Professional Feedback</p>
                <p className="text-sm text-gray-500">When your professional leaves feedback on photos</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleReminder('feedback_notifications_enabled')}
              disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.feedback_notifications_enabled ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                preferences.feedback_notifications_enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Product Recommendations */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Product Recommendations</p>
                <p className="text-sm text-gray-500">When you receive new product recommendations</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleReminder('product_recommendations_enabled')}
              disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.product_recommendations_enabled ? 'bg-pink-500' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                preferences.product_recommendations_enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Challenge Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Challenge Updates</p>
                <p className="text-sm text-gray-500">Challenge progress and achievements</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleReminder('challenge_notifications_enabled')}
              disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.challenge_notifications_enabled ? 'bg-purple-500' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                preferences.challenge_notifications_enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Appointment Reminders */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Appointment Reminders</p>
                <p className="text-sm text-gray-500">Upcoming appointment notifications</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleReminder('appointment_reminders_enabled')}
              disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.appointment_reminders_enabled ? 'bg-teal-500' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                preferences.appointment_reminders_enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-2xl p-6 border border-[#CFAFA3]/20">
        <h3 className="font-serif font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#CFAFA3]" />
          Tips for Success
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#CFAFA3]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-[#CFAFA3]" />
            </div>
            <p className="text-sm text-gray-600">Set your AM reminder for when you typically wake up and start your day</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#CFAFA3]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-[#CFAFA3]" />
            </div>
            <p className="text-sm text-gray-600">Set your PM reminder for about 30 minutes before your usual bedtime</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#CFAFA3]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-[#CFAFA3]" />
            </div>
            <p className="text-sm text-gray-600">Enable streak warnings to protect your hard-earned progress</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#CFAFA3]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-[#CFAFA3]" />
            </div>
            <p className="text-sm text-gray-600">Enable SMS reminders for reliable text message alerts even when offline</p>
          </li>
        </ul>
      </div>

      {/* SMS Opt-In Modal */}
      {showSMSOptInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Opt-In to SMS Reminders</h3>
              <button 
                onClick={() => setShowSMSOptInModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-[#CFAFA3]" />
              </div>
              <p className="text-center text-gray-600 text-sm">
                Enter your phone number to receive skincare routine reminders via text message. 
                Standard messaging rates may apply.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none ${
                    phoneValidation?.valid === false ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {phoneValidation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {phoneValidation.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {phoneValidation?.error && (
                <p className="text-sm text-red-600 mt-2">{phoneValidation.error}</p>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded-xl mb-6">
              <p className="text-xs text-gray-500">
                By opting in, you agree to receive automated skincare routine reminders from SkinAura PRO. 
                Message frequency varies. Reply STOP to unsubscribe at any time.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSMSOptInModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSMSOptIn}
                disabled={verifyingSMS || !phoneValidation?.valid}
                className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyingSMS ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Opt-In to SMS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPreferences;
