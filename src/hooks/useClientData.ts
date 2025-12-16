import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface RoutineCompletion {
  id: string;
  user_id: string;
  completion_date: string;
  routine_type: 'morning' | 'evening';
  completed_at: string;
  products_used: string[];
}

export interface GamificationStats {
  id: string;
  user_id: string;
  points: number;
  current_streak: number;
  longest_streak: number;
  level: string;
  total_routines_completed: number;
  last_completion_date: string | null;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  earned_at: string;
}

const POINTS_PER_ROUTINE = 50;
const STREAK_BONUS_MULTIPLIER = 0.1; // 10% bonus per streak day

const LEVEL_THRESHOLDS = [
  { name: 'Bronze', minPoints: 0 },
  { name: 'Silver', minPoints: 500 },
  { name: 'Gold', minPoints: 1500 },
  { name: 'Platinum', minPoints: 3000 },
  { name: 'Diamond', minPoints: 5000 },
];

const BADGE_DEFINITIONS = [
  { name: 'First Step', description: 'Complete your first routine', condition: (stats: GamificationStats) => stats.total_routines_completed >= 1 },
  { name: 'Week Warrior', description: 'Maintain a 7-day streak', condition: (stats: GamificationStats) => stats.current_streak >= 7 || stats.longest_streak >= 7 },
  { name: 'Consistency Queen', description: 'Maintain a 14-day streak', condition: (stats: GamificationStats) => stats.current_streak >= 14 || stats.longest_streak >= 14 },
  { name: 'Skincare Devotee', description: 'Maintain a 30-day streak', condition: (stats: GamificationStats) => stats.current_streak >= 30 || stats.longest_streak >= 30 },
  { name: 'Glow Getter', description: 'Complete 50 routines', condition: (stats: GamificationStats) => stats.total_routines_completed >= 50 },
  { name: 'Radiance Master', description: 'Complete 100 routines', condition: (stats: GamificationStats) => stats.total_routines_completed >= 100 },
];

export function useClientData() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [todayCompletions, setTodayCompletions] = useState<RoutineCompletion[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<RoutineCompletion[]>([]);
  
  // Use refs to prevent duplicate fetches
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Get today's date in YYYY-MM-DD format
  const getToday = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Calculate level based on points
  const calculateLevel = (points: number): string => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (points >= LEVEL_THRESHOLDS[i].minPoints) {
        return LEVEL_THRESHOLDS[i].name;
      }
    }
    return 'Bronze';
  };

  // Calculate streak from completion history
  const calculateStreak = async (userId: string): Promise<{ current: number; longest: number }> => {
    try {
      const { data: completions, error } = await supabase
        .from('routine_completions')
        .select('completion_date')
        .eq('user_id', userId)
        .order('completion_date', { ascending: false });

      if (error || !completions || completions.length === 0) {
        return { current: 0, longest: 0 };
      }

      // Get unique dates
      const uniqueDates = [...new Set(completions.map(c => c.completion_date))].sort().reverse();
      
      const today = getToday();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date(today);
      
      // Check if completed today or yesterday to start counting
      if (uniqueDates[0] !== today && uniqueDates[0] !== yesterdayStr) {
        currentStreak = 0;
      } else {
        // Start from the most recent completion
        checkDate = new Date(uniqueDates[0]);
        
        for (let i = 0; i < uniqueDates.length; i++) {
          const expectedDate = new Date(checkDate);
          expectedDate.setDate(expectedDate.getDate() - i);
          const expectedDateStr = expectedDate.toISOString().split('T')[0];
          
          if (uniqueDates[i] === expectedDateStr) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 1;
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

      return { current: currentStreak, longest: longestStreak };
    } catch (error) {
      console.error('Error calculating streak:', error);
      return { current: 0, longest: 0 };
    }
  };

  // Fetch gamification stats
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching gamification stats (table may not exist):', error);
        // Set default stats if table doesn't exist
        setStats({
          id: '',
          user_id: user.id,
          points: 0,
          current_streak: 0,
          longest_streak: 0,
          level: 'Bronze',
          total_routines_completed: 0,
          last_completion_date: null,
        });
        return;
      }

      if (!data) {
        // No record exists, create one
        const newStats: Partial<GamificationStats> = {
          user_id: user.id,
          points: 0,
          current_streak: 0,
          longest_streak: 0,
          level: 'Bronze',
          total_routines_completed: 0,
          last_completion_date: null,
        };

        const { data: created, error: createError } = await supabase
          .from('user_gamification')
          .insert(newStats)
          .select()
          .maybeSingle();

        if (createError) {
          console.warn('Error creating gamification stats:', createError);
          setStats(newStats as GamificationStats);
          return;
        }
        setStats(created);
      } else {
        // Recalculate streak to ensure accuracy
        const streaks = await calculateStreak(user.id);
        const updatedStats = {
          ...data,
          current_streak: streaks.current,
          longest_streak: Math.max(data.longest_streak, streaks.longest),
        };
        setStats(updatedStats);
      }
    } catch (error) {
      console.warn('Error fetching stats:', error);
    }
  }, [user?.id]);




  // Fetch today's completions
  const fetchTodayCompletions = useCallback(async () => {
    if (!user) return;

    try {
      const today = getToday();
      const { data, error } = await supabase
        .from('routine_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_date', today);

      if (error) {
        console.warn('Error fetching today completions:', error);
        setTodayCompletions([]);
        return;
      }
      setTodayCompletions(data || []);
    } catch (error) {
      console.error('Error fetching today completions:', error);
      setTodayCompletions([]);
    }
  }, [user?.id]);

  // Fetch recent completions (last 30 days)
  const fetchRecentCompletions = useCallback(async () => {
    if (!user) return;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('routine_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completion_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('completion_date', { ascending: false });

      if (error) {
        console.warn('Error fetching recent completions:', error);
        setRecentCompletions([]);
        return;
      }
      setRecentCompletions(data || []);
    } catch (error) {
      console.error('Error fetching recent completions:', error);
      setRecentCompletions([]);
    }
  }, [user?.id]);

  // Fetch badges
  const fetchBadges = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.warn('Error fetching badges:', error);
        setBadges([]);
        return;
      }
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      setBadges([]);
    }
  }, [user?.id]);

  // Check and award badges
  const checkAndAwardBadges = async (currentStats: GamificationStats) => {
    if (!user) return;

    try {
      const { data: existingBadges } = await supabase
        .from('user_badges')
        .select('badge_name')
        .eq('user_id', user.id);

      const earnedBadgeNames = new Set(existingBadges?.map(b => b.badge_name) || []);

      for (const badge of BADGE_DEFINITIONS) {
        if (!earnedBadgeNames.has(badge.name) && badge.condition(currentStats)) {
          await supabase
            .from('user_badges')
            .insert({
              user_id: user.id,
              badge_name: badge.name,
              badge_description: badge.description,
              badge_icon: badge.name.toLowerCase().replace(' ', '-'),
            });
        }
      }

      // Refresh badges
      await fetchBadges();
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  // Complete a routine
  const completeRoutine = async (routineType: 'morning' | 'evening', productsUsed: string[] = []) => {
    if (!user || !stats) return { success: false, error: 'Not authenticated' };

    try {
      const today = getToday();

      // Check if already completed today
      const existingCompletion = todayCompletions.find(c => c.routine_type === routineType);
      if (existingCompletion) {
        return { success: false, error: 'Already completed this routine today' };
      }

      // Insert completion
      const { error: insertError } = await supabase
        .from('routine_completions')
        .insert({
          user_id: user.id,
          completion_date: today,
          routine_type: routineType,
          products_used: productsUsed,
        });

      if (insertError) throw insertError;

      // Calculate new streak
      const streaks = await calculateStreak(user.id);

      // Calculate points with streak bonus
      const basePoints = POINTS_PER_ROUTINE;
      const streakBonus = Math.floor(basePoints * STREAK_BONUS_MULTIPLIER * streaks.current);
      const totalPointsEarned = basePoints + streakBonus;

      // Update gamification stats
      const newPoints = stats.points + totalPointsEarned;
      const newLevel = calculateLevel(newPoints);
      const newTotalRoutines = stats.total_routines_completed + 1;

      const updatedStats: Partial<GamificationStats> = {
        points: newPoints,
        current_streak: streaks.current,
        longest_streak: Math.max(stats.longest_streak, streaks.longest),
        level: newLevel,
        total_routines_completed: newTotalRoutines,
        last_completion_date: today,
      };

      const { error: updateError } = await supabase
        .from('user_gamification')
        .update(updatedStats)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Refresh data
      await fetchStats();
      await fetchTodayCompletions();
      await fetchRecentCompletions();

      // Check for new badges
      await checkAndAwardBadges({ ...stats, ...updatedStats } as GamificationStats);

      return { 
        success: true, 
        pointsEarned: totalPointsEarned,
        streakBonus,
        newStreak: streaks.current,
        levelUp: newLevel !== stats.level ? newLevel : null,
      };
    } catch (error: any) {
      console.error('Error completing routine:', error);
      return { success: false, error: error.message };
    }
  };

  // Uncomplete a routine (for toggling off)
  const uncompleteRoutine = async (routineType: 'morning' | 'evening') => {
    if (!user || !stats) return { success: false, error: 'Not authenticated' };

    try {
      const today = getToday();

      // Delete the completion
      const { error: deleteError } = await supabase
        .from('routine_completions')
        .delete()
        .eq('user_id', user.id)
        .eq('completion_date', today)
        .eq('routine_type', routineType);

      if (deleteError) throw deleteError;

      // Recalculate streak
      const streaks = await calculateStreak(user.id);

      // Subtract points
      const pointsToRemove = POINTS_PER_ROUTINE;
      const newPoints = Math.max(0, stats.points - pointsToRemove);
      const newLevel = calculateLevel(newPoints);
      const newTotalRoutines = Math.max(0, stats.total_routines_completed - 1);

      const updatedStats: Partial<GamificationStats> = {
        points: newPoints,
        current_streak: streaks.current,
        level: newLevel,
        total_routines_completed: newTotalRoutines,
      };

      const { error: updateError } = await supabase
        .from('user_gamification')
        .update(updatedStats)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Refresh data
      await fetchStats();
      await fetchTodayCompletions();
      await fetchRecentCompletions();

      return { success: true };
    } catch (error: any) {
      console.error('Error uncompleting routine:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if routine is completed today
  const isRoutineCompletedToday = (routineType: 'morning' | 'evening'): boolean => {
    return todayCompletions.some(c => c.routine_type === routineType);
  };

  // Initial data fetch - only run once when user and profile are ready
  useEffect(() => {
    const loadData = async () => {
      // Only fetch if we have a user and profile, and haven't fetched yet
      if (!user || !profile) {
        setLoading(false);
        return;
      }
      
      // Only fetch for clients
      if (profile.role !== 'client') {
        setLoading(false);
        return;
      }
      
      // Prevent duplicate fetches
      if (hasFetchedRef.current || isFetchingRef.current) {
        return;
      }
      
      hasFetchedRef.current = true;
      isFetchingRef.current = true;
      setLoading(true);
      
      try {
        await Promise.all([
          fetchStats(),
          fetchTodayCompletions(),
          fetchRecentCompletions(),
          fetchBadges(),
        ]);
      } catch (error) {
        console.error('Error loading client data:', error);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    loadData();
    
    // Reset the fetch flag when user changes (logout/login)
    if (!user) {
      hasFetchedRef.current = false;
      setStats(null);
      setTodayCompletions([]);
      setRecentCompletions([]);
      setBadges([]);
    }
  }, [user, profile, fetchStats, fetchTodayCompletions, fetchRecentCompletions, fetchBadges]);

  // Manual refresh function that resets the fetch flag
  const refreshData = useCallback(async () => {
    if (!user) return;
    
    hasFetchedRef.current = false;
    isFetchingRef.current = false;
    setLoading(true);
    
    try {
      await Promise.all([
        fetchStats(),
        fetchTodayCompletions(),
        fetchRecentCompletions(),
        fetchBadges(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchStats, fetchTodayCompletions, fetchRecentCompletions, fetchBadges]);

  return {
    loading,
    stats,
    todayCompletions,
    recentCompletions,
    badges,
    completeRoutine,
    uncompleteRoutine,
    isRoutineCompletedToday,
    refreshData,
  };
}
