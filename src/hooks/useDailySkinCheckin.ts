import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SkinCheckin {
  id: string;
  client_id: string;
  checkin_date: string;
  skin_rating: number;
  skin_feel: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const SKIN_FEEL_OPTIONS = [
  { value: 'hydrated', label: 'Hydrated', emoji: '💧' },
  { value: 'dry', label: 'Dry', emoji: '🏜️' },
  { value: 'oily', label: 'Oily', emoji: '✨' },
  { value: 'balanced', label: 'Balanced', emoji: '⚖️' },
  { value: 'irritated', label: 'Irritated', emoji: '🔴' },
  { value: 'smooth', label: 'Smooth', emoji: '🧈' },
  { value: 'textured', label: 'Textured', emoji: '🌊' },
  { value: 'glowing', label: 'Glowing', emoji: '✨' },
  { value: 'dull', label: 'Dull', emoji: '😐' },
  { value: 'breakout', label: 'Breakout', emoji: '😣' },
];

export const RATING_LABELS = [
  { value: 1, label: 'Poor', color: 'bg-red-500' },
  { value: 2, label: 'Fair', color: 'bg-orange-500' },
  { value: 3, label: 'Good', color: 'bg-yellow-500' },
  { value: 4, label: 'Great', color: 'bg-lime-500' },
  { value: 5, label: 'Amazing', color: 'bg-green-500' },
];

export function useDailySkinCheckin() {
  const { user, profile } = useAuth();
  const [checkins, setCheckins] = useState<SkinCheckin[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<SkinCheckin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isClient = profile?.role === 'client';

  // Fetch checkins
  const fetchCheckins = useCallback(async () => {
    if (!user) {
      setCheckins([]);
      setTodayCheckin(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_skin_checkins')
        .select('*')
        .eq('client_id', user.id)
        .order('checkin_date', { ascending: false })
        .limit(30);

      if (error) throw error;

      setCheckins(data || []);

      // Check if there's a checkin for today
      const today = new Date().toISOString().split('T')[0];
      const todayData = data?.find(c => c.checkin_date === today);
      setTodayCheckin(todayData || null);
    } catch (error) {
      console.error('Error fetching skin checkins:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isClient) {
      fetchCheckins();
    } else {
      setLoading(false);
    }
  }, [fetchCheckins, isClient]);

  // Submit daily checkin
  const submitCheckin = async (
    rating: number,
    skinFeel: string[],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already submitted today
      if (todayCheckin) {
        // Update existing checkin
        const { data, error } = await supabase
          .from('daily_skin_checkins')
          .update({
            skin_rating: rating,
            skin_feel: skinFeel,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', todayCheckin.id)
          .select()
          .single();

        if (error) throw error;

        setTodayCheckin(data);
        setCheckins(prev => prev.map(c => c.id === data.id ? data : c));
        return { success: true };
      } else {
        // Insert new checkin
        const { data, error } = await supabase
          .from('daily_skin_checkins')
          .insert({
            client_id: user.id,
            checkin_date: today,
            skin_rating: rating,
            skin_feel: skinFeel,
            notes: notes || null,
          })
          .select()
          .single();

        if (error) throw error;

        setTodayCheckin(data);
        setCheckins(prev => [data, ...prev]);
        return { success: true };
      }
    } catch (error: any) {
      console.error('Error submitting skin checkin:', error);
      return { success: false, error: error.message || 'Failed to submit checkin' };
    } finally {
      setSaving(false);
    }
  };

  // Get checkin for a specific date
  const getCheckinByDate = (date: string): SkinCheckin | undefined => {
    return checkins.find(c => c.checkin_date === date);
  };

  // Get average rating for the last N days
  const getAverageRating = (days: number = 7): number | null => {
    const recentCheckins = checkins.slice(0, days);
    if (recentCheckins.length === 0) return null;
    const sum = recentCheckins.reduce((acc, c) => acc + c.skin_rating, 0);
    return Math.round((sum / recentCheckins.length) * 10) / 10;
  };

  // Get rating trend (improving, declining, stable)
  const getRatingTrend = (): 'improving' | 'declining' | 'stable' | null => {
    if (checkins.length < 3) return null;
    
    const recent = checkins.slice(0, 3);
    const older = checkins.slice(3, 6);
    
    if (older.length === 0) return null;
    
    const recentAvg = recent.reduce((acc, c) => acc + c.skin_rating, 0) / recent.length;
    const olderAvg = older.reduce((acc, c) => acc + c.skin_rating, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'declining';
    return 'stable';
  };

  // Get most common skin feel
  const getMostCommonSkinFeel = (): string | null => {
    if (checkins.length === 0) return null;
    
    const feelCounts: Record<string, number> = {};
    checkins.forEach(c => {
      c.skin_feel?.forEach(feel => {
        feelCounts[feel] = (feelCounts[feel] || 0) + 1;
      });
    });
    
    const sorted = Object.entries(feelCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || null;
  };

  // Check if user has checked in today
  const hasCheckedInToday = (): boolean => {
    return todayCheckin !== null;
  };

  return {
    checkins,
    todayCheckin,
    loading,
    saving,
    submitCheckin,
    getCheckinByDate,
    getAverageRating,
    getRatingTrend,
    getMostCommonSkinFeel,
    hasCheckedInToday,
    refresh: fetchCheckins,
  };
}
