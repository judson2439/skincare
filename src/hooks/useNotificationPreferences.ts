import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  push_subscription: any;
  sms_enabled: boolean;
  phone_number: string | null;
  am_reminder_time: string;
  pm_reminder_time: string;
  timezone: string;
  am_reminder_enabled: boolean;
  pm_reminder_enabled: boolean;
  streak_warning_enabled: boolean;
  streak_warning_hours: number;
  // New notification types
  feedback_notifications_enabled: boolean;
  product_recommendations_enabled: boolean;
  challenge_notifications_enabled: boolean;
  appointment_reminders_enabled: boolean;
  // SMS opt-in tracking
  sms_opted_in_at: string | null;
  sms_opted_out_at: string | null;
  // Tracking
  last_am_reminder_sent: string | null;
  last_pm_reminder_sent: string | null;
  last_streak_warning_sent: string | null;
  created_at: string;
  updated_at: string;
}


const DEFAULT_PREFERENCES: Partial<NotificationPreferences> = {
  push_enabled: false,
  push_subscription: null,
  sms_enabled: false,
  phone_number: null,
  am_reminder_time: '07:00:00',
  pm_reminder_time: '19:00:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
  am_reminder_enabled: true,
  pm_reminder_enabled: true,
  streak_warning_enabled: true,
  streak_warning_hours: 2,
  feedback_notifications_enabled: true,
  product_recommendations_enabled: true,
  challenge_notifications_enabled: true,
  appointment_reminders_enabled: true,
};

// VAPID public key for web push
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  // Check if push notifications are supported and register service worker
  useEffect(() => {
    const initializePushSupport = async () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
      setPushSupported(supported);
      
      if (supported) {
        setPushPermission(Notification.permission);
        
        // Register service worker
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration.scope);
          
          // Wait for the service worker to be ready
          await navigator.serviceWorker.ready;
          setServiceWorkerReady(true);
          
          // Check for existing subscription
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            console.log('Existing push subscription found');
          }
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };
    
    initializePushSupport();
  }, []);

  // Fetch user's notification preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Create default preferences for new users
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            ...DEFAULT_PREFERENCES,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs as NotificationPreferences);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  }, [user]);

  // Update preferences
  const updatePreferences = async (updates: Partial<NotificationPreferences>): Promise<{ success: boolean; error?: string }> => {
    if (!user || !preferences) {
      return { success: false, error: 'No user or preferences found' };
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  // Save push subscription to database
  const savePushSubscription = async (subscription: PushSubscription): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user found' };
    }

    try {
      const subscriptionJson = subscription.toJSON();
      
      // Save to push_subscriptions table
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys?.p256dh || '',
          auth: subscriptionJson.keys?.auth || '',
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) throw error;

      // Also update notification_preferences
      await updatePreferences({
        push_enabled: true,
        push_subscription: subscriptionJson,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error saving push subscription:', error);
      return { success: false, error: error.message };
    }
  };

  // Request push notification permission
  const requestPushPermission = async (): Promise<{ success: boolean; error?: string }> => {
    if (!pushSupported) {
      return { success: false, error: 'Push notifications are not supported in this browser' };
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Save subscription to database
        const result = await savePushSubscription(subscription);
        if (!result.success) {
          throw new Error(result.error);
        }

        return { success: true };
      } else if (permission === 'denied') {
        return { success: false, error: 'Push notification permission was denied. Please enable it in your browser settings.' };
      } else {
        return { success: false, error: 'Push notification permission was dismissed' };
      }
    } catch (error: any) {
      console.error('Error requesting push permission:', error);
      return { success: false, error: error.message };
    }
  };

  // Disable push notifications
  const disablePushNotifications = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user found' };
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          
          // Remove from database
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
      }

      await updatePreferences({
        push_enabled: false,
        push_subscription: null,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error disabling push notifications:', error);
      return { success: false, error: error.message };
    }
  };

  // Send a test browser notification
  const sendTestNotification = (title: string, body: string) => {
    if (pushPermission === 'granted') {
      // Try using service worker first
      if (serviceWorkerReady && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'TEST_NOTIFICATION',
          title,
          body,
        });
      } else {
        // Fallback to direct notification
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification',
          requireInteraction: false,
        });
      }
    }
  };

  // Show streak at risk warning notification
  const showStreakWarning = (currentStreak: number) => {
    if (pushPermission === 'granted' && preferences?.streak_warning_enabled) {
      const title = 'Streak at Risk!';
      const body = `Don't lose your ${currentStreak} day streak! Complete your routine now.`;
      
      if (serviceWorkerReady && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'TEST_NOTIFICATION',
          title,
          body,
        });
      } else {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'streak-warning',
          requireInteraction: true,
        });
      }
    }
  };

  // Show routine reminder notification
  const showRoutineReminder = (routineType: 'morning' | 'evening') => {
    if (pushPermission === 'granted') {
      const isAM = routineType === 'morning';
      const title = isAM ? 'Good Morning!' : 'Good Evening!';
      const body = `Time for your ${routineType} skincare routine. Your skin will thank you!`;
      
      if (serviceWorkerReady && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'TEST_NOTIFICATION',
          title,
          body,
        });
      } else {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `${routineType}-reminder`,
          requireInteraction: false,
        });
      }
    }
  };

  // Show feedback notification
  const showFeedbackNotification = (professionalName: string) => {
    if (pushPermission === 'granted' && preferences?.feedback_notifications_enabled) {
      const title = 'New Feedback from Your Professional';
      const body = `${professionalName} has left feedback on your progress photo.`;
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'feedback-notification',
        requireInteraction: false,
      });
    }
  };

  // Show product recommendation notification
  const showProductRecommendation = (productName: string, professionalName: string) => {
    if (pushPermission === 'granted' && preferences?.product_recommendations_enabled) {
      const title = 'New Product Recommendation';
      const body = `${professionalName} recommends ${productName} for your routine.`;
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'product-recommendation',
        requireInteraction: false,
      });
    }
  };

  // Check if it's time to send a reminder
  const checkReminderTime = useCallback(() => {
    if (!preferences) return null;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const amTime = preferences.am_reminder_time?.slice(0, 5);
    const pmTime = preferences.pm_reminder_time?.slice(0, 5);

    if (preferences.am_reminder_enabled && currentTime === amTime) {
      return 'morning';
    }
    
    if (preferences.pm_reminder_enabled && currentTime === pmTime) {
      return 'evening';
    }

    return null;
  }, [preferences]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await fetchPreferences();
      setLoading(false);
    };

    loadData();
  }, [user, fetchPreferences]);

  // Set up reminder check interval (client-side backup)
  useEffect(() => {
    if (!preferences || pushPermission !== 'granted') return;

    const checkReminders = () => {
      const reminderType = checkReminderTime();
      if (reminderType) {
        showRoutineReminder(reminderType);
      }
    };

    // Check every minute
    const interval = setInterval(checkReminders, 60000);
    
    return () => clearInterval(interval);
  }, [preferences, pushPermission, checkReminderTime]);

  return {
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
    showStreakWarning,
    showRoutineReminder,
    showFeedbackNotification,
    showProductRecommendation,
    refreshPreferences: fetchPreferences,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
