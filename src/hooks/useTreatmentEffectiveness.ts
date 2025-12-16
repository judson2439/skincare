import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface TreatmentEffectiveness {
  id: string;
  treatment_id: string;
  client_id: string;
  professional_id: string;
  treatment_type: string;
  treatment_date: string;
  before_analysis_id: string | null;
  before_analysis_date: string | null;
  before_skin_age: number | null;
  before_overall_score: number | null;
  before_dark_circle: number | null;
  before_eye_bag: number | null;
  before_wrinkles: number | null;
  before_acnes: number | null;
  before_pores: number | null;
  before_pigment: number | null;
  after_analysis_id: string | null;
  after_analysis_date: string | null;
  after_skin_age: number | null;
  after_overall_score: number | null;
  after_dark_circle: number | null;
  after_eye_bag: number | null;
  after_wrinkles: number | null;
  after_acnes: number | null;
  after_pores: number | null;
  after_pigment: number | null;
  skin_age_improvement: number | null;
  overall_score_improvement: number | null;
  dark_circle_improvement: number | null;
  eye_bag_improvement: number | null;
  wrinkles_improvement: number | null;
  acnes_improvement: number | null;
  pores_improvement: number | null;
  pigment_improvement: number | null;
  effectiveness_score: number | null;
  days_to_after_scan: number | null;
  created_at: string;
  updated_at: string;
}

export interface EffectivenessByType {
  treatment_type: string;
  treatment_count: number;
  avg_effectiveness_score: number;
  avg_skin_age_improvement: number | null;
  avg_dark_circle_improvement: number | null;
  avg_eye_bag_improvement: number | null;
  avg_wrinkles_improvement: number | null;
  avg_acnes_improvement: number | null;
  avg_pores_improvement: number | null;
  avg_pigment_improvement: number | null;
}

export interface EffectivenessReport {
  summary: {
    totalTreatments: number;
    treatmentsWithData: number;
    avgEffectivenessScore: number | null;
    treatmentsByType: Record<string, number>;
    topPerformingTreatments: Array<{
      treatment_type: string;
      avg_effectiveness: number;
      count: number;
    }>;
    metricsImpact: Record<string, { improved: number; worsened: number; unchanged: number }>;
  };
  treatments: TreatmentEffectiveness[];
  dateRange: { start: string | null; end: string | null };
}

export function useTreatmentEffectiveness() {
  const { user, profile } = useAuth();
  const [effectivenessByType, setEffectivenessByType] = useState<EffectivenessByType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Correlate a treatment with FaceAge skin analyses
  const correlateTreatment = async (
    treatmentId: string,
    clientId: string,
    treatmentType: string,
    treatmentDate: string,
    daysWindow: number = 14
  ): Promise<{ success: boolean; correlation?: TreatmentEffectiveness; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error: fnError } = await supabase.functions.invoke('faceage-skin-scan', {
        body: {
          action: 'correlate-treatment',
          treatmentId,
          clientId,
          professionalId: user.id,
          treatmentType,
          treatmentDate,
          daysWindow,
        },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error || 'Failed to correlate treatment');

      return { success: true, correlation: data.correlation };
    } catch (err: any) {
      console.error('Error correlating treatment:', err);
      return { success: false, error: err.message };
    }
  };

  // Get effectiveness data for a specific treatment
  const getTreatmentEffectiveness = async (
    treatmentId: string
  ): Promise<{ success: boolean; effectiveness?: TreatmentEffectiveness | null; error?: string }> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('faceage-skin-scan', {
        body: {
          action: 'get-treatment-effectiveness',
          treatmentId,
        },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error || 'Failed to get effectiveness');

      return { success: true, effectiveness: data.effectiveness };
    } catch (err: any) {
      console.error('Error getting treatment effectiveness:', err);
      return { success: false, error: err.message };
    }
  };

  // Fetch effectiveness data aggregated by treatment type
  const fetchEffectivenessByType = useCallback(async () => {
    if (!user || profile?.user_type !== 'professional') return;

    try {
      setLoading(true);
      const { data, error: fnError } = await supabase.functions.invoke('faceage-skin-scan', {
        body: {
          action: 'get-effectiveness-by-type',
          professionalId: user.id,
        },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error || 'Failed to fetch effectiveness data');

      setEffectivenessByType(data.effectivenessByType || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching effectiveness by type:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Get all effectiveness data for a client
  const getClientEffectiveness = async (
    clientId: string
  ): Promise<{ success: boolean; effectiveness?: TreatmentEffectiveness[]; error?: string }> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('faceage-skin-scan', {
        body: {
          action: 'get-client-treatment-effectiveness',
          clientId,
        },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error || 'Failed to get client effectiveness');

      return { success: true, effectiveness: data.effectiveness || [] };
    } catch (err: any) {
      console.error('Error getting client effectiveness:', err);
      return { success: false, error: err.message };
    }
  };

  // Generate comprehensive effectiveness report
  const generateEffectivenessReport = async (
    startDate?: string,
    endDate?: string
  ): Promise<{ success: boolean; report?: EffectivenessReport; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error: fnError } = await supabase.functions.invoke('faceage-skin-scan', {
        body: {
          action: 'generate-effectiveness-report',
          professionalId: user.id,
          startDate,
          endDate,
        },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error || 'Failed to generate report');

      return { success: true, report: data.report };
    } catch (err: any) {
      console.error('Error generating effectiveness report:', err);
      return { success: false, error: err.message };
    }
  };

  // Correlate all treatments for a client (batch operation)
  const correlateAllClientTreatments = async (
    clientId: string,
    treatments: Array<{ id: string; treatment_type: string; treatment_date: string }>
  ): Promise<{ success: boolean; correlated: number; errors: number }> => {
    if (!user) return { success: false, correlated: 0, errors: 0 };

    let correlated = 0;
    let errors = 0;

    for (const treatment of treatments) {
      const result = await correlateTreatment(
        treatment.id,
        clientId,
        treatment.treatment_type,
        treatment.treatment_date
      );

      if (result.success) {
        correlated++;
      } else {
        errors++;
      }
    }

    return { success: errors === 0, correlated, errors };
  };

  // Initial fetch
  useEffect(() => {
    fetchEffectivenessByType();
  }, [fetchEffectivenessByType]);

  return {
    effectivenessByType,
    loading,
    error,
    correlateTreatment,
    getTreatmentEffectiveness,
    fetchEffectivenessByType,
    getClientEffectiveness,
    generateEffectivenessReport,
    correlateAllClientTreatments,
  };
}
