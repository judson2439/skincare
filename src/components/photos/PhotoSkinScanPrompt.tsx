import React, { useState, useEffect } from 'react';
import { useSkinAnalysis, SkinAnalysis } from '@/hooks/useSkinAnalysis';
import { ProgressPhoto } from '@/hooks/useProgressPhotos';
import { useToast } from '@/hooks/use-toast';
import {
  ScanFace,
  Loader2,
  X,
  Check,
  Sparkles,
  Camera,
  TrendingUp,
  AlertCircle,
  Eye,
  Target,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';

interface PhotoSkinScanPromptProps {
  photo: ProgressPhoto;
  onClose: () => void;
  onScanComplete?: (analysis: SkinAnalysis) => void;
}

const PhotoSkinScanPrompt: React.FC<PhotoSkinScanPromptProps> = ({
  photo,
  onClose,
  onScanComplete
}) => {
  const { toast } = useToast();
  const {
    generating,
    saving,
    getWidgetUrl,
    saveAnalysis,
    getScoreLevel,
    getScoreColor
  } = useSkinAnalysis();

  const [showWidget, setShowWidget] = useState(false);
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);
  const [scanComplete, setScanComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysis | null>(null);

  // Listen for messages from the FaceAge widget iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Check if message is from FaceAge
      if (event.origin.includes('getfaceage.com') || event.origin.includes('panel.getfaceage.com')) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          if (data && (data.analysis || data.results)) {
            // FaceAge analysis complete
            const analysisData = data.analysis || data.results || data;
            setShowWidget(false);
            
            // Save the analysis linked to this photo
            const result = await saveAnalysis(analysisData, photo.id, photo.photo_url);
            
            if (result.success && result.analysis) {
              setAnalysisResult(result.analysis);
              setScanComplete(true);
              toast({
                title: 'Skin Scan Complete!',
                description: 'Your skin analysis has been saved and linked to this photo.',
              });
              if (onScanComplete) {
                onScanComplete(result.analysis);
              }
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
  }, [photo.id, photo.photo_url, saveAnalysis, toast, onScanComplete]);

  // Start the scan
  const startScan = async () => {
    const result = await getWidgetUrl(photo.photo_url);
    
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
      <div className="bg-gray-50 rounded-xl p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorClass}`}>
              {icon}
            </div>
            <span className="text-xs font-medium text-gray-600">{label}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900">{score ?? 'N/A'}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
    );
  };

  // Render the initial prompt
  const renderPrompt = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-serif font-bold text-gray-900">Photo Uploaded!</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Preview */}
        <div className="relative rounded-xl overflow-hidden mb-4">
          <img 
            src={photo.photo_url} 
            alt={photo.title || 'Progress photo'} 
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              photo.photo_type === 'before' ? 'bg-blue-500 text-white' :
              photo.photo_type === 'after' ? 'bg-green-500 text-white' :
              'bg-purple-500 text-white'
            }`}>
              {photo.photo_type.charAt(0).toUpperCase() + photo.photo_type.slice(1)}
            </span>
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p className="text-white text-sm font-medium">
              {photo.title || new Date(photo.taken_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Skin Scan Offer */}
        <div className="bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-xl p-4 border border-[#CFAFA3]/20 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#B89A8E] flex items-center justify-center flex-shrink-0">
              <ScanFace className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Run Skin Analysis?</h4>
              <p className="text-sm text-gray-600">
                Get detailed skin metrics for this photo to track your progress over time. 
                The analysis will be linked to this photo for easy comparison.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-500" />
            <span>Track skin age, wrinkles, acne, pores & more</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-500" />
            <span>Compare metrics between photos</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-500" />
            <span>Get personalized recommendations</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Skip for Now
          </button>
          <button
            onClick={startScan}
            disabled={generating}
            className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing...
              </>
            ) : (
              <>
                <ScanFace className="w-4 h-4" /> Run Skin Scan
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-3">
          You can always run a skin scan later from your progress photos
        </p>
      </div>
    </div>
  );

  // Render the widget
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
          <div className="absolute top-4 left-4 z-10 bg-white/90 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#CFAFA3]" />
            <span className="text-sm font-medium text-gray-700">Analyzing your photo...</span>
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

  // Render the results
  const renderResults = () => {
    if (!scanComplete || !analysisResult) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-gray-900">Scan Complete!</h3>
                <p className="text-sm text-gray-500">Analysis linked to your photo</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Photo with Analysis Badge */}
          <div className="relative rounded-xl overflow-hidden mb-4">
            <img 
              src={photo.photo_url} 
              alt={photo.title || 'Progress photo'} 
              className="w-full h-40 object-cover"
            />
            <div className="absolute top-3 right-3 px-2 py-1 bg-[#CFAFA3] text-white text-xs rounded-full flex items-center gap-1">
              <ScanFace className="w-3 h-3" /> Analyzed
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-gradient-to-r from-[#2D2A3E] to-[#3D3A4E] rounded-xl p-4 text-white mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Overall Skin Health</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{analysisResult.overall_score ?? 'N/A'}</span>
                  <span className="text-white/60">/100</span>
                </div>
              </div>
              {analysisResult.skin_age && (
                <div className="text-right">
                  <p className="text-white/60 text-sm">Skin Age</p>
                  <p className="text-3xl font-bold">{analysisResult.skin_age}</p>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {renderScoreCard('Wrinkles', analysisResult.wrinkles_score, <Target className="w-3 h-3" />)}
            {renderScoreCard('Acne', analysisResult.acnes_score, <AlertCircle className="w-3 h-3" />)}
            {renderScoreCard('Pores', analysisResult.pores_score, <Zap className="w-3 h-3" />)}
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl mb-4">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              This analysis is now linked to your photo. When comparing photos, you'll see these metrics side by side.
            </p>
          </div>

          {/* Recommendations Preview */}
          {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Top Recommendation</h4>
              <div className="flex items-start gap-2 p-3 bg-[#CFAFA3]/10 rounded-xl">
                <Sparkles className="w-4 h-4 text-[#CFAFA3] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{analysisResult.recommendations[0]}</p>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Done <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Main render
  if (scanComplete && analysisResult) {
    return renderResults();
  }

  if (showWidget) {
    return renderWidget();
  }

  return renderPrompt();
};

export default PhotoSkinScanPrompt;
