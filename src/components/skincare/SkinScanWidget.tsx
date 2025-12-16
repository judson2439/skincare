import React, { useState, useEffect } from 'react';
import { useSkinAnalysis, SkinAnalysis } from '@/hooks/useSkinAnalysis';
import { useToast } from '@/hooks/use-toast';
import {
  ScanFace,
  Loader2,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Eye,
  Sparkles,
  Calendar,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  History,
  Target,
  Zap,
  Info
} from 'lucide-react';

interface SkinScanWidgetProps {
  onClose?: () => void;
  showHistory?: boolean;
}

const SkinScanWidget: React.FC<SkinScanWidgetProps> = ({ onClose, showHistory = true }) => {
  const { toast } = useToast();
  const {
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
    compareAnalyses,
    refreshAnalyses
  } = useSkinAnalysis();

  const [showWidget, setShowWidget] = useState(false);
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SkinAnalysis | null>(null);
  const [pendingAnalysisData, setPendingAnalysisData] = useState<Record<string, any> | null>(null);

  // Listen for messages from the FaceAge widget iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Check if message is from FaceAge
      if (event.origin.includes('getfaceage.com') || event.origin.includes('panel.getfaceage.com')) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          if (data && (data.analysis || data.results)) {
            // FaceAge analysis complete
            setPendingAnalysisData(data.analysis || data.results || data);
            setShowWidget(false);
            
            // Save the analysis
            const result = await saveAnalysis(data.analysis || data.results || data);
            
            if (result.success) {
              toast({
                title: 'Skin Scan Complete!',
                description: 'Your skin analysis has been saved.',
              });
            } else {
              toast({
                title: 'Error',
                description: result.error || 'Failed to save analysis',
                variant: 'destructive'
              });
            }
          }
        } catch (e) {
          console.error('Error parsing FaceAge message:', e);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [saveAnalysis, toast]);

  // Start a new scan
  const startScan = async () => {
    const result = await getWidgetUrl();
    
    if (result.success && result.widgetUrl) {
      setWidgetUrl(result.widgetUrl);
      setShowWidget(true);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to start skin scan',
        variant: 'destructive'
      });
    }
  };

  // Render score card
  const renderScoreCard = (label: string, score: number | null, icon: React.ReactNode) => {
    const level = getScoreLevel(score);
    const colorClass = getScoreColor(score);
    
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
              {icon}
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
            {level}
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-gray-900">{score ?? 'N/A'}</span>
          <span className="text-sm text-gray-500 mb-1">/100</span>
        </div>
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              level === 'low' ? 'bg-green-500' :
              level === 'moderate' ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${score ?? 0}%` }}
          />
        </div>
      </div>
    );
  };

  // Render comparison indicator
  const renderComparisonIndicator = (change: number, improved: boolean) => {
    if (Math.abs(change) < 1) {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
    if (improved) {
      return <TrendingDown className="w-4 h-4 text-green-500" />;
    }
    return <TrendingUp className="w-4 h-4 text-red-500" />;
  };

  // Render latest analysis
  const renderLatestAnalysis = () => {
    if (!latestAnalysis) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
            <ScanFace className="w-10 h-10 text-[#CFAFA3]" />
          </div>
          <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">No Skin Scans Yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Get a detailed analysis of your skin health using AI-powered technology
          </p>
          <button
            onClick={startScan}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Preparing...
              </>
            ) : (
              <>
                <ScanFace className="w-5 h-5" /> Start Your First Scan
              </>
            )}
          </button>
        </div>
      );
    }

    const comparison = analyses.length > 1 ? compareAnalyses(analyses[1], analyses[0]) : null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-gray-900">Latest Skin Analysis</h3>
            <p className="text-sm text-gray-500">
              {new Date(latestAnalysis.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showHistory && analyses.length > 1 && (
              <button
                onClick={() => setShowHistoryView(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" /> History
              </button>
            )}
            <button
              onClick={startScan}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              New Scan
            </button>
          </div>
        </div>

        {/* Overall Score */}
        {latestAnalysis.overall_score !== null && (
          <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm mb-1">Overall Skin Health</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{latestAnalysis.overall_score}</span>
                  <span className="text-white/60">/100</span>
                </div>
                {latestAnalysis.skin_age && (
                  <p className="text-white/80 mt-2">
                    Estimated Skin Age: <span className="font-bold">{latestAnalysis.skin_age}</span> years
                  </p>
                )}
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-[#CFAFA3] flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-[#CFAFA3]" />
              </div>
            </div>
            {comparison && comparison.overall_score && (
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                {renderComparisonIndicator(comparison.overall_score.change, comparison.overall_score.improved)}
                <span className="text-sm text-white/70">
                  {Math.abs(comparison.overall_score.change).toFixed(0)} points {comparison.overall_score.improved ? 'improvement' : 'change'} since last scan
                </span>
              </div>
            )}
          </div>
        )}

        {/* Score Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderScoreCard('Dark Circles', latestAnalysis.dark_circle_score, <Eye className="w-4 h-4" />)}
          {renderScoreCard('Eye Bags', latestAnalysis.eye_bag_score, <Eye className="w-4 h-4" />)}
          {renderScoreCard('Wrinkles', latestAnalysis.wrinkles_score, <Target className="w-4 h-4" />)}
          {renderScoreCard('Acne', latestAnalysis.acnes_score, <AlertCircle className="w-4 h-4" />)}
          {renderScoreCard('Pores', latestAnalysis.pores_score, <Zap className="w-4 h-4" />)}
          {renderScoreCard('Pigmentation', latestAnalysis.pigment_score, <Sparkles className="w-4 h-4" />)}
          {renderScoreCard('Eye Wrinkles', latestAnalysis.eye_wrinkles_score, <Eye className="w-4 h-4" />)}
          {renderScoreCard('Deep Wrinkles', latestAnalysis.deep_wrinkles_score, <Target className="w-4 h-4" />)}
        </div>

        {/* Recommendations */}
        {latestAnalysis.recommendations && latestAnalysis.recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-2xl p-6 border border-[#CFAFA3]/20">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-[#CFAFA3]" />
              <h4 className="font-serif font-bold text-gray-900">Personalized Recommendations</h4>
            </div>
            <ul className="space-y-3">
              {latestAnalysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#CFAFA3] text-white flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-gray-700">{rec}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Render history view
  const renderHistoryView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistoryView(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <h3 className="font-serif font-bold text-lg text-gray-900">Scan History</h3>
        </div>
        <span className="text-sm text-gray-500">{analyses.length} scans</span>
      </div>

      <div className="space-y-3">
        {analyses.map((analysis, idx) => (
          <div
            key={analysis.id}
            onClick={() => setSelectedAnalysis(analysis)}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#E8D5D0] flex items-center justify-center">
                  <ScanFace className="w-6 h-6 text-[#2D2A3E]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Skin Scan #{analyses.length - idx}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(analysis.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#CFAFA3]">{analysis.overall_score ?? 'N/A'}</p>
                <p className="text-xs text-gray-500">Overall Score</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render selected analysis detail
  const renderAnalysisDetail = () => {
    if (!selectedAnalysis) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-serif font-bold text-gray-900">Skin Analysis Details</h3>
              <p className="text-sm text-gray-500">
                {new Date(selectedAnalysis.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={() => setSelectedAnalysis(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Overall Score */}
          <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] rounded-xl p-4 text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Overall Score</p>
                <p className="text-3xl font-bold">{selectedAnalysis.overall_score ?? 'N/A'}</p>
              </div>
              {selectedAnalysis.skin_age && (
                <div className="text-right">
                  <p className="text-white/60 text-sm">Skin Age</p>
                  <p className="text-3xl font-bold">{selectedAnalysis.skin_age}</p>
                </div>
              )}
            </div>
          </div>

          {/* Scores Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { key: 'dark_circle_score', label: 'Dark Circles' },
              { key: 'eye_bag_score', label: 'Eye Bags' },
              { key: 'wrinkles_score', label: 'Wrinkles' },
              { key: 'acnes_score', label: 'Acne' },
              { key: 'pores_score', label: 'Pores' },
              { key: 'pigment_score', label: 'Pigmentation' },
            ].map(({ key, label }) => {
              const score = (selectedAnalysis as any)[key];
              const level = getScoreLevel(score);
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{score ?? 'N/A'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getScoreColor(score)}`}>
                      {level}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          {selectedAnalysis.recommendations && selectedAnalysis.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {selectedAnalysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setSelectedAnalysis(null)}
            className="w-full mt-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  // Render widget iframe
  const renderWidget = () => {
    if (!showWidget || !widgetUrl) return null;

    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-2xl h-[80vh] bg-white rounded-2xl overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowWidget(false)}
              className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe
            src={widgetUrl}
            className="w-full h-full border-0"
            allow="camera"
            title="SkinAura AI Skin Analysis"
          />
        </div>
      </div>
    );
  };

  if (loading) {

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHistoryView ? renderHistoryView() : renderLatestAnalysis()}
      {renderWidget()}
      {renderAnalysisDetail()}
    </div>
  );
};

export default SkinScanWidget;
