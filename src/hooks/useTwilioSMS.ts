import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSOptInStatus {
  isOptedIn: boolean;
  phoneNumber: string | null;
  verifiedAt: string | null;
}

export function useTwilioSMS() {
  const { user, profile } = useAuth();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Send a test SMS to verify the phone number works
  const sendTestSMS = useCallback(async (phoneNumber: string): Promise<SMSResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('twilio-sms', {
        body: {
          action: 'send_test',
          to: phoneNumber,
          userId: user.id,
          userName: profile?.full_name || 'SkinAura User',
        },
      });

      if (error) throw error;

      if (data?.success) {
        return { success: true, messageId: data.messageId };
      } else {
        return { success: false, error: data?.error || 'Failed to send test SMS' };
      }
    } catch (error: any) {
      console.error('Error sending test SMS:', error);
      return { success: false, error: error.message || 'Failed to send test SMS' };
    } finally {
      setSending(false);
    }
  }, [user, profile]);

  // Send a routine reminder SMS
  const sendRoutineReminder = useCallback(async (
    phoneNumber: string,
    clientName: string,
    routineType: 'morning' | 'evening',
    customMessage?: string
  ): Promise<SMSResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('twilio-sms', {
        body: {
          action: 'send_reminder',
          to: phoneNumber,
          clientName,
          routineType,
          professionalName: profile?.full_name || 'Your Skincare Professional',
          customMessage,
        },
      });

      if (error) throw error;

      if (data?.success) {
        return { success: true, messageId: data.messageId };
      } else {
        return { success: false, error: data?.error || 'Failed to send reminder' };
      }
    } catch (error: any) {
      console.error('Error sending routine reminder:', error);
      return { success: false, error: error.message || 'Failed to send reminder' };
    } finally {
      setSending(false);
    }
  }, [user, profile]);

  // Send a custom SMS message
  const sendCustomSMS = useCallback(async (
    phoneNumber: string,
    message: string,
    recipientName?: string
  ): Promise<SMSResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('twilio-sms', {
        body: {
          action: 'send_custom',
          to: phoneNumber,
          message,
          recipientName,
          senderName: profile?.full_name || 'SkinAura PRO',
        },
      });

      if (error) throw error;

      if (data?.success) {
        return { success: true, messageId: data.messageId };
      } else {
        return { success: false, error: data?.error || 'Failed to send message' };
      }
    } catch (error: any) {
      console.error('Error sending custom SMS:', error);
      return { success: false, error: error.message || 'Failed to send message' };
    } finally {
      setSending(false);
    }
  }, [user, profile]);

  // Opt-in to SMS notifications (for clients)
  const optInToSMS = useCallback(async (phoneNumber: string): Promise<SMSResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setVerifying(true);
    try {
      // First, update the user's phone number in their profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          phone: phoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update notification preferences to enable SMS
      const { error: prefsError } = await supabase
        .from('notification_preferences')
        .update({
          sms_enabled: true,
          phone_number: phoneNumber,
          sms_opted_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (prefsError) throw prefsError;

      // Send a confirmation SMS
      const { data, error } = await supabase.functions.invoke('twilio-sms', {
        body: {
          action: 'send_opt_in_confirmation',
          to: phoneNumber,
          userName: profile?.full_name || 'there',
        },
      });

      if (error) {
        console.warn('Failed to send opt-in confirmation SMS:', error);
        // Don't fail the whole operation if confirmation SMS fails
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error opting in to SMS:', error);
      return { success: false, error: error.message || 'Failed to opt in to SMS' };
    } finally {
      setVerifying(false);
    }
  }, [user, profile]);

  // Opt-out of SMS notifications
  const optOutOfSMS = useCallback(async (): Promise<SMSResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setVerifying(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          sms_enabled: false,
          sms_opted_out_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error opting out of SMS:', error);
      return { success: false, error: error.message || 'Failed to opt out of SMS' };
    } finally {
      setVerifying(false);
    }
  }, [user]);

  // Validate phone number format
  const validatePhoneNumber = (phone: string): { valid: boolean; formatted: string; error?: string } => {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, assume US number and add +1
    if (!cleaned.startsWith('+')) {
      // Remove leading 1 if present
      if (cleaned.startsWith('1') && cleaned.length === 11) {
        cleaned = '+' + cleaned;
      } else if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }

    // Basic validation
    if (cleaned.length < 10) {
      return { valid: false, formatted: cleaned, error: 'Phone number is too short' };
    }

    if (cleaned.length > 15) {
      return { valid: false, formatted: cleaned, error: 'Phone number is too long' };
    }

    // E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(cleaned)) {
      return { valid: false, formatted: cleaned, error: 'Invalid phone number format' };
    }

    return { valid: true, formatted: cleaned };
  };

  // Format phone number for display
  const formatPhoneForDisplay = (phone: string): string => {
    const cleaned = phone.replace(/[^\d]/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  };

  return {
    sending,
    verifying,
    sendTestSMS,
    sendRoutineReminder,
    sendCustomSMS,
    optInToSMS,
    optOutOfSMS,
    validatePhoneNumber,
    formatPhoneForDisplay,
  };
}
