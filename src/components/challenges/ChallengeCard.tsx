import React from 'react';
import { Challenge } from '@/hooks/useChallenges';
import { 
  Calendar, 
  Users, 
  Trophy, 
  Target, 
  Clock, 
  Check, 
  Droplets,
  Sparkles,
  Flame,
  Award
} from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin?: () => void;
  onLeave?: () => void;
  onLogProgress?: () => void;
  onViewDetails?: () => void;
  isJoining?: boolean;
  todayLogged?: boolean;
}

const getChallengeIcon = (title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('hydrat')) return Droplets;
  if (lowerTitle.includes('glow') || lowerTitle.includes('bright')) return Sparkles;
  if (lowerTitle.includes('streak') || lowerTitle.includes('consist')) return Flame;
  return Target;
};

const getChallengeColor = (type: string) => {
  switch (type) {
    case 'weekly': return { bg: 'from-blue-500 to-cyan-500', light: 'bg-blue-100 text-blue-700' };
    case 'monthly': return { bg: 'from-purple-500 to-pink-500', light: 'bg-purple-100 text-purple-700' };
    default: return { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-100 text-amber-700' };
  }
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onJoin,
  onLeave,
  onLogProgress,
  onViewDetails,
  isJoining = false,
  todayLogged = false,
}) => {
  const Icon = getChallengeIcon(challenge.title);
  const colors = getChallengeColor(challenge.challenge_type);
  
  const today = new Date().toISOString().split('T')[0];
  const hasStarted = challenge.start_date <= today;
  const hasEnded = challenge.end_date < today;
  const isActive = hasStarted && !hasEnded;
  
  const progress = challenge.my_progress 
    ? Math.round((challenge.my_progress.days_completed / challenge.duration_days) * 100)
    : 0;

  const daysRemaining = Math.max(0, Math.ceil(
    (new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.bg} p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">{challenge.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium">
                  {challenge.challenge_type === 'weekly' ? '7 Days' : 
                   challenge.challenge_type === 'monthly' ? '30 Days' : 
                   `${challenge.duration_days} Days`}
                </span>
                {challenge.badge_name && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium flex items-center gap-1">
                    <Award className="w-3 h-3" /> Badge
                  </span>
                )}
              </div>
            </div>
          </div>
          {challenge.is_joined && challenge.my_progress?.completed && (
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {challenge.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{challenge.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(challenge.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{challenge.participant_count || 0} joined</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{challenge.bonus_points} pts</span>
          </div>
        </div>

        {/* Goal */}
        <div className="p-3 bg-gray-50 rounded-xl mb-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Goal</p>
          <p className="text-sm text-gray-700">{challenge.goal_description}</p>
          {challenge.daily_requirement && (
            <p className="text-xs text-gray-500 mt-1">Daily: {challenge.daily_requirement}</p>
          )}
        </div>

        {/* Progress (if joined) */}
        {challenge.is_joined && challenge.my_progress && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Your Progress</span>
              <span className="font-medium text-gray-900">
                {challenge.my_progress.days_completed}/{challenge.duration_days} days
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${colors.bg} rounded-full transition-all`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{challenge.my_progress.total_points_earned} pts earned</span>
              {!hasEnded && <span>{daysRemaining} days left</span>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!challenge.is_joined && !hasEnded && (
            <button
              onClick={onJoin}
              disabled={isJoining}
              className={`flex-1 py-2.5 bg-gradient-to-r ${colors.bg} text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isJoining ? 'Joining...' : hasStarted ? 'Join Challenge' : 'Join Now'}
            </button>
          )}
          
          {challenge.is_joined && isActive && !challenge.my_progress?.completed && (
            <>
              <button
                onClick={onLogProgress}
                disabled={todayLogged}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  todayLogged 
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : `bg-gradient-to-r ${colors.bg} text-white hover:shadow-lg`
                }`}
              >
                {todayLogged ? (
                  <span className="flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" /> Today Done
                  </span>
                ) : (
                  'Log Today\'s Progress'
                )}
              </button>
              <button
                onClick={onLeave}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Leave
              </button>
            </>
          )}

          {challenge.is_joined && challenge.my_progress?.completed && (
            <div className="flex-1 py-2.5 bg-green-100 text-green-700 rounded-xl font-medium text-center flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4" /> Challenge Complete!
            </div>
          )}

          {challenge.is_joined && hasEnded && !challenge.my_progress?.completed && (
            <div className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-medium text-center">
              Challenge Ended
            </div>
          )}

          <button
            onClick={onViewDetails}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;
