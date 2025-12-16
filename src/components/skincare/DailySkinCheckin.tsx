import React, { useState, useEffect } from 'react';
import { useDailySkinCheckin, SKIN_FEEL_OPTIONS, RATING_LABELS } from '@/hooks/useDailySkinCheckin';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Check,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Sun,
  Edit2,
  X,
} from 'lucide-react';

interface DailySkinCheckinProps {
  onComplete?: () => void;
}

const DailySkinCheckin: React.FC<DailySkinCheckinProps> = ({ onComplete }) => {
  const {
    todayCheckin,
    loading,
    saving,
    submitCheckin,
    getAverageRating,
    getRatingTrend,
    hasCheckedInToday,
  } = useDailySkinCheckin();
  const { toast } = useToast();

  const [isExpanded, setIsExpanded] = useState(!hasCheckedInToday());
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(todayCheckin?.skin_rating || 3);
  const [selectedFeels, setSelectedFeels] = useState<string[]>(todayCheckin?.skin_feel || []);
  const [notes, setNotes] = useState(todayCheckin?.notes || '');

  // Update state when todayCheckin changes
  useEffect(() => {
    if (todayCheckin) {
      setSelectedRating(todayCheckin.skin_rating);
      setSelectedFeels(todayCheckin.skin_feel || []);
      setNotes(todayCheckin.notes || '');
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }, [todayCheckin]);

  const toggleFeel = (feel: string) => {
    setSelectedFeels(prev =>
      prev.includes(feel)
        ? prev.filter(f => f !== feel)
        : [...prev, feel]
    );
  };

  const handleSubmit = async () => {
    const result = await submitCheckin(selectedRating, selectedFeels, notes);
    
    if (result.success) {
      toast({
        title: 'Check-in Complete!',
        description: 'Your daily skin check-in has been saved.',
      });
      setIsEditing(false);
      setIsExpanded(false);
      onComplete?.();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to save check-in',
        variant: 'destructive',
      });
    }
  };

  const averageRating = getAverageRating(7);
  const trend = getRatingTrend();

  const getRatingLabel = (rating: number) => {
    return RATING_LABELS.find(r => r.value === rating)?.label || '';
  };

  const getRatingColor = (rating: number) => {
    return RATING_LABELS.find(r => r.value === rating)?.color || 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#CFAFA3] animate-spin" />
        </div>
      </div>
    );
  }

  // Completed state (collapsed)
  if (hasCheckedInToday() && !isEditing && !isExpanded) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-gray-900">Daily Check-in Complete</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getRatingColor(todayCheckin?.skin_rating || 3)}`}>
                  {getRatingLabel(todayCheckin?.skin_rating || 3)}
                </span>
                {todayCheckin?.skin_feel && todayCheckin.skin_feel.length > 0 && (
                  <span className="text-sm text-gray-500">
                    Feeling: {todayCheckin.skin_feel.slice(0, 2).join(', ')}
                    {todayCheckin.skin_feel.length > 2 && ` +${todayCheckin.skin_feel.length - 2}`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Edit check-in"
            >
              <Edit2 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>
          </div>
        </div>

        {/* Expanded view showing details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Today's Rating</p>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${getRatingColor(todayCheckin?.skin_rating || 3)} flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">{todayCheckin?.skin_rating}</span>
                  </div>
                  <span className="font-medium text-gray-900">{getRatingLabel(todayCheckin?.skin_rating || 3)}</span>
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">7-Day Average</p>
                <div className="flex items-center gap-2">
                  {averageRating !== null ? (
                    <>
                      <span className="text-xl font-bold text-gray-900">{averageRating}</span>
                      {trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-500" />}
                      {trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">Not enough data</span>
                  )}
                </div>
              </div>
            </div>
            {todayCheckin?.notes && (
              <div className="mt-3 p-3 bg-white/60 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{todayCheckin.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Check-in form (expanded or editing)
  return (
    <div className="bg-gradient-to-br from-[#CFAFA3]/10 via-white to-[#E8D5D0]/10 rounded-2xl p-6 border border-[#CFAFA3]/30 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-gray-900">How's Your Skin Today?</h3>
            <p className="text-sm text-gray-500">Rate your skin's feel and add notes</p>
          </div>
        </div>
        {isEditing && (
          <button
            onClick={() => {
              setIsEditing(false);
              setIsExpanded(false);
              // Reset to saved values
              if (todayCheckin) {
                setSelectedRating(todayCheckin.skin_rating);
                setSelectedFeels(todayCheckin.skin_feel || []);
                setNotes(todayCheckin.notes || '');
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Skin Satisfaction Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Skin Satisfaction Rating</label>
        <div className="flex items-center justify-between gap-2">
          {RATING_LABELS.map((rating) => (
            <button
              key={rating.value}
              onClick={() => setSelectedRating(rating.value)}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                selectedRating === rating.value
                  ? `${rating.color} text-white shadow-lg scale-105`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-2xl font-bold">{rating.value}</span>
              <span className="text-xs font-medium">{rating.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Skin Feel Tags */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">How does your skin feel? (Select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {SKIN_FEEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleFeel(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedFeels.includes(option.value)
                  ? 'bg-[#CFAFA3] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Daily Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
          rows={3}
          placeholder="Any observations about your skin today? New products tried? Environmental factors?"
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#CFAFA3]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {isEditing ? 'Update Check-in' : 'Complete Check-in'}
          </>
        )}
      </button>

      {/* Stats Preview */}
      {averageRating !== null && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Your 7-day average:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{averageRating}/5</span>
              {trend === 'improving' && (
                <span className="flex items-center gap-1 text-green-600 text-xs">
                  <TrendingUp className="w-3 h-3" /> Improving
                </span>
              )}
              {trend === 'declining' && (
                <span className="flex items-center gap-1 text-red-600 text-xs">
                  <TrendingDown className="w-3 h-3" /> Needs attention
                </span>
              )}
              {trend === 'stable' && (
                <span className="flex items-center gap-1 text-gray-500 text-xs">
                  <Minus className="w-3 h-3" /> Stable
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySkinCheckin;
