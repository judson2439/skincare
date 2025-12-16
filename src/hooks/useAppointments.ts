import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface AppointmentType {
  id: string;
  professional_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  is_virtual: boolean;
  is_active: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  professional_id: string;
  client_id: string | null;
  appointment_type_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_virtual: boolean;
  meeting_link: string | null;
  location: string | null;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  notes: string | null;
  reminder_sent: boolean;
  square_booking_id: string | null;
  created_at: string;
  updated_at: string;
  appointment_type?: AppointmentType;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export interface BlockedTime {
  id: string;
  professional_id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export function useAppointments() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);

  const isProfessional = profile?.role === 'professional';

  // ============ APPOINTMENT TYPES ============
  const fetchAppointmentTypes = useCallback(async (professionalId?: string) => {
    const targetId = professionalId || (isProfessional ? user?.id : null);
    if (!targetId) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'get_appointment_types', professional_id: targetId }
      });

      if (error) throw error;
      if (data.success) {
        setAppointmentTypes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching appointment types:', error);
    }
  }, [user?.id, isProfessional]);

  const createAppointmentType = async (
    name: string,
    duration_minutes: number,
    options?: {
      description?: string;
      price?: number;
      is_virtual?: boolean;
      color?: string;
    }
  ): Promise<{ success: boolean; error?: string; data?: AppointmentType }> => {
    if (!user?.id || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: {
          action: 'create_appointment_type',
          professional_id: user.id,
          name,
          duration_minutes,
          ...options
        }
      });

      if (error) throw error;
      if (data.success) {
        setAppointmentTypes(prev => [...prev, data.data]);
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateAppointmentType = async (
    id: string,
    updates: Partial<AppointmentType>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'update_appointment_type', id, ...updates }
      });

      if (error) throw error;
      if (data.success) {
        setAppointmentTypes(prev => prev.map(t => t.id === id ? data.data : t));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteAppointmentType = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'delete_appointment_type', id }
      });

      if (error) throw error;
      if (data.success) {
        setAppointmentTypes(prev => prev.filter(t => t.id !== id));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ============ AVAILABILITY ============
  const fetchAvailability = useCallback(async (professionalId?: string) => {
    const targetId = professionalId || (isProfessional ? user?.id : null);
    if (!targetId) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'get_availability', professional_id: targetId }
      });

      if (error) throw error;
      if (data.success) {
        setAvailability(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  }, [user?.id, isProfessional]);

  const setAvailabilitySlots = async (
    slots: { day_of_week: number; start_time: string; end_time: string }[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: {
          action: 'set_availability',
          professional_id: user.id,
          slots
        }
      });

      if (error) throw error;
      if (data.success) {
        await fetchAvailability();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const getAvailableSlots = async (
    professionalId: string,
    date: string,
    durationMinutes?: number
  ): Promise<TimeSlot[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: {
          action: 'get_available_slots',
          professional_id: professionalId,
          date,
          duration_minutes: durationMinutes
        }
      });

      if (error) throw error;
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  };

  // ============ APPOINTMENTS ============
  const fetchAppointments = useCallback(async (options?: {
    professionalId?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: {
          action: 'get_appointments',
          professional_id: options?.professionalId || (isProfessional ? user?.id : undefined),
          client_id: options?.clientId || (!isProfessional ? user?.id : undefined),
          start_date: options?.startDate,
          end_date: options?.endDate,
          status: options?.status
        }
      });

      if (error) throw error;
      if (data.success) {
        setAppointments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isProfessional]);

  const createAppointment = async (
    professionalId: string,
    appointmentTypeId: string | null,
    startTime: string,
    endTime: string,
    options?: {
      title?: string;
      description?: string;
      is_virtual?: boolean;
      meeting_link?: string;
      location?: string;
      client_name?: string;
      client_email?: string;
      client_phone?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; error?: string; data?: Appointment }> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: {
          action: 'create_appointment',
          professional_id: professionalId,
          client_id: user?.id,
          appointment_type_id: appointmentTypeId,
          start_time: startTime,
          end_time: endTime,
          title: options?.title || 'Consultation',
          ...options
        }
      });

      if (error) throw error;
      if (data.success) {
        setAppointments(prev => [...prev, data.data]);
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateAppointment = async (
    id: string,
    updates: Partial<Appointment>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'update_appointment', id, ...updates }
      });

      if (error) throw error;
      if (data.success) {
        setAppointments(prev => prev.map(a => a.id === id ? data.data : a));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const cancelAppointment = async (
    id: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'cancel_appointment', id, reason }
      });

      if (error) throw error;
      if (data.success) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const confirmAppointment = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'confirm_appointment', id }
      });

      if (error) throw error;
      if (data.success) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const completeAppointment = async (
    id: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'complete_appointment', id, notes }
      });

      if (error) throw error;
      if (data.success) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ============ BLOCKED TIME ============
  const fetchBlockedTimes = useCallback(async (startDate?: string, endDate?: string) => {
    if (!user?.id || !isProfessional) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: {
          action: 'get_blocked_times',
          professional_id: user.id,
          start_date: startDate,
          end_date: endDate
        }
      });

      if (error) throw error;
      if (data.success) {
        setBlockedTimes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching blocked times:', error);
    }
  }, [user?.id, isProfessional]);

  const blockTime = async (
    startTime: string,
    endTime: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !isProfessional) {
      return { success: false, error: 'Not authorized' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: {
          action: 'block_time',
          professional_id: user.id,
          start_time: startTime,
          end_time: endTime,
          reason
        }
      });

      if (error) throw error;
      if (data.success) {
        setBlockedTimes(prev => [...prev, data.data]);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const unblockTime = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-appointments', {
        body: { action: 'unblock_time', id }
      });

      if (error) throw error;
      if (data.success) {
        setBlockedTimes(prev => prev.filter(b => b.id !== id));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ============ HELPER FUNCTIONS ============
  const getAppointmentsByDate = (date: Date): Appointment[] => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(a => a.start_time.startsWith(dateStr));
  };

  const getUpcomingAppointments = (limit?: number): Appointment[] => {
    const now = new Date().toISOString();
    const upcoming = appointments
      .filter(a => a.start_time > now && a.status !== 'cancelled')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    return limit ? upcoming.slice(0, limit) : upcoming;
  };

  const getTodaysAppointments = (): Appointment[] => {
    return getAppointmentsByDate(new Date());
  };

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
      if (isProfessional) {
        fetchAppointmentTypes();
        fetchAvailability();
        fetchBlockedTimes();
      }
    }
  }, [user?.id, isProfessional, fetchAppointments, fetchAppointmentTypes, fetchAvailability, fetchBlockedTimes]);

  return {
    loading,
    appointmentTypes,
    availability,
    appointments,
    blockedTimes,
    // Appointment Types
    fetchAppointmentTypes,
    createAppointmentType,
    updateAppointmentType,
    deleteAppointmentType,
    // Availability
    fetchAvailability,
    setAvailabilitySlots,
    getAvailableSlots,
    // Appointments
    fetchAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    confirmAppointment,
    completeAppointment,
    // Blocked Time
    fetchBlockedTimes,
    blockTime,
    unblockTime,
    // Helpers
    getAppointmentsByDate,
    getUpcomingAppointments,
    getTodaysAppointments,
  };
}
