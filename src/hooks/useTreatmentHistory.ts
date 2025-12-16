import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Treatment {
  id: string;
  professional_id: string;
  client_id: string;
  treatment_type: string;
  treatment_date: string;
  duration_minutes: number | null;
  products_used: string[];
  notes: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  results_summary: string | null;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface TreatmentFormData {
  treatment_type: string;
  treatment_date: string;
  duration_minutes?: number;
  products_used: string[];
  notes?: string;
  before_photo_url?: string;
  after_photo_url?: string;
  results_summary?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  cost?: number;
}

// Common treatment types for skincare professionals
export const TREATMENT_TYPES = [
  'Facial',
  'Chemical Peel',
  'Microdermabrasion',
  'Microneedling',
  'LED Light Therapy',
  'Hydrafacial',
  'Dermaplaning',
  'Extraction',
  'Acne Treatment',
  'Anti-Aging Treatment',
  'Brightening Treatment',
  'Hydrating Treatment',
  'Consultation',
  'Follow-up',
  'Product Application',
  'Skin Analysis',
  'Custom Treatment',
  'Other'
];

export function useTreatmentHistory() {
  const { user, profile } = useAuth();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all treatments for the professional
  const fetchTreatments = useCallback(async () => {
    if (!user || profile?.user_type !== 'professional') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('treatment_history')
        .select('*')
        .eq('professional_id', user.id)
        .order('treatment_date', { ascending: false });

      if (fetchError) throw fetchError;
      setTreatments(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching treatments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Get treatments for a specific client
  const getClientTreatments = useCallback((clientId: string): Treatment[] => {
    return treatments.filter(t => t.client_id === clientId);
  }, [treatments]);

  // Get treatment count for a client
  const getTreatmentCount = useCallback((clientId: string): number => {
    return treatments.filter(t => t.client_id === clientId).length;
  }, [treatments]);

  // Add a new treatment
  const addTreatment = async (clientId: string, data: TreatmentFormData): Promise<{ success: boolean; treatment?: Treatment; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data: newTreatment, error: insertError } = await supabase
        .from('treatment_history')
        .insert({
          professional_id: user.id,
          client_id: clientId,
          treatment_type: data.treatment_type,
          treatment_date: data.treatment_date,
          duration_minutes: data.duration_minutes || null,
          products_used: data.products_used || [],
          notes: data.notes || null,
          before_photo_url: data.before_photo_url || null,
          after_photo_url: data.after_photo_url || null,
          results_summary: data.results_summary || null,
          follow_up_date: data.follow_up_date || null,
          follow_up_notes: data.follow_up_notes || null,
          cost: data.cost || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setTreatments(prev => [newTreatment, ...prev]);
      return { success: true, treatment: newTreatment };
    } catch (err: any) {
      console.error('Error adding treatment:', err);
      return { success: false, error: err.message };
    }
  };

  // Update a treatment
  const updateTreatment = async (treatmentId: string, data: Partial<TreatmentFormData>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('treatment_history')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', treatmentId)
        .eq('professional_id', user.id);

      if (updateError) throw updateError;

      setTreatments(prev => prev.map(t => 
        t.id === treatmentId ? { ...t, ...data, updated_at: new Date().toISOString() } : t
      ));
      return { success: true };
    } catch (err: any) {
      console.error('Error updating treatment:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete a treatment
  const deleteTreatment = async (treatmentId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error: deleteError } = await supabase
        .from('treatment_history')
        .delete()
        .eq('id', treatmentId)
        .eq('professional_id', user.id);

      if (deleteError) throw deleteError;

      setTreatments(prev => prev.filter(t => t.id !== treatmentId));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting treatment:', err);
      return { success: false, error: err.message };
    }
  };

  // Get treatment statistics for a client
  const getClientTreatmentStats = useCallback((clientId: string) => {
    const clientTreatments = getClientTreatments(clientId);
    
    if (clientTreatments.length === 0) {
      return {
        totalTreatments: 0,
        totalSpent: 0,
        mostCommonTreatment: null,
        lastTreatmentDate: null,
        treatmentsByType: {},
      };
    }

    const treatmentsByType: Record<string, number> = {};
    let totalSpent = 0;

    clientTreatments.forEach(t => {
      treatmentsByType[t.treatment_type] = (treatmentsByType[t.treatment_type] || 0) + 1;
      if (t.cost) totalSpent += Number(t.cost);
    });

    const mostCommonTreatment = Object.entries(treatmentsByType)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalTreatments: clientTreatments.length,
      totalSpent,
      mostCommonTreatment,
      lastTreatmentDate: clientTreatments[0]?.treatment_date || null,
      treatmentsByType,
    };
  }, [getClientTreatments]);

  // Generate treatment report data for a client
  const generateReportData = useCallback((clientId: string, startDate?: string, endDate?: string) => {
    let clientTreatments = getClientTreatments(clientId);

    // Filter by date range if provided
    if (startDate) {
      clientTreatments = clientTreatments.filter(t => t.treatment_date >= startDate);
    }
    if (endDate) {
      clientTreatments = clientTreatments.filter(t => t.treatment_date <= endDate);
    }

    // Sort by date ascending for report
    const sortedTreatments = [...clientTreatments].sort(
      (a, b) => new Date(a.treatment_date).getTime() - new Date(b.treatment_date).getTime()
    );

    const stats = getClientTreatmentStats(clientId);
    
    return {
      treatments: sortedTreatments,
      stats,
      dateRange: {
        start: startDate || sortedTreatments[0]?.treatment_date,
        end: endDate || sortedTreatments[sortedTreatments.length - 1]?.treatment_date,
      },
    };
  }, [getClientTreatments, getClientTreatmentStats]);

  // Upload treatment photo
  const uploadTreatmentPhoto = async (file: File, type: 'before' | 'after'): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      return { success: true, url: urlData.publicUrl };
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      return { success: false, error: err.message };
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  return {
    treatments,
    loading,
    error,
    getClientTreatments,
    getTreatmentCount,
    addTreatment,
    updateTreatment,
    deleteTreatment,
    getClientTreatmentStats,
    generateReportData,
    uploadTreatmentPhoto,
    refreshData: fetchTreatments,
  };
}
