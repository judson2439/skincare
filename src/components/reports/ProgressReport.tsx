import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  User, 
  TrendingUp, 
  Camera, 
  Trophy, 
  Flame, 
  Check, 
  X, 
  ChevronDown,
  Clock,
  Star,
  Award,
  Target,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Medal,
  Crown,
  Loader2,
  ScanFace,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  image: string;
  skinType: string;
  concerns: string[];
  currentStreak: number;
  longestStreak: number;
  level: string;
  points: number;
  compliance: number;
}

interface PhotoData {
  id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'progress';
  title: string | null;
  notes: string | null;
  taken_at: string;
  client_id: string;
}

interface RoutineCompletion {
  id: string;
  completion_date: string;
  routine_type: 'morning' | 'evening';
  completed_at: string;
}

interface Badge {
  name: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

interface FaceAgeAnalysis {
  id: string;
  created_at: string;
  skin_age: number | null;
  overall_score: number | null;
  dark_circle_score: number | null;
  eye_bag_score: number | null;
  wrinkles_score: number | null;
  deep_wrinkles_score: number | null;
  eye_wrinkles_score: number | null;
  acnes_score: number | null;
  pores_score: number | null;
  pigment_score: number | null;
  photo_url: string | null;
  recommendations: string[];
}

interface FaceAgeComparison {
  firstAnalysis: FaceAgeAnalysis | null;
  latestAnalysis: FaceAgeAnalysis | null;
  totalAnalyses: number;
  improvements: {
    skin_age: number | null;
    overall_score: number | null;
    dark_circle: number | null;
    eye_bag: number | null;
    wrinkles: number | null;
    deep_wrinkles: number | null;
    eye_wrinkles: number | null;
    acnes: number | null;
    pores: number | null;
    pigment: number | null;
  } | null;
  hasSufficientData: boolean;
}

interface ProgressReportProps {
  clients: Client[];
  photos: PhotoData[];
  onClose: () => void;
}

const TIME_PERIODS = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'Last 6 Months', value: 180 },
  { label: 'Last Year', value: 365 },
  { label: 'All Time', value: 0 },
];

const BADGE_DEFINITIONS = [
  { name: "First Step", description: "Complete your first routine" },
  { name: "Week Warrior", description: "Maintain a 7-day streak" },
  { name: "Consistency Queen", description: "Maintain a 14-day streak" },
  { name: "Skincare Devotee", description: "Maintain a 30-day streak" },
  { name: "Glow Getter", description: "Complete 50 routines" },
  { name: "Radiance Master", description: "Complete 100 routines" },
];

const AWARD_LEVELS = [
  { name: 'Bronze', minPoints: 0, color: 'from-amber-600 to-amber-700' },
  { name: 'Silver', minPoints: 500, color: 'from-gray-400 to-gray-500' },
  { name: 'Gold', minPoints: 1500, color: 'from-yellow-400 to-amber-500' },
  { name: 'Platinum', minPoints: 3000, color: 'from-cyan-300 to-blue-400' },
  { name: 'Diamond', minPoints: 5000, color: 'from-purple-400 to-pink-500' },
];

// Skin metric labels for display
const SKIN_METRICS = [
  { key: 'dark_circle', label: 'Dark Circles', icon: '👁️' },
  { key: 'eye_bag', label: 'Eye Bags', icon: '👁️' },
  { key: 'wrinkles', label: 'Wrinkles', icon: '〰️' },
  { key: 'deep_wrinkles', label: 'Deep Wrinkles', icon: '〰️' },
  { key: 'eye_wrinkles', label: 'Eye Wrinkles', icon: '👁️' },
  { key: 'acnes', label: 'Acne', icon: '🔴' },
  { key: 'pores', label: 'Pores', icon: '⚪' },
  { key: 'pigment', label: 'Pigmentation', icon: '🟤' },
];

const ProgressReport: React.FC<ProgressReportProps> = ({ clients, photos, onClose }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [timePeriod, setTimePeriod] = useState(30);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // FaceAge Analysis State
  const [faceAgeComparison, setFaceAgeComparison] = useState<FaceAgeComparison | null>(null);
  const [loadingFaceAge, setLoadingFaceAge] = useState(false);
  const [faceAgeError, setFaceAgeError] = useState<string | null>(null);

  // Fetch FaceAge analysis when client or date range changes
  useEffect(() => {
    if (selectedClient) {
      fetchFaceAgeComparison();
    } else {
      setFaceAgeComparison(null);
      setFaceAgeError(null);
    }
  }, [selectedClient, timePeriod, customStartDate, customEndDate, showCustomDates]);

  // Fetch FaceAge comparison data from edge function
  const fetchFaceAgeComparison = async () => {
    if (!selectedClient) return;

    setLoadingFaceAge(true);
    setFaceAgeError(null);

    try {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase.functions.invoke('faceage-skin-scan', {
        body: {
          action: 'compare-analyses',
          clientId: selectedClient.id,
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });

      if (error) throw error;

      if (data.success) {
        setFaceAgeComparison({
          firstAnalysis: data.firstAnalysis,
          latestAnalysis: data.latestAnalysis,
          totalAnalyses: data.totalAnalyses,
          improvements: data.improvements,
          hasSufficientData: data.hasSufficientData
        });
      } else {
        throw new Error(data.error || 'Failed to fetch FaceAge data');
      }
    } catch (error: any) {
      console.error('FaceAge fetch error:', error);
      setFaceAgeError(error.message || 'Failed to load skin analysis data');
      setFaceAgeComparison(null);
    } finally {
      setLoadingFaceAge(false);
    }
  };

  // Get date range based on selected period
  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();
    
    if (showCustomDates && customStartDate && customEndDate) {
      return {
        start: new Date(customStartDate),
        end: new Date(customEndDate),
      };
    }
    
    if (timePeriod === 0) {
      startDate = new Date('2020-01-01'); // All time
    } else {
      startDate.setDate(startDate.getDate() - timePeriod);
    }
    
    return { start: startDate, end: endDate };
  };

  // Filter photos for selected client and time period
  const getFilteredPhotos = () => {
    if (!selectedClient) return [];
    
    const { start, end } = getDateRange();
    
    return photos.filter(photo => {
      const photoDate = new Date(photo.taken_at);
      return photo.client_id === selectedClient.id && 
             photoDate >= start && 
             photoDate <= end;
    });
  };

  // Get before and after photos for comparison
  const getComparisonPhotos = () => {
    const filteredPhotos = getFilteredPhotos();
    const beforePhotos = filteredPhotos.filter(p => p.photo_type === 'before');
    const afterPhotos = filteredPhotos.filter(p => p.photo_type === 'after');
    const progressPhotos = filteredPhotos.filter(p => p.photo_type === 'progress');
    
    return { beforePhotos, afterPhotos, progressPhotos, allPhotos: filteredPhotos };
  };

  // Generate mock routine completion data based on client stats
  const generateRoutineStats = () => {
    if (!selectedClient) return null;
    
    const { start, end } = getDateRange();
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const possibleRoutines = daysDiff * 2; // morning and evening
    const completedRoutines = Math.round(possibleRoutines * (selectedClient.compliance / 100));
    
    // Generate daily completion data for chart
    const dailyData: { date: string; morning: boolean; evening: boolean }[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      // Simulate completion based on compliance rate
      const morningComplete = Math.random() < (selectedClient.compliance / 100);
      const eveningComplete = Math.random() < (selectedClient.compliance / 100);
      
      dailyData.push({
        date: dateStr,
        morning: morningComplete,
        evening: eveningComplete,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      totalPossible: possibleRoutines,
      completed: completedRoutines,
      compliance: selectedClient.compliance,
      currentStreak: selectedClient.currentStreak,
      longestStreak: selectedClient.longestStreak,
      dailyData,
    };
  };

  // Get achievement milestones
  const getAchievements = () => {
    if (!selectedClient) return [];
    
    const achievements: Badge[] = BADGE_DEFINITIONS.map(badge => {
      let earned = false;
      
      switch (badge.name) {
        case "First Step":
          earned = selectedClient.points > 0;
          break;
        case "Week Warrior":
          earned = selectedClient.longestStreak >= 7;
          break;
        case "Consistency Queen":
          earned = selectedClient.longestStreak >= 14;
          break;
        case "Skincare Devotee":
          earned = selectedClient.longestStreak >= 30;
          break;
        case "Glow Getter":
          earned = selectedClient.points >= 2500; // ~50 routines
          break;
        case "Radiance Master":
          earned = selectedClient.points >= 5000; // ~100 routines
          break;
      }
      
      return {
        ...badge,
        earned,
        earnedDate: earned ? 'Achieved' : undefined,
      };
    });
    
    return achievements;
  };

  // Get level progress
  const getLevelProgress = () => {
    if (!selectedClient) return null;
    
    const currentLevel = AWARD_LEVELS.find(l => l.name === selectedClient.level) || AWARD_LEVELS[0];
    const currentIndex = AWARD_LEVELS.findIndex(l => l.name === selectedClient.level);
    const nextLevel = AWARD_LEVELS[currentIndex + 1];
    
    let progressPercent = 100;
    let pointsToNext = 0;
    
    if (nextLevel) {
      const pointsInLevel = selectedClient.points - currentLevel.minPoints;
      const levelRange = nextLevel.minPoints - currentLevel.minPoints;
      progressPercent = Math.round((pointsInLevel / levelRange) * 100);
      pointsToNext = nextLevel.minPoints - selectedClient.points;
    }
    
    return {
      currentLevel,
      nextLevel,
      progressPercent,
      pointsToNext,
    };
  };

  // Handle print
  const handlePrint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
    }, 500);
  };

  // Handle PDF download (using print to PDF)
  const handleDownloadPDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
    }, 500);
  };

  // Helper to render improvement indicator
  const renderImprovementIndicator = (value: number | null, isLowerBetter: boolean = true) => {
    if (value === null || value === 0) {
      return (
        <span className="flex items-center gap-1 text-gray-500">
          <Minus className="w-4 h-4" />
          <span>No change</span>
        </span>
      );
    }

    const isImprovement = isLowerBetter ? value > 0 : value < 0;
    const displayValue = Math.abs(value);

    if (isImprovement) {
      return (
        <span className="flex items-center gap-1 text-green-600">
          <ArrowDown className="w-4 h-4" />
          <span>-{displayValue.toFixed(1)}</span>
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-red-500">
          <ArrowUp className="w-4 h-4" />
          <span>+{displayValue.toFixed(1)}</span>
        </span>
      );
    }
  };

  // Helper to render skin age improvement
  const renderSkinAgeImprovement = (value: number | null) => {
    if (value === null || value === 0) {
      return (
        <span className="text-gray-500">No change</span>
      );
    }

    if (value > 0) {
      return (
        <span className="text-green-600 font-bold">
          {value} years younger!
        </span>
      );
    } else {
      return (
        <span className="text-amber-600">
          {Math.abs(value)} years older
        </span>
      );
    }
  };

  const routineStats = generateRoutineStats();
  const { beforePhotos, afterPhotos, progressPhotos, allPhotos } = getComparisonPhotos();
  const achievements = getAchievements();
  const levelProgress = getLevelProgress();
  const dateRange = getDateRange();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 my-auto">
        {/* Header - Hidden in print */}
        <div className="p-6 border-b border-gray-100 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#2D2A3E]" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-900">Progress Report Generator</h2>
                <p className="text-sm text-gray-500">Create comprehensive client progress reports with FaceAge analysis</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls - Hidden in print */}
        <div className="p-6 bg-gray-50 border-b border-gray-100 print:hidden">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Client</label>
              <div className="relative">
                <select
                  value={selectedClient?.id || ''}
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value);
                    setSelectedClient(client || null);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none appearance-none bg-white"
                >
                  <option value="">Choose a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Time Period Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={showCustomDates ? 'custom' : timePeriod}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setShowCustomDates(true);
                      } else {
                        setShowCustomDates(false);
                        setTimePeriod(parseInt(e.target.value));
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none appearance-none bg-white"
                  >
                    {TIME_PERIODS.map(period => (
                      <option key={period.value} value={period.value}>{period.label}</option>
                    ))}
                    <option value="custom">Custom Range</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Custom Date Range */}
            {showCustomDates && (
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {selectedClient && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={handlePrint}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              {selectedClient && (
                <button
                  onClick={fetchFaceAgeComparison}
                  disabled={loadingFaceAge}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  {loadingFaceAge ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh FaceAge Data
                </button>
              )}
            </div>
          )}
        </div>

        {/* Report Content */}
        <div ref={reportRef} className="p-6 print:p-8">
          {!selectedClient ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Client</h3>
              <p className="text-gray-500">Choose a client above to generate their progress report</p>
            </div>
          ) : (
            <div className="space-y-8 print:space-y-6">
              {/* Report Header */}
              <div className="text-center border-b border-gray-200 pb-6 print:pb-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#2D2A3E]" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-[#2D2A3E]">SkinAura PRO</h1>
                </div>
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">
                  Progress Report for {selectedClient.name}
                </h2>
                <p className="text-gray-500">
                  {dateRange.start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {dateRange.end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Client Overview */}
              <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] rounded-2xl p-6 text-white print:bg-gray-100 print:text-gray-900">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={selectedClient.image} 
                    alt={selectedClient.name} 
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold">{selectedClient.name}</h3>
                    <p className="text-white/70 print:text-gray-600">{selectedClient.skinType} Skin</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedClient.concerns.map((concern, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/20 print:bg-gray-200 text-xs rounded-full">
                          {concern}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Flame className="w-5 h-5 text-orange-400 print:text-orange-600" />
                      <span className="text-2xl font-bold">{selectedClient.currentStreak}</span>
                    </div>
                    <p className="text-xs text-white/70 print:text-gray-600">Current Streak</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="w-5 h-5 text-yellow-400 print:text-yellow-600" />
                      <span className="text-2xl font-bold">{selectedClient.longestStreak}</span>
                    </div>
                    <p className="text-xs text-white/70 print:text-gray-600">Longest Streak</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-5 h-5 text-[#CFAFA3]" />
                      <span className="text-2xl font-bold">{selectedClient.points}</span>
                    </div>
                    <p className="text-xs text-white/70 print:text-gray-600">Total Points</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="w-5 h-5 text-green-400 print:text-green-600" />
                      <span className="text-2xl font-bold">{selectedClient.compliance}%</span>
                    </div>
                    <p className="text-xs text-white/70 print:text-gray-600">Compliance</p>
                  </div>
                </div>
              </div>

              {/* FaceAge Skin Analysis Section */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 print:border-gray-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ScanFace className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-serif font-bold text-gray-900">FaceAge Skin Analysis</h3>
                  </div>
                  {faceAgeComparison && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                      {faceAgeComparison.totalAnalyses} scan{faceAgeComparison.totalAnalyses !== 1 ? 's' : ''} in period
                    </span>
                  )}
                </div>

                {/* Loading State */}
                {loadingFaceAge && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    <span className="ml-3 text-gray-600">Loading FaceAge analysis...</span>
                  </div>
                )}

                {/* Error State */}
                {faceAgeError && !loadingFaceAge && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 font-medium">Unable to load skin analysis</p>
                      <p className="text-amber-700 text-sm">{faceAgeError}</p>
                    </div>
                  </div>
                )}

                {/* No Data State */}
                {!loadingFaceAge && !faceAgeError && (!faceAgeComparison || faceAgeComparison.totalAnalyses === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <ScanFace className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No skin analysis data available for this period</p>
                    <p className="text-sm text-gray-400">Client needs to complete a FaceAge skin scan to see analysis</p>
                  </div>
                )}

                {/* FaceAge Data Display */}
                {!loadingFaceAge && !faceAgeError && faceAgeComparison && faceAgeComparison.totalAnalyses > 0 && (
                  <div className="space-y-6">
                    {/* Skin Age Comparison */}
                    {faceAgeComparison.hasSufficientData && faceAgeComparison.firstAnalysis?.skin_age && faceAgeComparison.latestAnalysis?.skin_age ? (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                        <h4 className="text-sm font-medium text-purple-800 mb-4 flex items-center gap-2">
                          <ScanFace className="w-4 h-4" />
                          Skin Age Comparison
                        </h4>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          {/* First Analysis */}
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">First Scan</p>
                            <p className="text-4xl font-bold text-purple-600">{faceAgeComparison.firstAnalysis.skin_age}</p>
                            <p className="text-sm text-gray-500">years</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(faceAgeComparison.firstAnalysis.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          {/* Improvement Arrow */}
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <ArrowRight className="w-8 h-8 text-purple-400" />
                            </div>
                            <div className="mt-2">
                              {renderSkinAgeImprovement(faceAgeComparison.improvements?.skin_age || null)}
                            </div>
                          </div>
                          
                          {/* Latest Analysis */}
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Latest Scan</p>
                            <p className="text-4xl font-bold text-green-600">{faceAgeComparison.latestAnalysis.skin_age}</p>
                            <p className="text-sm text-gray-500">years</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(faceAgeComparison.latestAnalysis.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : faceAgeComparison.latestAnalysis?.skin_age ? (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                        <h4 className="text-sm font-medium text-purple-800 mb-4">Current Skin Age</h4>
                        <div className="text-center">
                          <p className="text-5xl font-bold text-purple-600">{faceAgeComparison.latestAnalysis.skin_age}</p>
                          <p className="text-gray-500 mt-1">years</p>
                          <p className="text-xs text-gray-400 mt-2">
                            Scanned on {new Date(faceAgeComparison.latestAnalysis.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-4">
                          Complete another scan to track improvement over time
                        </p>
                      </div>
                    ) : null}

                    {/* Detailed Metrics Comparison */}
                    {faceAgeComparison.hasSufficientData && faceAgeComparison.improvements && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Skin Metrics Improvement</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {SKIN_METRICS.map(metric => {
                            const improvementValue = faceAgeComparison.improvements?.[metric.key as keyof typeof faceAgeComparison.improvements];
                            const firstValue = faceAgeComparison.firstAnalysis?.[`${metric.key}_score` as keyof FaceAgeAnalysis] as number | null;
                            const latestValue = faceAgeComparison.latestAnalysis?.[`${metric.key}_score` as keyof FaceAgeAnalysis] as number | null;
                            
                            if (firstValue === null && latestValue === null) return null;
                            
                            return (
                              <div key={metric.key} className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-500 mb-1">{metric.label}</p>
                                <div className="flex items-center justify-between">
                                  <div className="text-sm">
                                    <span className="text-gray-400">{firstValue ?? '-'}</span>
                                    <span className="mx-1 text-gray-300">→</span>
                                    <span className="font-medium text-gray-900">{latestValue ?? '-'}</span>
                                  </div>
                                  <div className="text-xs">
                                    {renderImprovementIndicator(improvementValue as number | null)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Single Scan Metrics */}
                    {!faceAgeComparison.hasSufficientData && faceAgeComparison.latestAnalysis && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Current Skin Metrics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {SKIN_METRICS.map(metric => {
                            const value = faceAgeComparison.latestAnalysis?.[`${metric.key}_score` as keyof FaceAgeAnalysis] as number | null;
                            if (value === null) return null;
                            
                            const getScoreColor = (score: number) => {
                              if (score <= 30) return 'text-green-600 bg-green-50';
                              if (score <= 60) return 'text-amber-600 bg-amber-50';
                              return 'text-red-600 bg-red-50';
                            };
                            
                            return (
                              <div key={metric.key} className={`rounded-xl p-3 ${getScoreColor(value)}`}>
                                <p className="text-xs opacity-70 mb-1">{metric.label}</p>
                                <p className="text-2xl font-bold">{value}</p>
                                <p className="text-xs opacity-60">/ 100</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {faceAgeComparison.latestAnalysis?.recommendations && faceAgeComparison.latestAnalysis.recommendations.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          AI Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {faceAgeComparison.latestAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-blue-700">
                              <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Scan Photos Comparison */}
                    {faceAgeComparison.hasSufficientData && faceAgeComparison.firstAnalysis?.photo_url && faceAgeComparison.latestAnalysis?.photo_url && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Scan Photo Comparison</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-purple-600 mb-2">First Scan</p>
                            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                              <img 
                                src={faceAgeComparison.firstAnalysis.photo_url} 
                                alt="First scan" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(faceAgeComparison.firstAnalysis.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-2">Latest Scan</p>
                            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                              <img 
                                src={faceAgeComparison.latestAnalysis.photo_url} 
                                alt="Latest scan" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(faceAgeComparison.latestAnalysis.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Routine Completion History */}
              {routineStats && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 print:border-gray-300">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-[#CFAFA3]" />
                    <h3 className="text-lg font-serif font-bold text-gray-900">Routine Completion History</h3>
                  </div>
                  
                  {/* Stats Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-green-600">{routineStats.completed}</p>
                      <p className="text-sm text-green-700">Routines Completed</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">{routineStats.totalPossible}</p>
                      <p className="text-sm text-blue-700">Total Possible</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-purple-600">{routineStats.compliance}%</p>
                      <p className="text-sm text-purple-700">Compliance Rate</p>
                    </div>
                  </div>

                  {/* Calendar Heatmap */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Completion Calendar</h4>
                    <div className="flex flex-wrap gap-1">
                      {routineStats.dailyData.slice(-42).map((day, i) => {
                        const completionLevel = (day.morning ? 1 : 0) + (day.evening ? 1 : 0);
                        return (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-sm ${
                              completionLevel === 2 ? 'bg-green-500' :
                              completionLevel === 1 ? 'bg-green-300' :
                              'bg-gray-200'
                            }`}
                            title={`${day.date}: ${completionLevel}/2 routines`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-gray-200" />
                        <span>No routines</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-green-300" />
                        <span>1 routine</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-green-500" />
                        <span>Both routines</span>
                      </div>
                    </div>
                  </div>

                  {/* Streak Info */}
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">{routineStats.currentStreak} days</p>
                        <p className="text-xs text-gray-500">Current Streak</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">{routineStats.longestStreak} days</p>
                        <p className="text-xs text-gray-500">Longest Streak</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Before/After Photos Comparison */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 print:border-gray-300 print:break-before-page">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="w-5 h-5 text-[#CFAFA3]" />
                  <h3 className="text-lg font-serif font-bold text-gray-900">Progress Photos Comparison</h3>
                </div>

                {allPhotos.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No photos available for this time period</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Before/After Side by Side */}
                    {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Before & After Comparison</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              Before
                            </p>
                            {beforePhotos.length > 0 ? (
                              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                                <img 
                                  src={beforePhotos[0].photo_url} 
                                  alt="Before" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center">
                                <p className="text-sm text-gray-400">No before photo</p>
                              </div>
                            )}
                            {beforePhotos[0]?.taken_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(beforePhotos[0].taken_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              After
                            </p>
                            {afterPhotos.length > 0 ? (
                              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                                <img 
                                  src={afterPhotos[afterPhotos.length - 1].photo_url} 
                                  alt="After" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center">
                                <p className="text-sm text-gray-400">No after photo</p>
                              </div>
                            )}
                            {afterPhotos[afterPhotos.length - 1]?.taken_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(afterPhotos[afterPhotos.length - 1].taken_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progress Photos Timeline */}
                    {progressPhotos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Progress Timeline</h4>
                        <div className="grid grid-cols-4 gap-3">
                          {progressPhotos.slice(0, 8).map((photo, i) => (
                            <div key={photo.id} className="relative">
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img 
                                  src={photo.photo_url} 
                                  alt={photo.title || `Progress ${i + 1}`} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-center">
                                {new Date(photo.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Photo Summary */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-gray-600">{beforePhotos.length} Before</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-gray-600">{afterPhotos.length} After</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-gray-600">{progressPhotos.length} Progress</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Achievement Milestones */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 print:border-gray-300">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-[#CFAFA3]" />
                  <h3 className="text-lg font-serif font-bold text-gray-900">Achievement Milestones</h3>
                </div>

                {/* Level Progress */}
                {levelProgress && (
                  <div className="bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${levelProgress.currentLevel.color} flex items-center justify-center`}>
                        {selectedClient.level === 'Diamond' ? (
                          <Trophy className="w-7 h-7 text-white" />
                        ) : selectedClient.level === 'Platinum' || selectedClient.level === 'Gold' ? (
                          <Crown className="w-7 h-7 text-white" />
                        ) : (
                          <Medal className="w-7 h-7 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Current Level</p>
                        <p className="text-xl font-bold text-gray-900">{selectedClient.level}</p>
                        <p className="text-sm text-gray-600">{selectedClient.points} points</p>
                      </div>
                    </div>
                    {levelProgress.nextLevel && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Progress to {levelProgress.nextLevel.name}</span>
                          <span className="font-medium text-gray-700">{levelProgress.pointsToNext} pts to go</span>
                        </div>
                        <div className="h-3 bg-white rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] rounded-full transition-all"
                            style={{ width: `${levelProgress.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Badges Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {achievements.map((badge, i) => (
                    <div 
                      key={i}
                      className={`p-3 rounded-xl border ${
                        badge.earned 
                          ? 'border-[#CFAFA3] bg-[#CFAFA3]/5' 
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {badge.earned ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span className={`text-sm font-medium ${badge.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                          {badge.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 pl-6">{badge.description}</p>
                      {badge.earned && (
                        <p className="text-xs text-[#CFAFA3] pl-6 mt-1">{badge.earnedDate}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Achievement Summary */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#CFAFA3]" />
                    <span className="text-sm text-gray-600">
                      {achievements.filter(a => a.earned).length} of {achievements.length} badges earned
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {achievements.map((badge, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full ${badge.earned ? 'bg-[#CFAFA3]' : 'bg-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Professional Notes Section */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 print:border-gray-300">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#CFAFA3]" />
                  <h3 className="text-lg font-serif font-bold text-gray-900">Professional Notes</h3>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 min-h-[100px] print:min-h-[150px]">
                  <p className="text-sm text-gray-400 italic">Space for professional observations and recommendations...</p>
                </div>
              </div>

              {/* Report Footer */}
              <div className="text-center pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#CFAFA3]" />
                  <span className="text-sm font-medium text-gray-600">SkinAura PRO</span>
                </div>
                <p className="text-xs text-gray-400">
                  Report generated on {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-xs text-gray-400 mt-1">Skincare is Selfcare</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #report-content, #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:break-before-page {
            break-before: page;
          }
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:text-gray-900 {
            color: #111827 !important;
          }
          .print\\:text-gray-600 {
            color: #4b5563 !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          @page {
            margin: 0.5in;
            size: letter;
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressReport;
