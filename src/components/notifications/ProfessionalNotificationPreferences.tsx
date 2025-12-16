import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Bell,
  BellOff,
  Clock,
  Calendar,
  Flag,
  Target,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Save,
  Settings,
  ClipboardList,
  Users,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ProfessionalNotificationSettings {
  // Milestone notifications
  milestone_notifications_enabled: boolean;
  milestone_warning_days: number;
  milestone_overdue_notifications: boolean;
  
  // Appointment notifications
  appointment_notifications_enabled: boolean;
  appointment_overdue_notifications: boolean;
  appointment_reminder_hours: number;
  
  // Plan notifications
  plan_completion_notifications: boolean;
  plan_completion_threshold: number;
  plan_ending_notifications: boolean;
  plan_ending_warning_days: number;
  
  // Delivery preferences
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  
  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

const DEFAULT_SETTINGS: ProfessionalNotificationSettings = {
  milestone_notifications_enabled: true,
  milestone_warning_days: 3,
  milestone_overdue_notifications: true,
  
  appointment_notifications_enabled: true,
  appointment_overdue_notifications: true,
  appointment_reminder_hours: 24,
  
  plan_completion_notifications: true,
  plan_completion_threshold: 80,
  plan_ending_notifications: true,
  plan_ending_warning_days: 7,
  
  email_notifications: true,
  push_notifications: true,
  in_app_notifications: true,
  
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
};

interface ProfessionalNotificationPreferencesProps {
  onClose?: () => void;
}

const ProfessionalNotificationPreferences: React.FC<ProfessionalNotificationPreferencesProps> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ProfessionalNotificationSettings>(DEFAULT_SETTINGS);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['milestones', 'appointments', 'plans']));

  const isProfessional = profile?.role === 'professional';

  // Fetch settings on mount
  useEffect(() => {
    if (user && isProfessional) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [user, isProfessional]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          milestone_notifications_enabled: data.milestone_notifications_enabled ?? DEFAULT_SETTINGS.milestone_notifications_enabled,
          milestone_warning_days: data.milestone_warning_days ?? DEFAULT_SETTINGS.milestone_warning_days,
          milestone_overdue_notifications: data.milestone_overdue_notifications ?? DEFAULT_SETTINGS.milestone_overdue_notifications,
          appointment_notifications_enabled: data.appointment_notifications_enabled ?? DEFAULT_SETTINGS.appointment_notifications_enabled,
          appointment_overdue_notifications: data.appointment_overdue_notifications ?? DEFAULT_SETTINGS.appointment_overdue_notifications,
          appointment_reminder_hours: data.appointment_reminder_hours ?? DEFAULT_SETTINGS.appointment_reminder_hours,
          plan_completion_notifications: data.plan_completion_notifications ?? DEFAULT_SETTINGS.plan_completion_notifications,
          plan_completion_threshold: data.plan_completion_threshold ?? DEFAULT_SETTINGS.plan_completion_threshold,
          plan_ending_notifications: data.plan_ending_notifications ?? DEFAULT_SETTINGS.plan_ending_notifications,
          plan_ending_warning_days: data.plan_ending_warning_days ?? DEFAULT_SETTINGS.plan_ending_warning_days,
          email_notifications: data.email_notifications ?? DEFAULT_SETTINGS.email_notifications,
          push_notifications: data.push_notifications ?? DEFAULT_SETTINGS.push_notifications,
          in_app_notifications: data.in_app_notifications ?? DEFAULT_SETTINGS.in_app_notifications,
          quiet_hours_enabled: data.quiet_hours_enabled ?? DEFAULT_SETTINGS.quiet_hours_enabled,
          quiet_hours_start: data.quiet_hours_start ?? DEFAULT_SETTINGS.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end ?? DEFAULT_SETTINGS.quiet_hours_end,
        });
      }
    } catch (error) {
      console.error('Error fetching professional notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('professional_notification_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const updateSetting = <K extends keyof ProfessionalNotificationSettings>(
    key: K,
    value: ProfessionalNotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isProfessional) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Professional Access Required</h3>
        <p className="text-gray-500">These settings are only available for professional accounts.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
      </div>
    );
  }

  const renderToggle = (
    enabled: boolean,
    onChange: (value: boolean) => void,
    color: string = 'bg-[#CFAFA3]'
  ) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? color : 'bg-gray-200'
      }`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-0.5'
      }`} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Professional Notifications</h2>
          <p className="text-gray-500">Configure alerts for treatment plans, milestones, and appointments</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Milestone Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('milestones')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Flag className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-left">
              <h3 className="font-serif font-bold text-lg text-gray-900">Milestone Notifications</h3>
              <p className="text-sm text-gray-500">Alerts for upcoming and overdue milestones</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderToggle(
              settings.milestone_notifications_enabled,
              (v) => updateSetting('milestone_notifications_enabled', v),
              'bg-amber-500'
            )}
            {expandedSections.has('milestones') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.has('milestones') && settings.milestone_notifications_enabled && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
            {/* Warning Days */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Advance Warning</p>
                <p className="text-sm text-gray-500">Days before milestone to send alert</p>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5, 7].map(days => (
                  <button
                    key={days}
                    onClick={() => updateSetting('milestone_warning_days', days)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      settings.milestone_warning_days === days
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            {/* Overdue Notifications */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">Overdue Alerts</p>
                  <p className="text-sm text-gray-500">Notify when milestones are past due</p>
                </div>
              </div>
              {renderToggle(
                settings.milestone_overdue_notifications,
                (v) => updateSetting('milestone_overdue_notifications', v),
                'bg-red-500'
              )}
            </div>
          </div>
        )}
      </div>

      {/* Appointment Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('appointments')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-serif font-bold text-lg text-gray-900">Appointment Notifications</h3>
              <p className="text-sm text-gray-500">Reminders and overdue appointment alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderToggle(
              settings.appointment_notifications_enabled,
              (v) => updateSetting('appointment_notifications_enabled', v),
              'bg-blue-500'
            )}
            {expandedSections.has('appointments') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.has('appointments') && settings.appointment_notifications_enabled && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
            {/* Reminder Hours */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Reminder Time</p>
                <p className="text-sm text-gray-500">Hours before appointment to remind</p>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 4, 12, 24, 48].map(hours => (
                  <button
                    key={hours}
                    onClick={() => updateSetting('appointment_reminder_hours', hours)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      settings.appointment_reminder_hours === hours
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            {/* Overdue Notifications */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">Overdue Alerts</p>
                  <p className="text-sm text-gray-500">Notify when appointments are missed</p>
                </div>
              </div>
              {renderToggle(
                settings.appointment_overdue_notifications,
                (v) => updateSetting('appointment_overdue_notifications', v),
                'bg-red-500'
              )}
            </div>
          </div>
        )}
      </div>

      {/* Plan Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('plans')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-serif font-bold text-lg text-gray-900">Treatment Plan Notifications</h3>
              <p className="text-sm text-gray-500">Alerts for plan progress and deadlines</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {expandedSections.has('plans') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.has('plans') && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
            {/* Plan Completion */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Nearing Completion</p>
                  <p className="text-sm text-gray-500">Alert when plans reach threshold</p>
                </div>
              </div>
              {renderToggle(
                settings.plan_completion_notifications,
                (v) => updateSetting('plan_completion_notifications', v),
                'bg-green-500'
              )}
            </div>

            {settings.plan_completion_notifications && (
              <div className="flex items-center justify-between pl-4">
                <p className="text-sm text-gray-600">Completion threshold</p>
                <div className="flex items-center gap-2">
                  {[60, 70, 80, 90].map(pct => (
                    <button
                      key={pct}
                      onClick={() => updateSetting('plan_completion_threshold', pct)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        settings.plan_completion_threshold === pct
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Plan Ending */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Plan Ending Soon</p>
                  <p className="text-sm text-gray-500">Alert before plan end date</p>
                </div>
              </div>
              {renderToggle(
                settings.plan_ending_notifications,
                (v) => updateSetting('plan_ending_notifications', v),
                'bg-purple-500'
              )}
            </div>

            {settings.plan_ending_notifications && (
              <div className="flex items-center justify-between pl-4">
                <p className="text-sm text-gray-600">Warning days before end</p>
                <div className="flex items-center gap-2">
                  {[3, 5, 7, 14].map(days => (
                    <button
                      key={days}
                      onClick={() => updateSetting('plan_ending_warning_days', days)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        settings.plan_ending_warning_days === days
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delivery Preferences */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('delivery')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#CFAFA3]/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#CFAFA3]" />
            </div>
            <div className="text-left">
              <h3 className="font-serif font-bold text-lg text-gray-900">Delivery Preferences</h3>
              <p className="text-sm text-gray-500">How you want to receive notifications</p>
            </div>
          </div>
          {expandedSections.has('delivery') ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.has('delivery') && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-[#CFAFA3]" />
                <div>
                  <p className="font-medium text-gray-900">In-App Notifications</p>
                  <p className="text-sm text-gray-500">Show in notification center</p>
                </div>
              </div>
              {renderToggle(
                settings.in_app_notifications,
                (v) => updateSetting('in_app_notifications', v)
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[#CFAFA3]" />
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Browser push alerts</p>
                </div>
              </div>
              {renderToggle(
                settings.push_notifications,
                (v) => updateSetting('push_notifications', v)
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-[#CFAFA3]" />
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Daily digest of important alerts</p>
                </div>
              </div>
              {renderToggle(
                settings.email_notifications,
                (v) => updateSetting('email_notifications', v)
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('quiet')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <BellOff className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-left">
              <h3 className="font-serif font-bold text-lg text-gray-900">Quiet Hours</h3>
              <p className="text-sm text-gray-500">Pause notifications during specific times</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderToggle(
              settings.quiet_hours_enabled,
              (v) => updateSetting('quiet_hours_enabled', v),
              'bg-indigo-500'
            )}
            {expandedSections.has('quiet') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.has('quiet') && settings.quiet_hours_enabled && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Notifications will be queued and delivered after quiet hours end
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Preferences
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-2xl p-6 border border-[#CFAFA3]/20">
        <h3 className="font-serif font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#CFAFA3]" />
          Stay on Top of Client Progress
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-[#CFAFA3] mt-0.5 flex-shrink-0" />
            Get notified before milestones are due to prepare follow-ups
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-[#CFAFA3] mt-0.5 flex-shrink-0" />
            Never miss an overdue appointment with automatic alerts
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-[#CFAFA3] mt-0.5 flex-shrink-0" />
            Track plan completion to schedule follow-up consultations
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-[#CFAFA3] mt-0.5 flex-shrink-0" />
            Use quiet hours to maintain work-life balance
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProfessionalNotificationPreferences;
