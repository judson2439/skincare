import React from 'react';
import { ChallengeLeaderboardEntry } from '@/hooks/useChallenges';
import { Trophy, Crown, Medal, Flame, Check } from 'lucide-react';

interface ChallengesLeaderboardProps {
  entries: ChallengeLeaderboardEntry[];
  title?: string;
  currentUserId?: string;
  showCompleted?: boolean;
}

export const ChallengesLeaderboard: React.FC<ChallengesLeaderboardProps> = ({
  entries,
  title = 'Challenge Leaderboard',
  currentUserId,
  showCompleted = true,
}) => {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No participants yet</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return null;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-50 border-yellow-200';
      case 2: return 'bg-gray-50 border-gray-200';
      case 3: return 'bg-amber-50 border-amber-200';
      default: return 'bg-white border-gray-100';
    }
  };

  // Top 3 podium
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-serif font-bold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          {title}
        </h3>
      </div>

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] p-6">
          <div className="flex items-end justify-center gap-4">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="relative">
                <img 
                  src={top3[1].user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[1].user_name)}&background=random`} 
                  alt={top3[1].user_name} 
                  className="w-14 h-14 rounded-full mx-auto mb-2 border-4 border-gray-400 object-cover" 
                />
                {top3[1].completed && showCompleted && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <p className="text-white text-sm font-medium truncate max-w-[80px]">{top3[1].user_name.split(' ')[0]}</p>
              <p className="text-white/60 text-xs">{top3[1].total_points_earned} pts</p>
              <div className="w-16 h-14 bg-gray-400 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-xl font-bold text-white">2</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className="relative">
                <Crown className="w-6 h-6 text-yellow-400 absolute -top-3 left-1/2 -translate-x-1/2" />
                <img 
                  src={top3[0].user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[0].user_name)}&background=random`} 
                  alt={top3[0].user_name} 
                  className="w-18 h-18 rounded-full mx-auto mb-2 border-4 border-yellow-400 object-cover w-[72px] h-[72px]" 
                />
                {top3[0].completed && showCompleted && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <p className="text-white font-medium truncate max-w-[100px]">{top3[0].user_name.split(' ')[0]}</p>
              <p className="text-white/60 text-xs">{top3[0].total_points_earned} pts</p>
              <div className="w-20 h-20 bg-yellow-400 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="relative">
                <img 
                  src={top3[2].user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3[2].user_name)}&background=random`} 
                  alt={top3[2].user_name} 
                  className="w-14 h-14 rounded-full mx-auto mb-2 border-4 border-amber-600 object-cover" 
                />
                {top3[2].completed && showCompleted && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <p className="text-white text-sm font-medium truncate max-w-[80px]">{top3[2].user_name.split(' ')[0]}</p>
              <p className="text-white/60 text-xs">{top3[2].total_points_earned} pts</p>
              <div className="w-16 h-10 bg-amber-600 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-xl font-bold text-white">3</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the list */}
      <div className="divide-y divide-gray-100">
        {(top3.length < 3 ? entries : rest).map((entry, idx) => {
          const rank = top3.length < 3 ? entry.rank : entry.rank;
          const isCurrentUser = entry.user_id === currentUserId;
          
          return (
            <div 
              key={entry.user_id} 
              className={`flex items-center gap-4 p-4 ${isCurrentUser ? 'bg-[#CFAFA3]/10' : 'hover:bg-gray-50'} ${getRankBg(rank)}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                rank === 1 ? 'bg-yellow-400 text-white' :
                rank === 2 ? 'bg-gray-400 text-white' :
                rank === 3 ? 'bg-amber-600 text-white' :
                'bg-gray-100 text-gray-600'
              }`}>
                {getRankIcon(rank) || rank}
              </div>
              <img 
                src={entry.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.user_name)}&background=random`} 
                alt={entry.user_name} 
                className="w-10 h-10 rounded-full object-cover" 
              />
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isCurrentUser ? 'text-[#CFAFA3]' : ''}`}>
                  {entry.user_name}
                  {isCurrentUser && <span className="text-xs text-gray-500 ml-2">(You)</span>}
                </p>
                <p className="text-xs text-gray-500">{entry.days_completed} days completed</p>
              </div>
              {entry.completed && showCompleted && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-medium">Done</span>
                </div>
              )}
              <div className="text-right">
                <p className="font-bold text-[#CFAFA3]">{entry.total_points_earned}</p>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChallengesLeaderboard;
