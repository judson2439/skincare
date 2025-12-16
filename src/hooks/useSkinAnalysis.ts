import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SkinAnalysisScore {
  score: number;
  level: 'low' | 'moderate' | 'high';
  description?: string;
}

export interface SkinAnalysis {
  id: string;
  client_id: string;
  photo_url: string | null;
  photo_id: string | null; // Link to progress_photos table
  analysis_data: Record<string, any>;
  dark_circle_score: number | null;
  eye_bag_score: number | null;
  wrinkles_score: number | null;
  deep_wrinkles_score: number | null;
  eye_wrinkles_score: number | null;
  acnes_score: number | null;
  pores_score: number | null;
  pigment_score: number | null;
  overall_score: number | null;
  skin_age: number | null;
  recommendations: string[];
  created_at: string;
  updated_at: string;
}

export function useSkinAnalysis() {
  const { user, profile } = useAuth();
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<SkinAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);


  const fetchAnalyses = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('faceage-skin-scan', {
        body: {
          action: 'get-analyses',
          clientId: user.id
        }
      });

      if (error) {
        console.warn('Skin analysis function not available:', error);
        setLoading(false);
        return;
      }

      if (data?.success) {
        setAnalyses(data.analyses || []);
        setLatestAnalysis(data.analyses?.[0] || null);
      }
    } catch (error) {
      // Silently handle errors - the function may not be deployed
      console.warn('Error fetching skin analyses (function may not be deployed):', error);
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  // Generate FaceAge widget URL
  const getWidgetUrl = async (photoUrl?: string): Promise<{ success: boolean; widgetUrl?: string; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('faceage-skin-scan', {
        body: {
          action: 'get-widget-url',
          clientId: user.id,
          photoUrl // Optional: pre-load with a specific photo
        }
      });

      if (error) throw error;

      if (data.success && data.widgetUrl) {
        return { success: true, widgetUrl: data.widgetUrl };
      }

      return { success: false, error: data.error || 'Failed to generate widget URL' };
    } catch (error: any) {
      console.error('Error generating widget URL:', error);
      return { success: false, error: error.message || 'Failed to generate widget URL' };
    } finally {
      setGenerating(false);
    }
  };

  // Save analysis results (called after receiving callback data)
  // Now supports linking to a specific photo
  const saveAnalysis = async (
    analysisData: Record<string, any>,
    photoId?: string,
    photoUrl?: string
  ): Promise<{ success: boolean; analysis?: SkinAnalysis; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('faceage-skin-scan', {
        body: {
          action: 'save-analysis',
          clientId: user.id,
          analysisData,
          photoId, // Link to progress photo
          photoUrl // Store the photo URL used for analysis
        }
      });

      if (error) throw error;

      if (data.success) {
        // Refresh analyses
        await fetchAnalyses();
        return { success: true, analysis: data.analysis };
      }

      return { success: false, error: data.error || 'Failed to save analysis' };
    } catch (error: any) {
      console.error('Error saving analysis:', error);
      return { success: false, error: error.message || 'Failed to save analysis' };
    } finally {
      setSaving(false);
    }
  };

  // Get analysis for a specific photo
  const getAnalysisForPhoto = useCallback((photoId: string): SkinAnalysis | null => {
    return analyses.find(a => a.photo_id === photoId) || null;
  }, [analyses]);

  // Check if a photo has an associated analysis
  const hasAnalysisForPhoto = useCallback((photoId: string): boolean => {
    return analyses.some(a => a.photo_id === photoId);
  }, [analyses]);

  // Get score level
  const getScoreLevel = (score: number | null): 'low' | 'moderate' | 'high' => {
    if (score === null) return 'low';
    if (score < 30) return 'low';
    if (score < 60) return 'moderate';
    return 'high';
  };

  // Get score color
  const getScoreColor = (score: number | null): string => {
    const level = getScoreLevel(score);
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-amber-600 bg-amber-100';
      case 'high': return 'text-red-600 bg-red-100';
    }
  };

  // Get score label
  const getScoreLabel = (key: string): string => {
    const labels: Record<string, string> = {
      dark_circle_score: 'Dark Circles',
      eye_bag_score: 'Eye Bags',
      wrinkles_score: 'Wrinkles',
      deep_wrinkles_score: 'Deep Wrinkles',
      eye_wrinkles_score: 'Eye Wrinkles',
      acnes_score: 'Acne',
      pores_score: 'Pores',
      pigment_score: 'Pigmentation',
      overall_score: 'Overall Skin Health'
    };
    return labels[key] || key;
  };

  // Get analyses for a specific client (for professionals)
  const getClientAnalyses = async (clientId: string): Promise<SkinAnalysis[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('faceage-skin-scan', {
        body: {
          action: 'get-analyses',
          clientId
        }
      });

      if (error) throw error;

      return data.analyses || [];
    } catch (error) {
      console.error('Error fetching client analyses:', error);
      return [];
    }
  };

  // Compare two analyses
  const compareAnalyses = (older: SkinAnalysis, newer: SkinAnalysis): Record<string, { change: number; improved: boolean }> => {
    const scoreKeys = [
      'dark_circle_score', 'eye_bag_score', 'wrinkles_score', 
      'deep_wrinkles_score', 'eye_wrinkles_score', 'acnes_score', 
      'pores_score', 'pigment_score', 'overall_score'
    ];

    const comparison: Record<string, { change: number; improved: boolean }> = {};

    scoreKeys.forEach(key => {
      const oldScore = (older as any)[key] || 0;
      const newScore = (newer as any)[key] || 0;
      const change = newScore - oldScore;
      // Lower scores are better for most metrics (less wrinkles, less acne, etc.)
      // Exception: overall_score where higher is better
      const improved = key === 'overall_score' ? change > 0 : change < 0;
      comparison[key] = { change, improved };
    });

    return comparison;
  };

  return {
    analyses,
    latestAnalysis,
    loading,
    generating,
    saving,
    getWidgetUrl,
    saveAnalysis,
    getScoreLevel,
    getScoreColor,
    getScoreLabel,
    getClientAnalyses,
    compareAnalyses,
    getAnalysisForPhoto,
    hasAnalysisForPhoto,
    refreshAnalyses: fetchAnalyses
  };
}
