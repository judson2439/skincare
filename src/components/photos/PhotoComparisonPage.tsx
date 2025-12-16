import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useProgressPhotos, PhotoWithComments } from '@/hooks/useProgressPhotos';
import { useRoutineManagement } from '@/hooks/useRoutineManagement';
import { usePhotoAnnotations, AnnotationData } from '@/hooks/usePhotoAnnotations';
import { useSkinAnalysis, SkinAnalysis } from '@/hooks/useSkinAnalysis';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import ImageMarkupEditor from './ImageMarkupEditor';
import AnnotationViewer from './AnnotationViewer';
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
  Users,
  Edit,
  Save,
  MessageSquare,
  ArrowLeft,
  Grid3X3,
  Play,
  Pause,
  Activity,
  Minus,
  Link,
  ImageIcon
} from 'lucide-react';

// Demo client images for fallback
const CLIENT_IMAGES = [
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033469330_78107091.png",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033460880_8c5e20c5.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033472779_08fb4b93.png",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033468079_20484702.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033471638_05f7651f.jpg",
  "https://d64gsuwffb70l.cloudfront.net/69343bc0dba891717b31545c_1765033469659_af60252d.jpg"
];

type ComparisonMode = 'side-by-side' | 'slider' | 'overlay';

interface PhotoComparisonPageProps {
  onBack?: () => void;
  initialClientId?: string;
}

interface SkinScoreComparison {
  label: string;
  key: string;
  before: number | null;
  after: number | null;
  change: number | null;
  improved: boolean | null;
}

const PhotoComparisonPage: React.FC<PhotoComparisonPageProps> = ({ onBack, initialClientId }) => {
  const progressPhotos = useProgressPhotos();
  const routineManagement = useRoutineManagement();
  const { getClientAnalyses, getScoreLevel, getScoreColor, getScoreLabel } = useSkinAnalysis();
  const { toast } = useToast();

  // State
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '');
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('slider');
  const [selectedBefore, setSelectedBefore] = useState<PhotoWithComments | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<PhotoWithComments | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPhotoSelector, setShowPhotoSelector] = useState<'before' | 'after' | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showMarkupEditor, setShowMarkupEditor] = useState(false);
  const [markupTarget, setMarkupTarget] = useState<'before' | 'after' | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayIndex, setAutoPlayIndex] = useState(0);
  const [showTimeline, setShowTimeline] = useState(true);
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
  
  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [generatingShare, setGeneratingShare] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Get photo annotations for selected photos
  const beforePhotoAnnotations = usePhotoAnnotations(selectedBefore?.id);
  const afterPhotoAnnotations = usePhotoAnnotations(selectedAfter?.id);

  // Build client lookup
  const clientLookup = useMemo(() => {
    const lookup = new Map<string, { name: string; image: string; email: string }>();
    routineManagement.clients.forEach((c, idx) => {
      lookup.set(c.id, {
        name: c.full_name || c.email || 'Unknown Client',
        image: c.avatar_url || CLIENT_IMAGES[idx % CLIENT_IMAGES.length],
        email: c.email || ''
      });
    });
    return lookup;
  }, [routineManagement.clients]);

  // Get all clients for dropdown
  const allClients = useMemo(() => {
    const clientsWithPhotos = new Set<string>();
    progressPhotos.photos.forEach(p => clientsWithPhotos.add(p.client_id));
    
    return routineManagement.clients
      .filter(c => clientsWithPhotos.has(c.id))
      .map((c, idx) => ({
        id: c.id,
        name: c.full_name || c.email || 'Unknown Client',
        image: c.avatar_url || CLIENT_IMAGES[idx % CLIENT_IMAGES.length],
        photoCount: progressPhotos.photos.filter(p => p.client_id === c.id).length
      }));
  }, [routineManagement.clients, progressPhotos.photos]);

  // Get client photos
  const clientPhotos = useMemo(() => {
    if (!selectedClientId) return [];
    return progressPhotos.getClientPhotos(selectedClientId).sort(
      (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
    );
  }, [progressPhotos, selectedClientId]);

  // Filter photos by date range
  const filteredPhotos = useMemo(() => {
    return clientPhotos.filter(photo => {
      const photoDate = new Date(photo.taken_at);
      if (startDate && photoDate < new Date(startDate)) return false;
      if (endDate && photoDate > new Date(endDate)) return false;
      return true;
    });
  }, [clientPhotos, startDate, endDate]);

  // Fetch skin analyses when client changes
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!selectedClientId) {
        setClientAnalyses([]);
        return;
      }
      
      setLoadingAnalyses(true);
      try {
        const analyses = await getClientAnalyses(selectedClientId);
        setClientAnalyses(analyses);
      } catch (error) {
        console.error('Error fetching skin analyses:', error);
      } finally {
        setLoadingAnalyses(false);
      }
    };
    
    fetchAnalyses();
  }, [selectedClientId, getClientAnalyses]);

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

  // Auto-select first and last photos when client changes
  useEffect(() => {
    if (filteredPhotos.length >= 2) {
      setSelectedBefore(filteredPhotos[0]);
      setSelectedAfter(filteredPhotos[filteredPhotos.length - 1]);
    } else {
      setSelectedBefore(null);
      setSelectedAfter(null);
    }
    // Reset zoom when photos change
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [selectedClientId, filteredPhotos.length]);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && filteredPhotos.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setAutoPlayIndex(prev => {
          const next = (prev + 1) % filteredPhotos.length;
          if (next > 0) {
            setSelectedBefore(filteredPhotos[0]);
            setSelectedAfter(filteredPhotos[next]);
          }
          return next;
        });
      }, 2000);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, filteredPhotos]);

  // Handle slider drag
  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) return; // Don't allow slider drag when zoomed
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

  // Swap photos
  const swapPhotos = () => {
    const temp = selectedBefore;
    setSelectedBefore(selectedAfter);
    setSelectedAfter(temp);
  };

  // Reset slider
  const resetSlider = () => {
    setSliderPosition(50);
  };

  // Open markup editor
  const openMarkupEditor = (target: 'before' | 'after') => {
    setMarkupTarget(target);
    setShowMarkupEditor(true);
  };

  // Save markup
  const handleSaveMarkup = async (annotationData: AnnotationData) => {
    const targetPhoto = markupTarget === 'before' ? selectedBefore : selectedAfter;
    const targetAnnotations = markupTarget === 'before' ? beforePhotoAnnotations : afterPhotoAnnotations;
    
    if (!targetPhoto) return;

    const result = await targetAnnotations.saveAnnotation(
      annotationData,
      `Comparison Markup - ${markupTarget === 'before' ? 'Before' : 'After'}`,
      `Annotated on ${new Date().toLocaleDateString()}`
    );

    if (result.success) {
      toast({ title: 'Success', description: 'Markup saved successfully!' });
      setShowMarkupEditor(false);
      setMarkupTarget(null);
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to save markup', variant: 'destructive' });
    }
  };

  // Generate share link
  const generateShareLink = async () => {
    setGeneratingShare(true);
    try {
      // Generate a unique share ID
      const shareId = `${selectedClientId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const link = `${window.location.origin}/comparison/${shareId}`;
      setShareLink(link);
      toast({ title: 'Link Generated', description: 'Share link created successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate share link', variant: 'destructive' });
    } finally {
      setGeneratingShare(false);
    }
  };

  // Copy share link
  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast({ title: 'Copied', description: 'Link copied to clipboard!' });
    }
  };

  // Download comparison as image
  const downloadComparison = async () => {
    if (!comparisonRef.current) return;
    
    try {
      // Use html2canvas if available, otherwise just notify
      toast({ 
        title: 'Download Started', 
        description: 'Preparing comparison image for download...' 
      });
      
      // Create a simple canvas with both images
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx || !selectedBefore || !selectedAfter) return;
      
      const img1 = new window.Image();
      const img2 = new window.Image();
      img1.crossOrigin = 'anonymous';
      img2.crossOrigin = 'anonymous';
      
      await Promise.all([
        new Promise((resolve) => { img1.onload = resolve; img1.src = selectedBefore.photo_url; }),
        new Promise((resolve) => { img2.onload = resolve; img2.src = selectedAfter.photo_url; })
      ]);
      
      const width = 1200;
      const height = 600;
      canvas.width = width;
      canvas.height = height;
      
      // Draw background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);
      
      // Draw images side by side
      const imgWidth = width / 2 - 20;
      const imgHeight = height - 80;
      
      ctx.drawImage(img1, 10, 10, imgWidth, imgHeight);
      ctx.drawImage(img2, width / 2 + 10, 10, imgWidth, imgHeight);
      
      // Add labels
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(10, height - 60, 150, 30);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(width / 2 + 10, height - 60, 150, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`Before - ${formatDate(selectedBefore.taken_at)}`, 20, height - 40);
      ctx.fillText(`After - ${formatDate(selectedAfter.taken_at)}`, width / 2 + 20, height - 40);
      
      // Download
      const link = document.createElement('a');
      link.download = `comparison-${formatDate(selectedBefore.taken_at)}-${formatDate(selectedAfter.taken_at)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({ title: 'Downloaded', description: 'Comparison image saved!' });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Error', description: 'Failed to download comparison', variant: 'destructive' });
    }
  };

  // Generate progress report
  const generateProgressReport = async () => {
    setGeneratingReport(true);

    const clientInfo = clientLookup.get(selectedClientId);
    const clientName = clientInfo?.name || 'Client';

    let reportContent = `SKIN PROGRESS COMPARISON REPORT\n`;
    reportContent += `================================\n\n`;
    reportContent += `Client: ${clientName}\n`;
    reportContent += `Generated: ${new Date().toLocaleDateString()}\n`;
    reportContent += `Period: ${selectedBefore ? formatDate(selectedBefore.taken_at) : 'N/A'} - ${selectedAfter ? formatDate(selectedAfter.taken_at) : 'N/A'}\n`;
    reportContent += `Duration: ${daysBetween} days\n\n`;

    // Add skin analysis scores if available
    if (beforeAnalysis || afterAnalysis) {
      reportContent += `SKIN ANALYSIS SCORES\n`;
      reportContent += `--------------------\n`;
      
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

    reportContent += `COMPARISON SUMMARY\n`;
    reportContent += `------------------\n`;
    reportContent += `Total Photos in Timeline: ${filteredPhotos.length}\n\n`;

    reportContent += `BEFORE PHOTO\n`;
    reportContent += `------------\n`;
    if (selectedBefore) {
      reportContent += `Date: ${formatDate(selectedBefore.taken_at)}\n`;
      reportContent += `Type: ${selectedBefore.photo_type}\n`;
      if (selectedBefore.title) reportContent += `Title: ${selectedBefore.title}\n`;
      if (selectedBefore.notes) reportContent += `Notes: ${selectedBefore.notes}\n`;
      reportContent += `Annotations: ${beforePhotoAnnotations.annotations.length}\n`;
    }

    reportContent += `\nAFTER PHOTO\n`;
    reportContent += `-----------\n`;
    if (selectedAfter) {
      reportContent += `Date: ${formatDate(selectedAfter.taken_at)}\n`;
      reportContent += `Type: ${selectedAfter.photo_type}\n`;
      if (selectedAfter.title) reportContent += `Title: ${selectedAfter.title}\n`;
      if (selectedAfter.notes) reportContent += `Notes: ${selectedAfter.notes}\n`;
      reportContent += `Annotations: ${afterPhotoAnnotations.annotations.length}\n`;
    }

    reportContent += `\n\nFULL PHOTO TIMELINE\n`;
    reportContent += `-------------------\n`;
    filteredPhotos.forEach((photo, i) => {
      reportContent += `\n${i + 1}. ${formatDate(photo.taken_at)} - ${photo.photo_type.toUpperCase()}\n`;
      if (photo.title) reportContent += `   Title: ${photo.title}\n`;
      if (photo.notes) reportContent += `   Notes: ${photo.notes}\n`;
    });

    reportContent += `\n\n---\n`;
    reportContent += `Generated by SkinAura PRO\n`;

    // Download report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-report-${clientName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setGeneratingReport(false);
    setShowReportModal(false);
    toast({ title: 'Report Generated', description: 'Your comparison report has been downloaded' });
  };

  const selectedClientInfo = clientLookup.get(selectedClientId);

  // Render skin score card
  const renderSkinScoreCard = (analysis: SkinAnalysis | null, label: string, color: string) => {
    if (!analysis) {
      return (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">No skin analysis data</p>
          <p className="text-xs text-gray-400 mt-1">within 7 days of photo</p>
        </div>
      );
    }

    return (
      <div className={`bg-gradient-to-br ${color} rounded-xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white/90">{label} Analysis</span>
          <span className="text-xs text-white/70">{formatDate(analysis.created_at)}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {analysis.skin_age && (
            <div className="bg-white/20 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold text-white">{analysis.skin_age}</p>
              <p className="text-xs text-white/80">Skin Age</p>
            </div>
          )}
          {analysis.overall_score && (
            <div className="bg-white/20 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold text-white">{analysis.overall_score}</p>
              <p className="text-xs text-white/80">Health Score</p>
            </div>
          )}
        </div>
        
        <div className="mt-3 space-y-1">
          {[
            { key: 'dark_circle_score', label: 'Dark Circles' },
            { key: 'wrinkles_score', label: 'Wrinkles' },
            { key: 'acnes_score', label: 'Acne' },
            { key: 'pores_score', label: 'Pores' }
          ].map(({ key, label }) => {
            const score = (analysis as any)[key];
            if (score === null) return null;
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-white/80">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full"
                      style={{ width: `${Math.min(100, score)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-white w-6">{score}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900">Photo Comparison</h1>
                <p className="text-sm text-gray-500">Compare before and after photos with skin analysis scores</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedClientId && filteredPhotos.length >= 2 && (
                <>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <FileText className="w-4 h-4" /> Report
                  </button>
                  <button
                    onClick={() => setShowFullscreen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    <Maximize2 className="w-4 h-4" /> Fullscreen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {/* Client Selection */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-[#CFAFA3]" />
            <h3 className="font-semibold text-gray-900">Select Client</h3>
          </div>
          
          {allClients.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No clients with photos</p>
              <p className="text-sm text-gray-400">Photos will appear here when clients upload them</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    selectedClientId === client.id
                      ? 'border-[#CFAFA3] bg-[#CFAFA3]/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <img
                    src={client.image}
                    alt={client.name}
                    className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                  />
                  <p className="font-medium text-gray-900 text-sm truncate text-center">{client.name}</p>
                  <p className="text-xs text-gray-500 text-center">{client.photoCount} photos</p>
                  {selectedClientId === client.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#CFAFA3] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comparison Section */}
        {selectedClientId && (
          <>
            {filteredPhotos.length < 2 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Not Enough Photos</h3>
                <p className="text-gray-500">
                  {filteredPhotos.length === 0 
                    ? `${selectedClientInfo?.name || 'This client'} hasn't uploaded any progress photos yet`
                    : 'At least 2 photos are needed for comparison'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Controls Bar */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Date Range Filter */}
                    <div className="flex items-center gap-3">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">From:</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">To:</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] outline-none"
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
                    </div>

                    {/* View Mode */}
                    <div className="flex items-center gap-2">
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
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isAutoPlaying ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Auto-play timeline"
                      >
                        {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {isAutoPlaying ? 'Stop' : 'Play'}
                      </button>
                      <button
                        onClick={swapPhotos}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                        title="Swap photos"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
                      </button>
                      {comparisonMode === 'slider' && (
                        <button
                          onClick={resetSlider}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                          title="Reset slider"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photo Selection Cards with Skin Scores */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Before Photo */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">B</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Before Photo</h4>
                          {selectedBefore && (
                            <p className="text-xs text-gray-500">{formatDate(selectedBefore.taken_at)}</p>
                          )}
                        </div>
                      </div>
                      {selectedBefore && (
                        <button
                          onClick={() => openMarkupEditor('before')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-lg text-xs font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" /> Annotate
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setShowPhotoSelector('before')}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-[#CFAFA3] transition-colors overflow-hidden relative group"
                    >
                      {selectedBefore ? (
                        <>
                          {beforePhotoAnnotations.annotations.length > 0 ? (
                            <AnnotationViewer
                              imageUrl={selectedBefore.photo_url}
                              annotations={beforePhotoAnnotations.annotations}
                              showControls={false}
                              className="w-full h-full"
                            />
                          ) : (
                            <img 
                              src={selectedBefore.photo_url} 
                              alt="Before" 
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm font-medium">Change Photo</span>
                          </div>
                          {beforePhotoAnnotations.annotations.length > 0 && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-[#CFAFA3] text-white text-xs rounded-full flex items-center gap-1">
                              <Edit className="w-3 h-3" /> {beforePhotoAnnotations.annotations.length}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <Image className="w-8 h-8 mb-2" />
                          <span className="text-sm">Select before photo</span>
                        </div>
                      )}
                    </button>
                    
                    {/* Before Skin Analysis Scores */}
                    {showSkinScores && (
                      <div className="mt-4">
                        {renderSkinScoreCard(beforeAnalysis, 'Before', 'from-blue-500 to-blue-600')}
                      </div>
                    )}
                  </div>

                  {/* After Photo */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 font-bold text-sm">A</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">After Photo</h4>
                          {selectedAfter && (
                            <p className="text-xs text-gray-500">{formatDate(selectedAfter.taken_at)}</p>
                          )}
                        </div>
                      </div>
                      {selectedAfter && (
                        <button
                          onClick={() => openMarkupEditor('after')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-lg text-xs font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" /> Annotate
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setShowPhotoSelector('after')}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-[#CFAFA3] transition-colors overflow-hidden relative group"
                    >
                      {selectedAfter ? (
                        <>
                          {afterPhotoAnnotations.annotations.length > 0 ? (
                            <AnnotationViewer
                              imageUrl={selectedAfter.photo_url}
                              annotations={afterPhotoAnnotations.annotations}
                              showControls={false}
                              className="w-full h-full"
                            />
                          ) : (
                            <img 
                              src={selectedAfter.photo_url} 
                              alt="After" 
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm font-medium">Change Photo</span>
                          </div>
                          {afterPhotoAnnotations.annotations.length > 0 && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-[#CFAFA3] text-white text-xs rounded-full flex items-center gap-1">
                              <Edit className="w-3 h-3" /> {afterPhotoAnnotations.annotations.length}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <Image className="w-8 h-8 mb-2" />
                          <span className="text-sm">Select after photo</span>
                        </div>
                      )}
                    </button>
                    
                    {/* After Skin Analysis Scores */}
                    {showSkinScores && (
                      <div className="mt-4">
                        {renderSkinScoreCard(afterAnalysis, 'After', 'from-green-500 to-green-600')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Skin Score Improvements */}
                {showSkinScores && beforeAnalysis && afterAnalysis && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#CFAFA3]" />
                        <h4 className="font-semibold text-gray-900">Skin Analysis Improvements</h4>
                      </div>
                      <button
                        onClick={() => setShowSkinScores(!showSkinScores)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        {showSkinScores ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {skinScoreComparisons.map((score) => {
                        if (score.before === null && score.after === null) return null;
                        
                        return (
                          <div key={score.key} className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-2">{score.label}</p>
                            <div className="flex items-center justify-between">
                              <div className="text-center">
                                <p className="text-lg font-bold text-gray-900">
                                  {score.before !== null ? score.before : '-'}
                                </p>
                                <p className="text-[10px] text-gray-400">Before</p>
                              </div>
                              
                              <div className="flex flex-col items-center">
                                {score.change !== null ? (
                                  <>
                                    {score.improved ? (
                                      <TrendingDown className="w-4 h-4 text-green-500" />
                                    ) : score.improved === false ? (
                                      <TrendingUp className="w-4 h-4 text-red-500" />
                                    ) : (
                                      <Minus className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className={`text-xs font-medium ${
                                      score.improved ? 'text-green-600' : 
                                      score.improved === false ? 'text-red-600' : 'text-gray-500'
                                    }`}>
                                      {score.change > 0 ? '+' : ''}{score.change}
                                    </span>
                                  </>
                                ) : (
                                  <Minus className="w-4 h-4 text-gray-300" />
                                )}
                              </div>
                              
                              <div className="text-center">
                                <p className="text-lg font-bold text-gray-900">
                                  {score.after !== null ? score.after : '-'}
                                </p>
                                <p className="text-[10px] text-gray-400">After</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Days Between Badge */}
                {selectedBefore && selectedAfter && daysBetween > 0 && (
                  <div className="flex items-center justify-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#CFAFA3]/10 to-purple-50 rounded-full border border-[#CFAFA3]/20">
                      <Clock className="w-5 h-5 text-[#CFAFA3]" />
                      <span className="text-lg font-bold text-gray-900">{daysBetween}</span>
                      <span className="text-gray-600">days of progress</span>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                )}

                {/* Comparison View with Zoom */}
                {selectedBefore && selectedAfter && (
                  <div ref={comparisonRef} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Comparison View</h4>
                      <div className="flex items-center gap-2">
                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={handleZoomOut}
                            disabled={zoomLevel <= 1}
                            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Zoom out"
                          >
                            <ZoomOut className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="text-xs font-medium text-gray-600 w-12 text-center">
                            {Math.round(zoomLevel * 100)}%
                          </span>
                          <button
                            onClick={handleZoomIn}
                            disabled={zoomLevel >= 4}
                            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Zoom in"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-600" />
                          </button>
                          {zoomLevel > 1 && (
                            <button
                              onClick={handleResetZoom}
                              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                              title="Reset zoom"
                            >
                              <RotateCcw className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{filteredPhotos.length} photos in timeline</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 overflow-hidden">
                      {comparisonMode === 'slider' ? (
                        <div 
                          ref={sliderRef}
                          className={`relative h-[500px] select-none ${zoomLevel > 1 ? 'cursor-grab' : 'cursor-ew-resize'}`}
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
                            className="absolute inset-0 w-full h-full object-contain"
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
                              className="absolute inset-0 w-full h-full object-contain"
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
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                                <ArrowLeftRight className="w-6 h-6 text-gray-600" />
                              </div>
                            </div>
                          )}

                          {/* Labels */}
                          <div className="absolute top-4 left-4 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg font-medium">
                            Before - {formatDate(selectedBefore.taken_at)}
                          </div>
                          <div className="absolute top-4 right-4 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg font-medium">
                            After - {formatDate(selectedAfter.taken_at)}
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="grid grid-cols-2 h-[500px]"
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
                            <div className="absolute top-4 left-4 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg font-medium">
                              Before - {formatDate(selectedBefore.taken_at)}
                            </div>
                          </div>
                          <div className="relative border-l border-white/20">
                            <img
                              src={selectedAfter.photo_url}
                              alt="After"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute top-4 right-4 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg font-medium">
                              After - {formatDate(selectedAfter.taken_at)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Photo Timeline */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div 
                    className="flex items-center justify-between mb-4 cursor-pointer"
                    onClick={() => setShowTimeline(!showTimeline)}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#CFAFA3]" />
                      <h4 className="font-semibold text-gray-900">Photo Timeline</h4>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {filteredPhotos.length} photos
                      </span>
                    </div>
                    {showTimeline ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  {showTimeline && (
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                      {filteredPhotos.map((photo, index) => (
                        <div key={photo.id} className="flex-shrink-0">
                          <button
                            onClick={() => {
                              if (!selectedBefore || selectedBefore.id === photo.id) {
                                setSelectedBefore(photo);
                              } else {
                                setSelectedAfter(photo);
                              }
                            }}
                            className={`relative w-24 h-24 rounded-xl overflow-hidden border-3 transition-all ${
                              selectedBefore?.id === photo.id 
                                ? 'border-blue-500 ring-2 ring-blue-200' 
                                : selectedAfter?.id === photo.id
                                ? 'border-green-500 ring-2 ring-green-200'
                                : 'border-gray-200 hover:border-[#CFAFA3]'
                            }`}
                          >
                            <img
                              src={photo.photo_url}
                              alt={photo.title || `Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                              <p className="text-white text-[10px] font-medium truncate text-center">
                                {photo.title || photo.photo_type}
                              </p>
                            </div>
                            {selectedBefore?.id === photo.id && (
                              <div className="absolute top-1 left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">B</span>
                              </div>
                            )}
                            {selectedAfter?.id === photo.id && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">A</span>
                              </div>
                            )}
                          </button>
                          <p className="text-[10px] text-gray-500 text-center mt-1.5 w-24">
                            {new Date(photo.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Photo Selector Modal */}
      {showPhotoSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900">
                Select {showPhotoSelector === 'before' ? 'Before' : 'After'} Photo
              </h4>
              <button 
                onClick={() => setShowPhotoSelector(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
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
                        {photo.title || photo.photo_type}
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
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/80">
            <div className="flex items-center gap-4">
              <h4 className="text-white font-medium">Photo Comparison - {selectedClientInfo?.name}</h4>
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setComparisonMode('slider')}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                    comparisonMode === 'slider' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Slider
                </button>
                <button
                  onClick={() => setComparisonMode('side-by-side')}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
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
                <span className="text-xs font-medium text-white w-12 text-center">
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
                className={`relative w-full max-w-5xl h-full max-h-[80vh] select-none ${zoomLevel > 1 ? 'cursor-grab' : 'cursor-ew-resize'}`}
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
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <ArrowLeftRight className="w-7 h-7 text-gray-600" />
                    </div>
                  </div>
                )}
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg font-medium">
                  Before - {formatDate(selectedBefore.taken_at)}
                </div>
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg font-medium">
                  After - {formatDate(selectedAfter.taken_at)}
                </div>
              </div>
            ) : (
              <div 
                className="grid grid-cols-2 gap-6 w-full max-w-6xl h-full max-h-[80vh]"
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
                  <div className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium">
                    Before - {formatDate(selectedBefore.taken_at)}
                  </div>
                </div>
                <div className="relative">
                  <img
                    src={selectedAfter.photo_url}
                    alt="After"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 right-4 px-4 py-2 bg-green-500 text-white rounded-lg font-medium">
                    After - {formatDate(selectedAfter.taken_at)}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-black/80 flex items-center justify-center gap-6">
            <span className="text-white/70 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" /> {daysBetween} days of progress
            </span>
            <span className="text-white/70 text-sm flex items-center gap-2">
              <Camera className="w-4 h-4" /> {filteredPhotos.length} photos in timeline
            </span>
            {(beforeAnalysis || afterAnalysis) && (
              <span className="text-white/70 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" /> Skin analysis available
              </span>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#CFAFA3]" />
                Share Comparison
              </h4>
              <button 
                onClick={() => { setShowShareModal(false); setShareLink(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Share this comparison with {selectedClientInfo?.name} or save it for your records.
              </p>

              <div className="space-y-3">
                <button
                  onClick={downloadComparison}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Download Image</p>
                    <p className="text-xs text-gray-500">Save comparison as PNG image</p>
                  </div>
                </button>

                <button
                  onClick={generateShareLink}
                  disabled={generatingShare}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    {generatingShare ? (
                      <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    ) : (
                      <Link className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Generate Share Link</p>
                    <p className="text-xs text-gray-500">Create a shareable link</p>
                  </div>
                </button>

                {shareLink && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-xs text-green-700 font-medium mb-2">Share Link Generated:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-green-200 rounded-lg text-sm"
                      />
                      <button
                        onClick={copyShareLink}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#CFAFA3]" />
                Generate Comparison Report
              </h4>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Create a detailed comparison report for {selectedClientInfo?.name} showing their skin improvement journey.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h5 className="font-medium text-gray-900 mb-3">Report will include:</h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Before photo: {selectedBefore ? formatDate(selectedBefore.taken_at) : 'Not selected'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    After photo: {selectedAfter ? formatDate(selectedAfter.taken_at) : 'Not selected'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {daysBetween} days of documented progress
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {filteredPhotos.length} photos in timeline
                  </li>
                  {(beforeAnalysis || afterAnalysis) && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      FaceAge skin analysis scores & improvements
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    All annotations and notes
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={generateProgressReport}
                  disabled={generatingReport}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Download Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Markup Editor */}
      {showMarkupEditor && markupTarget && (
        <ImageMarkupEditor
          imageUrl={markupTarget === 'before' ? selectedBefore!.photo_url : selectedAfter!.photo_url}
          initialAnnotations={
            markupTarget === 'before' 
              ? beforePhotoAnnotations.annotations[0]?.annotation_data 
              : afterPhotoAnnotations.annotations[0]?.annotation_data
          }
          saving={markupTarget === 'before' ? beforePhotoAnnotations.saving : afterPhotoAnnotations.saving}
          onSave={handleSaveMarkup}
          onCancel={() => {
            setShowMarkupEditor(false);
            setMarkupTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default PhotoComparisonPage;
