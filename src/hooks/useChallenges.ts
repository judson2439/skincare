import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Challenge {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  challenge_type: 'weekly' | 'monthly' | 'custom';
  duration_days: number;
  start_date: string;
  end_date: string;
  goal_description: string;
  daily_requirement: string | null;
  bonus_points: number;
  badge_name: string | null;
  badge_description: string | null;
  max_participants: number | null;
  is_active: boolean;
  created_at: string;
  participant_count?: number;
  is_joined?: boolean;
  my_progress?: ChallengeParticipant;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  completed: boolean;
  completed_at: string | null;
  days_completed: number;
  total_points_earned: number;
  user_name?: string;
  user_avatar?: string;
}

export interface DailyProgress {
  id: string;
  participant_id: string;
  challenge_id: string;
  user_id: string;
  progress_date: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface ChallengeLeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_avatar: string;
  days_completed: number;
  total_points_earned: number;
  completed: boolean;
}

const DAILY_PROGRESS_POINTS = 15; // Points per day of challenge completion

export function useChallenges() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<Challenge[]>([]);
  const [myParticipations, setMyParticipations] = useState<ChallengeParticipant[]>([]);

  const getToday = () => new Date().toISOString().split('T')[0];

  // Fetch all active challenges
  const fetchChallenges = useCallback(async () => {
    if (!user) return;

    try {
      const today = getToday();
      
      // Fetch active challenges that haven't ended
      const { data: challengesData, error } = await supabase
        .from('skincare_challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', today)
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Get participant counts and check if user has joined
      const challengesWithDetails = await Promise.all(
        (challengesData || []).map(async (challenge) => {
          // Get participant count
          const { count } = await supabase
            .from('challenge_participants')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id);

          // Check if user has joined
          const { data: participation } = await supabase
            .from('challenge_participants')
            .select('*')
            .eq('challenge_id', challenge.id)
            .eq('user_id', user.id)
            .maybeSingle();

          return {
            ...challenge,
            participant_count: count || 0,
            is_joined: !!participation,
            my_progress: participation || undefined,
          };
        })
      );

      setChallenges(challengesWithDetails);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  }, [user]);

  // Fetch challenges created by the professional
  const fetchMyChallenges = useCallback(async () => {
    if (!user || profile?.role !== 'professional') return;

    try {
      const { data, error } = await supabase
        .from('skincare_challenges')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get participant counts
      const challengesWithCounts = await Promise.all(
        (data || []).map(async (challenge) => {
          const { count } = await supabase
            .from('challenge_participants')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id);

          return {
            ...challenge,
            participant_count: count || 0,
          };
        })
      );

      setMyChallenges(challengesWithCounts);
    } catch (error) {
      console.error('Error fetching my challenges:', error);
    }
  }, [user, profile]);

  // Fetch user's challenge participations
  const fetchMyParticipations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setMyParticipations(data || []);
    } catch (error) {
      console.error('Error fetching participations:', error);
    }
  }, [user]);

  // Create a new challenge (professional only)
  const createChallenge = async (challengeData: {
    title: string;
    description?: string;
    challenge_type: 'weekly' | 'monthly' | 'custom';
    duration_days: number;
    start_date: string;
    goal_description: string;
    daily_requirement?: string;
    bonus_points?: number;
    badge_name?: string;
    badge_description?: string;
    max_participants?: number;
  }) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Calculate end date
      const startDate = new Date(challengeData.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + challengeData.duration_days - 1);

      const { data, error } = await supabase
        .from('skincare_challenges')
        .insert({
          professional_id: user.id,
          title: challengeData.title,
          description: challengeData.description || null,
          challenge_type: challengeData.challenge_type,
          duration_days: challengeData.duration_days,
          start_date: challengeData.start_date,
          end_date: endDate.toISOString().split('T')[0],
          goal_description: challengeData.goal_description,
          daily_requirement: challengeData.daily_requirement || null,
          bonus_points: challengeData.bonus_points || 100,
          badge_name: challengeData.badge_name || null,
          badge_description: challengeData.badge_description || null,
          max_participants: challengeData.max_participants || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchMyChallenges();
      await fetchChallenges();

      return { success: true, challenge: data };
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      return { success: false, error: error.message };
    }
  };

  // Join a challenge
  const joinChallenge = async (challengeId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Check if already joined
      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Already joined this challenge' };
      }

      // Check max participants
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge?.max_participants) {
        const { count } = await supabase
          .from('challenge_participants')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challengeId);

        if (count && count >= challenge.max_participants) {
          return { success: false, error: 'Challenge is full' };
        }
      }

      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          days_completed: 0,
          total_points_earned: 0,
        });

      if (error) throw error;

      await fetchChallenges();
      await fetchMyParticipations();

      return { success: true };
    } catch (error: any) {
      console.error('Error joining challenge:', error);
      return { success: false, error: error.message };
    }
  };

  // Leave a challenge
  const leaveChallenge = async (challengeId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchChallenges();
      await fetchMyParticipations();

      return { success: true };
    } catch (error: any) {
      console.error('Error leaving challenge:', error);
      return { success: false, error: error.message };
    }
  };

  // Log daily progress for a challenge
  const logDailyProgress = async (challengeId: string, notes?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const today = getToday();

      // Get participation
      const { data: participation, error: partError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (partError || !participation) {
        return { success: false, error: 'Not participating in this challenge' };
      }

      // Check if already logged today
      const { data: existing } = await supabase
        .from('challenge_daily_progress')
        .select('id')
        .eq('participant_id', participation.id)
        .eq('progress_date', today)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Already logged progress for today' };
      }

      // Get challenge details
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) {
        return { success: false, error: 'Challenge not found' };
      }

      // Check if challenge has started and not ended
      if (today < challenge.start_date) {
        return { success: false, error: 'Challenge has not started yet' };
      }
      if (today > challenge.end_date) {
        return { success: false, error: 'Challenge has ended' };
      }

      // Log progress
      const { error: progressError } = await supabase
        .from('challenge_daily_progress')
        .insert({
          participant_id: participation.id,
          challenge_id: challengeId,
          user_id: user.id,
          progress_date: today,
          completed: true,
          notes: notes || null,
        });

      if (progressError) throw progressError;

      // Update participant stats
      const newDaysCompleted = participation.days_completed + 1;
      const pointsEarned = DAILY_PROGRESS_POINTS;
      const newTotalPoints = participation.total_points_earned + pointsEarned;
      
      // Check if challenge is completed
      const isCompleted = newDaysCompleted >= challenge.duration_days;

      const updateData: any = {
        days_completed: newDaysCompleted,
        total_points_earned: newTotalPoints,
      };

      if (isCompleted && !participation.completed) {
        updateData.completed = true;
        updateData.completed_at = new Date().toISOString();
        updateData.total_points_earned = newTotalPoints + challenge.bonus_points;

        // Award badge if challenge has one
        if (challenge.badge_name) {
          await supabase
            .from('user_badges')
            .insert({
              user_id: user.id,
              badge_name: challenge.badge_name,
              badge_description: challenge.badge_description || `Completed ${challenge.title}`,
              badge_icon: 'challenge-badge',
            });
        }

        // Update user gamification points
        const { data: userStats } = await supabase
          .from('user_gamification')
          .select('points')
          .eq('user_id', user.id)
          .single();

        if (userStats) {
          await supabase
            .from('user_gamification')
            .update({ points: userStats.points + challenge.bonus_points })
            .eq('user_id', user.id);
        }
      }

      await supabase
        .from('challenge_participants')
        .update(updateData)
        .eq('id', participation.id);

      // Update user gamification points for daily progress
      const { data: userStats } = await supabase
        .from('user_gamification')
        .select('points')
        .eq('user_id', user.id)
        .single();

      if (userStats) {
        await supabase
          .from('user_gamification')
          .update({ points: userStats.points + pointsEarned })
          .eq('user_id', user.id);
      }

      await fetchChallenges();
      await fetchMyParticipations();

      return { 
        success: true, 
        pointsEarned,
        isCompleted,
        bonusPoints: isCompleted ? challenge.bonus_points : 0,
        badgeEarned: isCompleted ? challenge.badge_name : null,
      };
    } catch (error: any) {
      console.error('Error logging progress:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if progress is logged for today
  const isProgressLoggedToday = async (challengeId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const today = getToday();
      
      const { data: participation } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!participation) return false;

      const { data } = await supabase
        .from('challenge_daily_progress')
        .select('id')
        .eq('participant_id', participation.id)
        .eq('progress_date', today)
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error('Error checking progress:', error);
      return false;
    }
  };

  // Get challenge leaderboard
  const getChallengeLeaderboard = async (challengeId: string): Promise<ChallengeLeaderboardEntry[]> => {
    try {
      const { data: participants, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('days_completed', { ascending: false })
        .order('total_points_earned', { ascending: false });

      if (error) throw error;

      // Get user profiles
      const leaderboard: ChallengeLeaderboardEntry[] = await Promise.all(
        (participants || []).map(async (p, index) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', p.user_id)
            .maybeSingle();

          return {
            rank: index + 1,
            user_id: p.user_id,
            user_name: userProfile?.full_name || 'Anonymous',
            user_avatar: userProfile?.avatar_url || '',
            days_completed: p.days_completed,
            total_points_earned: p.total_points_earned,
            completed: p.completed,
          };
        })
      );

      return leaderboard;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  };

  // Get overall challenges leaderboard (across all challenges)
  const getOverallChallengesLeaderboard = async (): Promise<ChallengeLeaderboardEntry[]> => {
    try {
      // Aggregate points across all challenges per user
      const { data: participants, error } = await supabase
        .from('challenge_participants')
        .select('user_id, days_completed, total_points_earned, completed');

      if (error) throw error;

      // Group by user
      const userStats: Record<string, { days: number; points: number; completed: number }> = {};
      
      (participants || []).forEach(p => {
        if (!userStats[p.user_id]) {
          userStats[p.user_id] = { days: 0, points: 0, completed: 0 };
        }
        userStats[p.user_id].days += p.days_completed;
        userStats[p.user_id].points += p.total_points_earned;
        if (p.completed) userStats[p.user_id].completed += 1;
      });

      // Sort by points
      const sortedUsers = Object.entries(userStats)
        .sort((a, b) => b[1].points - a[1].points)
        .slice(0, 20);

      // Get user profiles
      const leaderboard: ChallengeLeaderboardEntry[] = await Promise.all(
        sortedUsers.map(async ([userId, stats], index) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', userId)
            .maybeSingle();

          return {
            rank: index + 1,
            user_id: userId,
            user_name: userProfile?.full_name || 'Anonymous',
            user_avatar: userProfile?.avatar_url || '',
            days_completed: stats.days,
            total_points_earned: stats.points,
            completed: stats.completed > 0,
          };
        })
      );

      return leaderboard;
    } catch (error) {
      console.error('Error getting overall leaderboard:', error);
      return [];
    }
  };

  // Get daily progress for a challenge
  const getDailyProgress = async (challengeId: string): Promise<DailyProgress[]> => {
    if (!user) return [];

    try {
      const { data: participation } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!participation) return [];

      const { data, error } = await supabase
        .from('challenge_daily_progress')
        .select('*')
        .eq('participant_id', participation.id)
        .order('progress_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting daily progress:', error);
      return [];
    }
  };

  // Delete a challenge (professional only)
  const deleteChallenge = async (challengeId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('skincare_challenges')
        .delete()
        .eq('id', challengeId)
        .eq('professional_id', user.id);

      if (error) throw error;

      await fetchMyChallenges();
      await fetchChallenges();

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting challenge:', error);
      return { success: false, error: error.message };
    }
  };

  // Update challenge (professional only)
  const updateChallenge = async (challengeId: string, updates: Partial<Challenge>) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('skincare_challenges')
        .update(updates)
        .eq('id', challengeId)
        .eq('professional_id', user.id);

      if (error) throw error;

      await fetchMyChallenges();
      await fetchChallenges();

      return { success: true };
    } catch (error: any) {
      console.error('Error updating challenge:', error);
      return { success: false, error: error.message };
    }
  };

  // Get active challenges user has joined
  const getMyActiveChallenges = () => {
    const today = getToday();
    return challenges.filter(c => 
      c.is_joined && 
      c.start_date <= today && 
      c.end_date >= today
    );
  };

  // Get upcoming challenges
  const getUpcomingChallenges = () => {
    const today = getToday();
    return challenges.filter(c => c.start_date > today);
  };

  // Get completed challenges
  const getCompletedChallenges = () => {
    return challenges.filter(c => c.my_progress?.completed);
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([
        fetchChallenges(),
        fetchMyChallenges(),
        fetchMyParticipations(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [user, fetchChallenges, fetchMyChallenges, fetchMyParticipations]);

  return {
    loading,
    challenges,
    myChallenges,
    myParticipations,
    createChallenge,
    joinChallenge,
    leaveChallenge,
    logDailyProgress,
    isProgressLoggedToday,
    getChallengeLeaderboard,
    getOverallChallengesLeaderboard,
    getDailyProgress,
    deleteChallenge,
    updateChallenge,
    getMyActiveChallenges,
    getUpcomingChallenges,
    getCompletedChallenges,
    refreshData: async () => {
      await Promise.all([
        fetchChallenges(),
        fetchMyChallenges(),
        fetchMyParticipations(),
      ]);
    },
  };
}
