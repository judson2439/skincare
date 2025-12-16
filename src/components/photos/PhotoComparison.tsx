import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useProgressPhotos, PhotoWithComments } from '@/hooks/useProgressPhotos';
import { useTreatmentHistory, Treatment } from '@/hooks/useTreatmentHistory';
import { useSkinAnalysis, SkinAnalysis } from '@/hooks/useSkinAnalysis';
import { useToast } from '@/hooks/use-toast';
import {
  Camera,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Download,
  Share2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Image,
  Layers,
  SplitSquareVertical,
  ArrowLeftRight,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Check,
  Copy,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  Printer,
  Activity,
  Minus
} from 'lucide-react';

interface PhotoComparisonProps {
  clientId: string;
  clientName: string;
}

type ComparisonMode = 'side-by-side' | 'slider' | 'overlay';

interface PhotoPair {
  before: PhotoWithComments | null;
  after: PhotoWithComments | null;
}

interface SkinScoreComparison {
  label: string;
  key: string;
  before: number | null;
  after: number | null;
  change: number | null;
  improved: boolean | null;
}

const PhotoComparison: React.FC<PhotoComparisonProps> = ({ clientId, clientName }) => {
  const progressPhotos = useProgressPhotos();
  const treatmentHistory = useTreatmentHistory();
  const { getClientAnalyses, getScoreLevel, getScoreColor, getScoreLabel } = useSkinAnalysis();
  const { toast } = useToast();

  // State
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('slider');
  const [selectedBefore, setSelectedBefore] = useState<PhotoWithComments | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<PhotoWithComments | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPhotoSelector, setShowPhotoSelector] = useState<'before' | 'after' | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportLink, setReportLink] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('comparison');
  const [showSkinScores, setShowSkinScores] = useState(true);
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Skin analysis state
  const [clientAnalyses, setClientAnalyses] = useState<SkinAnalysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [beforeAnalysis, setBeforeAnalysis] = useState<SkinAnalysis | null>(null);
  const [afterAnalysis, setAfterAnalysis] = useState<SkinAnalysis | null>(null);

  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Fetch skin analyses when component mounts
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!clientId) return;
      
      setLoadingAnalyses(true);
      try {
        const analyses = await getClientAnalyses(clientId);
        setClientAnalyses(analyses);
      } catch (error) {
        console.error('Error fetching skin analyses:', error);
      } finally {
        setLoadingAnalyses(false);
      }
    };
    
    fetchAnalyses();
  }, [clientId, getClientAnalyses]);

  // Find closest skin analysis to a photo date
  const findClosestAnalysis = useCallback((photoDate: string): SkinAnalysis | null => {
    if (clientAnalyses.length === 0) return null;
    
    const photoTime = new Date(photoDate).getTime();
    let closest: SkinAnalysis | null = null;
    let minDiff = Infinity;
    
    clientAnalyses.forEach(analysis => {
      const analysisTime = new Date(analysis.created_at).getTime();
      const diff = Math.abs(analysisTime - photoTime);
      // Only consider analyses within 7 days of the photo
      if (diff < minDiff && diff < 7 * 24 * 60 * 60 * 1000) {
        minDiff = diff;
        closest = analysis;
      }
    });
    
    return closest;
  }, [clientAnalyses]);

  // Update before/after analyses when photos change
  useEffect(() => {
    if (selectedBefore) {
      setBeforeAnalysis(findClosestAnalysis(selectedBefore.taken_at));
    } else {
      setBeforeAnalysis(null);
    }
  }, [selectedBefore, findClosestAnalysis]);

  useEffect(() => {
    if (selectedAfter) {
      setAfterAnalysis(findClosestAnalysis(selectedAfter.taken_at));
    } else {
      setAfterAnalysis(null);
    }
  }, [selectedAfter, findClosestAnalysis]);

  // Get client photos
  const clientPhotos = useMemo(() => {
    return progressPhotos.getClientPhotos(clientId).sort(
      (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
    );
  }, [progressPhotos, clientId]);

  // Get client treatments
  const clientTreatments = useMemo(() => {
    return treatmentHistory.getClientTreatments(clientId);
  }, [treatmentHistory, clientId]);

  // Filter photos by date range
  const filteredPhotos = useMemo(() => {
    return clientPhotos.filter(photo => {
      const photoDate = new Date(photo.taken_at);
      if (startDate && photoDate < new Date(startDate)) return false;
      if (endDate && photoDate > new Date(endDate)) return false;
      return true;
    });
  }, [clientPhotos, startDate, endDate]);

  // Get photos with treatments (photos that have associated treatments)
  const photosWithTreatments = useMemo(() => {
    return filteredPhotos.map(photo => {
      const photoDate = new Date(photo.taken_at).toISOString().split('T')[0];
      const relatedTreatment = clientTreatments.find(t => t.treatment_date === photoDate);
      return { photo, treatment: relatedTreatment };
    });
  }, [filteredPhotos, clientTreatments]);

  // Auto-select first and last photos if none selected
  useEffect(() => {
    if (filteredPhotos.length >= 2 && !selectedBefore && !selectedAfter) {
      setSelectedBefore(filteredPhotos[0]);
      setSelectedAfter(filteredPhotos[filteredPhotos.length - 1]);
    }
  }, [filteredPhotos, selectedBefore, selectedAfter]);

  // Calculate skin score comparisons
  const skinScoreComparisons = useMemo((): SkinScoreComparison[] => {
    const scoreKeys = [
      { key: 'skin_age', label: 'Skin Age' },
      { key: 'overall_score', label: 'Overall Health' },
      { key: 'dark_circle_score', label: 'Dark Circles' },
      { key: 'eye_bag_score', label: 'Eye Bags' },
      { key: 'wrinkles_score', label: 'Wrinkles' },
      { key: 'acnes_score', label: 'Acne' },
      { key: 'pores_score', label: 'Pores' },
      { key: 'pigment_score', label: 'Pigmentation' }
    ];

    return scoreKeys.map(({ key, label }) => {
      const beforeVal = beforeAnalysis ? (beforeAnalysis as any)[key] : null;
      const afterVal = afterAnalysis ? (afterAnalysis as any)[key] : null;
      const change = beforeVal !== null && afterVal !== null ? afterVal - beforeVal : null;
      
      // For most metrics, lower is better (less wrinkles, less acne, etc.)
      // Exception: overall_score where higher is better
      let improved: boolean | null = null;
      if (change !== null) {
        if (key === 'overall_score') {
          improved = change > 0;
        } else {
          improved = change < 0;
        }
      }

      return { label, key, before: beforeVal, after: afterVal, change, improved };
    });
  }, [beforeAnalysis, afterAnalysis]);

  // Handle slider drag
  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) return;
    isDragging.current = true;
    e.preventDefault();
  }, [zoomLevel]);

  const handleSliderMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleSliderMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Handle touch events for mobile
  const handleSliderTouchMove = useCallback((e: TouchEvent) => {
    if (!sliderRef.current || zoomLevel > 1) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [zoomLevel]);

  // Pan handlers for zoomed view
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  }, [zoomLevel, panPosition]);

  const handlePanMove = useCallback((e: MouseEvent) => {
    if (!isPanning || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  }, [isPanning, panStart, zoomLevel]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleSliderMouseMove);
    document.addEventListener('mouseup', handleSliderMouseUp);
    document.addEventListener('touchmove', handleSliderTouchMove as any);
    document.addEventListener('touchend', handleSliderMouseUp);
    document.addEventListener('mousemove', handlePanMove);
    document.addEventListener('mouseup', handlePanEnd);

    return () => {
      document.removeEventListener('mousemove', handleSliderMouseMove);
      document.removeEventListener('mouseup', handleSliderMouseUp);
      document.removeEventListener('touchmove', handleSliderTouchMove as any);
      document.removeEventListener('touchend', handleSliderMouseUp);
      document.removeEventListener('mousemove', handlePanMove);
      document.removeEventListener('mouseup', handlePanEnd);
    };
  }, [handleSliderMouseMove, handleSliderMouseUp, handleSliderTouchMove, handlePanMove, handlePanEnd]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate days between photos
  const daysBetween = useMemo(() => {
    if (!selectedBefore || !selectedAfter) return 0;
    const before = new Date(selectedBefore.taken_at);
    const after = new Date(selectedAfter.taken_at);
    return Math.round((after.getTime() - before.getTime()) / (1000 * 60 * 60 * 24));
  }, [selectedBefore, selectedAfter]);

  // Generate progress report
  const generateProgressReport = async () => {
    setGeneratingReport(true);

    // Create report content
    const reportData = {
      clientName,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: startDate || filteredPhotos[0]?.taken_at,
        end: endDate || filteredPhotos[filteredPhotos.length - 1]?.taken_at,
      },
      totalPhotos: filteredPhotos.length,
      daysCovered: daysBetween,
      photos: filteredPhotos.map(p => ({
        date: p.taken_at,
        type: p.photo_type,
        title: p.title,
        notes: p.notes,
        url: p.photo_url,
      })),
      treatments: clientTreatments.filter(t => {
        if (startDate && t.treatment_date < startDate) return false;
        if (endDate && t.treatment_date > endDate) return false;
        return true;
      }).map(t => ({
        date: t.treatment_date,
        type: t.treatment_type,
        notes: t.notes,
        results: t.results_summary,
      })),
    };

    // Generate text report for download
    let reportContent = `SKIN PROGRESS REPORT\n`;
    reportContent += `====================\n\n`;
    reportContent += `Client: ${clientName}\n`;
    reportContent += `Generated: ${new Date().toLocaleDateString()}\n`;
    if (reportData.dateRange.start && reportData.dateRange.end) {
      reportContent += `Period: ${formatDate(reportData.dateRange.start)} - ${formatDate(reportData.dateRange.end)}\n`;
    }
    reportContent += `Duration: ${daysBetween} days\n\n`;

    // Add skin analysis scores if available
    if (beforeAnalysis || afterAnalysis) {
      reportContent += `SKIN ANALYSIS SCORES (FaceAge)\n`;
      reportContent += `------------------------------\n`;
      
      skinScoreComparisons.forEach(score => {
        if (score.before !== null || score.after !== null) {
          reportContent += `\n${score.label}:\n`;
          if (score.before !== null) reportContent += `  Before: ${score.before}\n`;
          if (score.after !== null) reportContent += `  After: ${score.after}\n`;
          if (score.change !== null) {
            const changeStr = score.change > 0 ? `+${score.change}` : score.change.toString();
            const statusStr = score.improved ? '(Improved)' : score.improved === false ? '(Needs attention)' : '';
            reportContent += `  Change: ${changeStr} ${statusStr}\n`;
          }
        }
      });
      reportContent += '\n';
    }

    reportContent += `SUMMARY\n`;
    reportContent += `-------\n`;
    reportContent += `Total Progress Photos: ${filteredPhotos.length}\n`;
    reportContent += `Treatments During Period: ${reportData.treatments.length}\n\n`;

    reportContent += `PHOTO TIMELINE\n`;
    reportContent += `--------------\n`;
    filteredPhotos.forEach((photo, i) => {
      reportContent += `\n${i + 1}. ${formatDate(photo.taken_at)} - ${photo.photo_type.toUpperCase()}\n`;
      if (photo.title) reportContent += `   Title: ${photo.title}\n`;
      if (photo.notes) reportContent += `   Notes: ${photo.notes}\n`;
    });

    if (reportData.treatments.length > 0) {
      reportContent += `\n\nTREATMENT HISTORY\n`;
      reportContent += `-----------------\n`;
      reportData.treatments.forEach((t, i) => {
        reportContent += `\n${i + 1}. ${formatDate(t.date)} - ${t.type}\n`;
        if (t.notes) reportContent += `   Notes: ${t.notes}\n`;
        if (t.results) reportContent += `   Results: ${t.results}\n`;
      });
    }

    reportContent += `\n\n---\n`;
    reportContent += `Generated by SkinAura PRO\n`;

    // Download report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-report-${clientName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Generate shareable link (simulated)
    const shareableId = Math.random().toString(36).substring(7);
    setReportLink(`https://skinaurapro.com/reports/${shareableId}`);

    setGeneratingReport(false);
    toast({ title: 'Report Generated', description: 'Your progress report has been downloaded' });
  };

  // Copy report link
  const copyReportLink = () => {
    if (reportLink) {
      navigator.clipboard.writeText(reportLink);
      toast({ title: 'Link Copied', description: 'Report link copied to clipboard' });
    }
  };

  // Swap before/after photos
  const swapPhotos = () => {
    const temp = selectedBefore;
    setSelectedBefore(selectedAfter);
    setSelectedAfter(temp);
  };

  // Reset slider
  const resetSlider = () => {
    setSliderPosition(50);
  };

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Render mini skin score badge
  const renderMiniSkinScore = (analysis: SkinAnalysis | null) => {
    if (!analysis) return null;
    
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
        <Activity className="w-3 h-3" />
        <span>Age: {analysis.skin_age || '-'}</span>
      </div>
    );
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      {/* Header */}
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => toggleSection('comparison')}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#CFAFA3]" />
          <h4 className="font-semibold text-gray-900">Photo Comparison</h4>
          {clientPhotos.length > 0 && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              {clientPhotos.length} photos
            </span>
          )}
          {clientAnalyses.length > 0 && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              {clientAnalyses.length} skin scans
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {clientPhotos.length >= 2 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowReportModal(true); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-[#CFAFA3] hover:bg-[#CFAFA3]/10 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" /> Progress Report
            </button>
          )}
          {expandedSection === 'comparison' ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {expandedSection === 'comparison' && (
        <>
          {/* Empty State */}
          {clientPhotos.length < 2 && (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-gray-600 mb-2">Not enough photos for comparison</p>
              <p className="text-sm text-gray-400">
                {clientPhotos.length === 0 
                  ? `${clientName} hasn't uploaded any progress photos yet`
                  : 'At least 2 photos are needed for comparison'
                }
              </p>
            </div>
          )}

          {clientPhotos.length >= 2 && (
            <>
              {/* Date Range Filter */}
              <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">From:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">To:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-xs text-[#CFAFA3] hover:underline"
                  >
                    Clear
                  </button>
                )}
                <span className="text-xs text-gray-500 ml-auto">
                  {filteredPhotos.length} photos in range
                </span>
              </div>

              {/* Comparison Mode Selector */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-gray-500">View:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setComparisonMode('slider')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      comparisonMode === 'slider' 
                        ? 'bg-white text-[#CFAFA3] shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <SplitSquareVertical className="w-3.5 h-3.5" /> Slider
                  </button>
                  <button
                    onClick={() => setComparisonMode('side-by-side')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      comparisonMode === 'side-by-side' 
                        ? 'bg-white text-[#CFAFA3] shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Side by Side
                  </button>
                </div>
                
                <div className="ml-auto flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      title="Zoom out"
                    >
                      <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <span className="text-xs text-gray-600 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 4}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      title="Zoom in"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>
                  <button
                    onClick={swapPhotos}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Swap photos"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                  {comparisonMode === 'slider' && (
                    <button
                      onClick={resetSlider}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Reset slider"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowFullscreen(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Photo Selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Before Photo Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-500">Before Photo</label>
                    {renderMiniSkinScore(beforeAnalysis)}
                  </div>
                  <button
                    onClick={() => setShowPhotoSelector('before')}
                    className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#CFAFA3] transition-colors overflow-hidden relative group"
                  >
                    {selectedBefore ? (
                      <>
                        <img 
                          src={selectedBefore.photo_url} 
                          alt="Before" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-medium">Change</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                          <p className="text-white text-xs font-medium truncate">
                            {selectedBefore.title || `${selectedBefore.photo_type.charAt(0).toUpperCase() + selectedBefore.photo_type.slice(1)} Photo`}
                          </p>
                          <p className="text-white/70 text-xs">
                            {formatDate(selectedBefore.taken_at)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Image className="w-6 h-6 mb-1" />
                        <span className="text-xs">Select photo</span>
                      </div>
                    )}
                  </button>
                </div>

                {/* After Photo Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-500">After Photo</label>
                    {renderMiniSkinScore(afterAnalysis)}
                  </div>
                  <button
                    onClick={() => setShowPhotoSelector('after')}
                    className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#CFAFA3] transition-colors overflow-hidden relative group"
                  >
                    {selectedAfter ? (
                      <>
                        <img 
                          src={selectedAfter.photo_url} 
                          alt="After" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-medium">Change</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                          <p className="text-white text-xs font-medium truncate">
                            {selectedAfter.title || `${selectedAfter.photo_type.charAt(0).toUpperCase() + selectedAfter.photo_type.slice(1)} Photo`}
                          </p>
                          <p className="text-white/70 text-xs">
                            {formatDate(selectedAfter.taken_at)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Image className="w-6 h-6 mb-1" />
                        <span className="text-xs">Select photo</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Skin Score Improvements */}
              {showSkinScores && beforeAnalysis && afterAnalysis && (
                <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-600" />
                      <h5 className="text-sm font-medium text-gray-900">Skin Analysis Changes</h5>
                    </div>
                    <button
                      onClick={() => setShowSkinScores(!showSkinScores)}
                      className="text-xs text-purple-600 hover:underline"
                    >
                      Hide
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {skinScoreComparisons.slice(0, 4).map((score) => {
                      if (score.before === null && score.after === null) return null;
                      
                      return (
                        <div key={score.key} className="bg-white rounded-lg p-2 text-center">
                          <p className="text-[10px] text-gray-500 mb-1">{score.label}</p>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-bold text-gray-900">
                              {score.after !== null ? score.after : '-'}
                            </span>
                            {score.change !== null && (
                              <span className={`text-[10px] ${
                                score.improved ? 'text-green-600' : 
                                score.improved === false ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {score.improved ? (
                                  <TrendingDown className="w-3 h-3 inline" />
                                ) : score.improved === false ? (
                                  <TrendingUp className="w-3 h-3 inline" />
                                ) : null}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Days Between Badge */}
              {selectedBefore && selectedAfter && daysBetween > 0 && (
                <div className="flex items-center justify-center mb-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CFAFA3]/10 to-purple-50 rounded-full">
                    <Clock className="w-4 h-4 text-[#CFAFA3]" />
                    <span className="text-sm font-medium text-gray-700">
                      {daysBetween} days of progress
                    </span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              )}

              {/* Comparison View */}
              {selectedBefore && selectedAfter && (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-900">
                  {comparisonMode === 'slider' ? (
                    /* Slider Comparison */
                    <div 
                      ref={sliderRef}
                      className={`relative h-80 select-none ${zoomLevel > 1 ? 'cursor-grab' : 'cursor-ew-resize'}`}
                      onMouseDown={zoomLevel > 1 ? handlePanStart : handleSliderMouseDown}
                      onTouchStart={() => {}}
                      style={{
                        transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                        transformOrigin: 'center center'
                      }}
                    >
                      {/* After Image (Background) */}
                      <img
                        src={selectedAfter.photo_url}
                        alt="After"
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                      />
                      
                      {/* Before Image (Clipped) */}
                      <div 
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <img
                          src={selectedBefore.photo_url}
                          alt="Before"
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ 
                            width: sliderRef.current ? `${sliderRef.current.offsetWidth}px` : '100%',
                            maxWidth: 'none'
                          }}
                          draggable={false}
                        />
                      </div>

                      {/* Slider Handle */}
                      {zoomLevel === 1 && (
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <ArrowLeftRight className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                      )}

                      {/* Labels */}
                      <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded font-medium">
                        Before
                      </div>
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded font-medium">
                        After
                      </div>
                    </div>
                  ) : (
                    /* Side by Side Comparison */
                    <div 
                      className="grid grid-cols-2 h-80"
                      style={{
                        transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                        transformOrigin: 'center center'
                      }}
                      onMouseDown={zoomLevel > 1 ? handlePanStart : undefined}
                    >
                      <div className="relative">
                        <img
                          src={selectedBefore.photo_url}
                          alt="Before"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded font-medium">
                          Before - {formatDate(selectedBefore.taken_at)}
                        </div>
                      </div>
                      <div className="relative border-l border-white/20">
                        <img
                          src={selectedAfter.photo_url}
                          alt="After"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded font-medium">
                          After - {formatDate(selectedAfter.taken_at)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Photo Timeline */}
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#CFAFA3]" />
                  Photo Timeline
                </h5>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {filteredPhotos.map((photo, index) => (
                    <div key={photo.id} className="flex-shrink-0">
                      <button
                        onClick={() => {
                          if (!selectedBefore) {
                            setSelectedBefore(photo);
                          } else if (!selectedAfter) {
                            setSelectedAfter(photo);
                          } else {
                            // Replace the one that's older
                            if (new Date(selectedBefore.taken_at) < new Date(selectedAfter.taken_at)) {
                              setSelectedBefore(photo);
                            } else {
                              setSelectedAfter(photo);
                            }
                          }
                        }}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedBefore?.id === photo.id 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : selectedAfter?.id === photo.id
                            ? 'border-green-500 ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-[#CFAFA3]'
                        }`}
                        title={photo.title || `${photo.photo_type} - ${formatDate(photo.taken_at)}`}
                      >
                        <img
                          src={photo.photo_url}
                          alt={photo.title || `Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Photo name overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/70 to-transparent">
                          <p className="text-white text-[10px] font-medium truncate text-center">
                            {photo.title || photo.photo_type}
                          </p>
                        </div>
                      </button>
                      {/* Date below thumbnail */}
                      <p className="text-[10px] text-gray-500 text-center mt-1 truncate w-20">
                        {new Date(photo.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded border-2 border-blue-500"></div> Before
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded border-2 border-green-500"></div> After
                  </span>
                </div>
              </div>
            </>
          )}
        </>
      )}


      {/* Photo Selector Modal */}
      {showPhotoSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900">
                Select {showPhotoSelector === 'before' ? 'Before' : 'After'} Photo
              </h4>
              <button 
                onClick={() => setShowPhotoSelector(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-3 gap-3">
                {filteredPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      if (showPhotoSelector === 'before') {
                        setSelectedBefore(photo);
                      } else {
                        setSelectedAfter(photo);
                      }
                      setShowPhotoSelector(null);
                    }}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      (showPhotoSelector === 'before' && selectedBefore?.id === photo.id) ||
                      (showPhotoSelector === 'after' && selectedAfter?.id === photo.id)
                        ? 'border-[#CFAFA3] ring-2 ring-[#CFAFA3]/30'
                        : 'border-gray-200 hover:border-[#CFAFA3]'
                    }`}
                  >
                    <img
                      src={photo.photo_url}
                      alt={photo.title || 'Photo'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white text-xs font-medium truncate">
                        {photo.title || `${photo.photo_type.charAt(0).toUpperCase() + photo.photo_type.slice(1)} Photo`}
                      </p>
                      <p className="text-white/70 text-xs">
                        {formatDate(photo.taken_at)}
                      </p>
                    </div>
                    {((showPhotoSelector === 'before' && selectedBefore?.id === photo.id) ||
                      (showPhotoSelector === 'after' && selectedAfter?.id === photo.id)) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#CFAFA3] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Fullscreen Modal */}
      {showFullscreen && selectedBefore && selectedAfter && (
        <div className="fixed inset-0 bg-black z-[80] flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/80">
            <div className="flex items-center gap-4">
              <h4 className="text-white font-medium">Photo Comparison</h4>
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setComparisonMode('slider')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    comparisonMode === 'slider' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Slider
                </button>
                <button
                  onClick={() => setComparisonMode('side-by-side')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    comparisonMode === 'side-by-side' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Side by Side
                </button>
              </div>
              {/* Fullscreen Zoom Controls */}
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="p-1.5 rounded hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  <ZoomOut className="w-4 h-4 text-white" />
                </button>
                <span className="text-xs font-medium text-white w-10 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4}
                  className="p-1.5 rounded hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </button>
                {zoomLevel > 1 && (
                  <button
                    onClick={handleResetZoom}
                    className="p-1.5 rounded hover:bg-white/20 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowFullscreen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            {comparisonMode === 'slider' ? (
              <div 
                ref={sliderRef}
                className={`relative w-full max-w-4xl h-full max-h-[80vh] select-none ${zoomLevel > 1 ? 'cursor-grab' : 'cursor-ew-resize'}`}
                onMouseDown={zoomLevel > 1 ? handlePanStart : handleSliderMouseDown}
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                  transformOrigin: 'center center'
                }}
              >
                <img
                  src={selectedAfter.photo_url}
                  alt="After"
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={selectedBefore.photo_url}
                    alt="Before"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ width: sliderRef.current ? `${sliderRef.current.offsetWidth}px` : '100%' }}
                    draggable={false}
                  />
                </div>
                {zoomLevel === 1 && (
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <ArrowLeftRight className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="grid grid-cols-2 gap-4 w-full max-w-6xl h-full max-h-[80vh]"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                  transformOrigin: 'center center'
                }}
                onMouseDown={zoomLevel > 1 ? handlePanStart : undefined}
              >
                <div className="relative">
                  <img
                    src={selectedBefore.photo_url}
                    alt="Before"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 text-white text-sm rounded-lg font-medium">
                    Before - {formatDate(selectedBefore.taken_at)}
                  </div>
                </div>
                <div className="relative">
                  <img
                    src={selectedAfter.photo_url}
                    alt="After"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 text-white text-sm rounded-lg font-medium">
                    After - {formatDate(selectedAfter.taken_at)}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-black/80 flex items-center justify-center gap-4">
            <span className="text-white/70 text-sm">
              {daysBetween} days of progress
            </span>
            {(beforeAnalysis || afterAnalysis) && (
              <span className="text-white/70 text-sm flex items-center gap-1">
                <Activity className="w-4 h-4" /> Skin analysis available
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#CFAFA3]" />
                Generate Progress Report
              </h4>
              <button 
                onClick={() => { setShowReportModal(false); setReportLink(null); }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Create a comprehensive progress report for {clientName} showing their skin improvement journey.
              </p>

              {/* Report Preview */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h5 className="font-medium text-gray-900 mb-3">Report will include:</h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {filteredPhotos.length} progress photos with dates
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {clientTreatments.length} treatment records
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Timeline spanning {daysBetween} days
                  </li>
                  {(beforeAnalysis || afterAnalysis) && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      FaceAge skin analysis scores & improvements
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Photo notes and treatment summaries
                  </li>
                </ul>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                  />
                </div>
              </div>

              {/* Generated Link */}
              {reportLink && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-green-700 font-medium mb-2">Shareable Report Link:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={reportLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-green-200 rounded-lg text-sm"
                    />
                    <button
                      onClick={copyReportLink}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Share this link with your client for consultation purposes.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowReportModal(false); setReportLink(null); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={generateProgressReport}
                  disabled={generatingReport}
                  className="flex-1 py-2.5 bg-[#CFAFA3] text-white rounded-xl font-medium hover:bg-[#B89A8E] transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generatingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Generate & Download
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoComparison;
