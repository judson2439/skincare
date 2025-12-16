import React, { useState, useMemo, useEffect } from 'react';
import { useTreatmentHistory, Treatment, TreatmentFormData, TREATMENT_TYPES } from '@/hooks/useTreatmentHistory';
import { useTreatmentEffectiveness, TreatmentEffectiveness } from '@/hooks/useTreatmentEffectiveness';
import { useProductCatalog } from '@/hooks/useProductCatalog';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  Plus,
  X,
  Loader2,
  FileText,
  Camera,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  DollarSign,
  Clipboard,
  Image,
  Download,
  Search,
  Sparkles,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  ScanFace,
  RefreshCw,
  BarChart3,
  Eye,
  Zap,
  Droplets,
  Sun,
  CircleDot
} from 'lucide-react';

interface TreatmentHistoryProps {
  clientId: string;
  clientName: string;
}

// Metric labels for FaceAge data
const METRIC_LABELS: Record<string, { label: string; color: string }> = {
  skin_age: { label: 'Skin Age', color: 'purple' },
  dark_circle: { label: 'Dark Circles', color: 'indigo' },
  eye_bag: { label: 'Eye Bags', color: 'blue' },
  wrinkles: { label: 'Wrinkles', color: 'amber' },
  acnes: { label: 'Acne', color: 'red' },
  pores: { label: 'Pores', color: 'cyan' },
  pigment: { label: 'Pigmentation', color: 'orange' },
};

const TreatmentHistory: React.FC<TreatmentHistoryProps> = ({ clientId, clientName }) => {
  const treatmentHistory = useTreatmentHistory();
  const treatmentEffectiveness = useTreatmentEffectiveness();
  const productCatalog = useProductCatalog();
  const { toast } = useToast();

  // State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [expandedTreatment, setExpandedTreatment] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  // FaceAge correlation state
  const [correlatingTreatment, setCorrelatingTreatment] = useState<string | null>(null);
  const [treatmentEffectivenessData, setTreatmentEffectivenessData] = useState<Record<string, TreatmentEffectiveness | null>>({});
  const [loadingEffectiveness, setLoadingEffectiveness] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState<TreatmentFormData>({
    treatment_type: '',
    treatment_date: new Date().toISOString().split('T')[0],
    duration_minutes: undefined,
    products_used: [],
    notes: '',
    before_photo_url: '',
    after_photo_url: '',
    results_summary: '',
    follow_up_date: '',
    follow_up_notes: '',
    cost: undefined,
  });

  // Report state
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Get client treatments
  const clientTreatments = treatmentHistory.getClientTreatments(clientId);
  const stats = treatmentHistory.getClientTreatmentStats(clientId);

  // Filter treatments
  const filteredTreatments = useMemo(() => {
    return clientTreatments.filter(t => {
      const matchesType = filterType === 'all' || t.treatment_type === filterType;
      const matchesSearch = searchQuery === '' ||
        t.treatment_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.results_summary?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [clientTreatments, filterType, searchQuery]);

  // Get unique treatment types from history
  const usedTreatmentTypes = useMemo(() => {
    const types = new Set(clientTreatments.map(t => t.treatment_type));
    return Array.from(types);
  }, [clientTreatments]);

  // Load effectiveness data for expanded treatment
  useEffect(() => {
    if (expandedTreatment && !treatmentEffectivenessData[expandedTreatment] && !loadingEffectiveness[expandedTreatment]) {
      loadTreatmentEffectiveness(expandedTreatment);
    }
  }, [expandedTreatment]);

  // Load effectiveness data for a treatment
  const loadTreatmentEffectiveness = async (treatmentId: string) => {
    setLoadingEffectiveness(prev => ({ ...prev, [treatmentId]: true }));
    const result = await treatmentEffectiveness.getTreatmentEffectiveness(treatmentId);
    setLoadingEffectiveness(prev => ({ ...prev, [treatmentId]: false }));
    
    if (result.success) {
      setTreatmentEffectivenessData(prev => ({ ...prev, [treatmentId]: result.effectiveness || null }));
    }
  };

  // Correlate treatment with FaceAge data
  const handleCorrelateTreatment = async (treatment: Treatment) => {
    setCorrelatingTreatment(treatment.id);
    const result = await treatmentEffectiveness.correlateTreatment(
      treatment.id,
      clientId,
      treatment.treatment_type,
      treatment.treatment_date
    );
    setCorrelatingTreatment(null);

    if (result.success) {
      setTreatmentEffectivenessData(prev => ({ ...prev, [treatment.id]: result.correlation || null }));
      toast({ 
        title: 'FaceAge Correlation Complete', 
        description: result.correlation?.effectiveness_score 
          ? `Effectiveness score: ${result.correlation.effectiveness_score}%`
          : 'No matching skin scans found within 14 days of treatment'
      });
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to correlate treatment', variant: 'destructive' });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      treatment_type: '',
      treatment_date: new Date().toISOString().split('T')[0],
      duration_minutes: undefined,
      products_used: [],
      notes: '',
      before_photo_url: '',
      after_photo_url: '',
      results_summary: '',
      follow_up_date: '',
      follow_up_notes: '',
      cost: undefined,
    });
    setShowAddForm(false);
    setEditingTreatment(null);
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'before') setUploadingBefore(true);
    else setUploadingAfter(true);

    const result = await treatmentHistory.uploadTreatmentPhoto(file, type);

    if (type === 'before') setUploadingBefore(false);
    else setUploadingAfter(false);

    if (result.success && result.url) {
      setFormData(prev => ({
        ...prev,
        [type === 'before' ? 'before_photo_url' : 'after_photo_url']: result.url,
      }));
      toast({ title: 'Photo Uploaded', description: `${type === 'before' ? 'Before' : 'After'} photo uploaded successfully` });
    } else {
      toast({ title: 'Upload Failed', description: result.error || 'Failed to upload photo', variant: 'destructive' });
    }
  };

  // Handle save treatment
  const handleSaveTreatment = async () => {
    if (!formData.treatment_type) {
      toast({ title: 'Error', description: 'Please select a treatment type', variant: 'destructive' });
      return;
    }

    setSaving(true);

    if (editingTreatment) {
      const result = await treatmentHistory.updateTreatment(editingTreatment.id, formData);
      if (result.success) {
        toast({ title: 'Treatment Updated', description: 'Treatment record has been updated' });
        resetForm();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update treatment', variant: 'destructive' });
      }
    } else {
      const result = await treatmentHistory.addTreatment(clientId, formData);
      if (result.success) {
        toast({ title: 'Treatment Logged', description: 'New treatment has been recorded' });
        resetForm();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to log treatment', variant: 'destructive' });
      }
    }

    setSaving(false);
  };

  // Handle delete treatment
  const handleDeleteTreatment = async (treatmentId: string) => {
    setDeleting(true);
    const result = await treatmentHistory.deleteTreatment(treatmentId);
    setDeleting(false);

    if (result.success) {
      toast({ title: 'Treatment Deleted', description: 'Treatment record has been removed' });
      setShowDeleteConfirm(null);
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to delete treatment', variant: 'destructive' });
    }
  };

  // Handle edit treatment
  const handleEditTreatment = (treatment: Treatment) => {
    setFormData({
      treatment_type: treatment.treatment_type,
      treatment_date: treatment.treatment_date,
      duration_minutes: treatment.duration_minutes || undefined,
      products_used: treatment.products_used || [],
      notes: treatment.notes || '',
      before_photo_url: treatment.before_photo_url || '',
      after_photo_url: treatment.after_photo_url || '',
      results_summary: treatment.results_summary || '',
      follow_up_date: treatment.follow_up_date || '',
      follow_up_notes: treatment.follow_up_notes || '',
      cost: treatment.cost || undefined,
    });
    setEditingTreatment(treatment);
    setShowAddForm(true);
  };

  // Toggle product selection
  const toggleProduct = (productName: string) => {
    setFormData(prev => ({
      ...prev,
      products_used: prev.products_used.includes(productName)
        ? prev.products_used.filter(p => p !== productName)
        : [...prev.products_used, productName],
    }));
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get improvement indicator
  const getImprovementIndicator = (value: number | null) => {
    if (value === null) return <Minus className="w-3 h-3 text-gray-400" />;
    if (value > 0) return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  // Format improvement value
  const formatImprovement = (value: number | null) => {
    if (value === null) return 'N/A';
    if (value > 0) return `+${value}`;
    return value.toString();
  };

  // Get effectiveness color
  const getEffectivenessColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  // Generate and download report
  const handleGenerateReport = () => {
    const reportData = treatmentHistory.generateReportData(clientId, reportStartDate || undefined, reportEndDate || undefined);
    
    let reportContent = `TREATMENT HISTORY REPORT\n`;
    reportContent += `========================\n\n`;
    reportContent += `Client: ${clientName}\n`;
    reportContent += `Report Generated: ${new Date().toLocaleDateString()}\n`;
    if (reportData.dateRange.start && reportData.dateRange.end) {
      reportContent += `Period: ${formatDate(reportData.dateRange.start)} - ${formatDate(reportData.dateRange.end)}\n`;
    }
    reportContent += `\n`;
    reportContent += `SUMMARY\n`;
    reportContent += `-------\n`;
    reportContent += `Total Treatments: ${reportData.stats.totalTreatments}\n`;
    reportContent += `Total Spent: $${reportData.stats.totalSpent.toFixed(2)}\n`;
    if (reportData.stats.mostCommonTreatment) {
      reportContent += `Most Common Treatment: ${reportData.stats.mostCommonTreatment}\n`;
    }
    reportContent += `\n`;
    reportContent += `TREATMENT BREAKDOWN\n`;
    reportContent += `-------------------\n`;
    Object.entries(reportData.stats.treatmentsByType).forEach(([type, count]) => {
      reportContent += `${type}: ${count} treatment(s)\n`;
    });
    reportContent += `\n`;
    reportContent += `DETAILED HISTORY\n`;
    reportContent += `----------------\n\n`;

    reportData.treatments.forEach((t, i) => {
      reportContent += `${i + 1}. ${t.treatment_type}\n`;
      reportContent += `   Date: ${formatDate(t.treatment_date)}\n`;
      if (t.duration_minutes) reportContent += `   Duration: ${t.duration_minutes} minutes\n`;
      if (t.cost) reportContent += `   Cost: $${Number(t.cost).toFixed(2)}\n`;
      if (t.products_used?.length) reportContent += `   Products: ${t.products_used.join(', ')}\n`;
      if (t.notes) reportContent += `   Notes: ${t.notes}\n`;
      if (t.results_summary) reportContent += `   Results: ${t.results_summary}\n`;
      
      // Add FaceAge effectiveness data if available
      const effectiveness = treatmentEffectivenessData[t.id];
      if (effectiveness?.effectiveness_score !== null && effectiveness?.effectiveness_score !== undefined) {
        reportContent += `   FaceAge Effectiveness: ${effectiveness.effectiveness_score}%\n`;
        if (effectiveness.skin_age_improvement !== null) {
          reportContent += `   Skin Age Improvement: ${effectiveness.skin_age_improvement > 0 ? '+' : ''}${effectiveness.skin_age_improvement} years\n`;
        }
      }
      reportContent += `\n`;
    });

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treatment-report-${clientName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Report Generated', description: 'Treatment report has been downloaded' });
    setShowReportModal(false);
  };

  // Render FaceAge effectiveness section
  const renderEffectivenessSection = (treatment: Treatment) => {
    const effectiveness = treatmentEffectivenessData[treatment.id];
    const isLoading = loadingEffectiveness[treatment.id];
    const isCorrelating = correlatingTreatment === treatment.id;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-[#CFAFA3] animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Loading FaceAge data...</span>
        </div>
      );
    }

    if (!effectiveness) {
      return (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanFace className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900 text-sm">FaceAge Skin Analysis</p>
                <p className="text-xs text-gray-500">Correlate with skin scans to measure effectiveness</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleCorrelateTreatment(treatment); }}
              disabled={isCorrelating}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isCorrelating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              Analyze
            </button>
          </div>
        </div>
      );
    }

    // Has effectiveness data
    return (
      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-gray-900 text-sm">FaceAge Analysis Results</span>
          </div>
          {effectiveness.effectiveness_score !== null && (
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getEffectivenessColor(effectiveness.effectiveness_score)}`}>
              {effectiveness.effectiveness_score}% Effective
            </span>
          )}
        </div>

        {effectiveness.before_analysis_id && effectiveness.after_analysis_id ? (
          <>
            {/* Skin Age Comparison */}
            {effectiveness.before_skin_age !== null && effectiveness.after_skin_age !== null && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg mb-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Before</p>
                  <p className="text-xl font-bold text-gray-900">{effectiveness.before_skin_age}</p>
                  <p className="text-xs text-gray-400">Skin Age</p>
                </div>
                <div className="flex items-center gap-2">
                  {effectiveness.skin_age_improvement !== null && effectiveness.skin_age_improvement > 0 ? (
                    <TrendingDown className="w-6 h-6 text-green-500" />
                  ) : effectiveness.skin_age_improvement !== null && effectiveness.skin_age_improvement < 0 ? (
                    <TrendingUp className="w-6 h-6 text-red-500" />
                  ) : (
                    <Minus className="w-6 h-6 text-gray-400" />
                  )}
                  <span className={`text-lg font-bold ${
                    effectiveness.skin_age_improvement !== null && effectiveness.skin_age_improvement > 0 ? 'text-green-600' :
                    effectiveness.skin_age_improvement !== null && effectiveness.skin_age_improvement < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {effectiveness.skin_age_improvement !== null ? (effectiveness.skin_age_improvement > 0 ? `-${effectiveness.skin_age_improvement}` : `+${Math.abs(effectiveness.skin_age_improvement)}`) : '0'} yrs
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">After</p>
                  <p className="text-xl font-bold text-gray-900">{effectiveness.after_skin_age}</p>
                  <p className="text-xs text-gray-400">Skin Age</p>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              {effectiveness.dark_circle_improvement !== null && (
                <div className="p-2 bg-white rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getImprovementIndicator(effectiveness.dark_circle_improvement)}
                    <span className="text-xs font-medium text-gray-600">Dark Circles</span>
                  </div>
                  <span className={`text-sm font-bold ${effectiveness.dark_circle_improvement > 0 ? 'text-green-600' : effectiveness.dark_circle_improvement < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatImprovement(effectiveness.dark_circle_improvement)}
                  </span>
                </div>
              )}
              {effectiveness.wrinkles_improvement !== null && (
                <div className="p-2 bg-white rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getImprovementIndicator(effectiveness.wrinkles_improvement)}
                    <span className="text-xs font-medium text-gray-600">Wrinkles</span>
                  </div>
                  <span className={`text-sm font-bold ${effectiveness.wrinkles_improvement > 0 ? 'text-green-600' : effectiveness.wrinkles_improvement < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatImprovement(effectiveness.wrinkles_improvement)}
                  </span>
                </div>
              )}
              {effectiveness.acnes_improvement !== null && (
                <div className="p-2 bg-white rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getImprovementIndicator(effectiveness.acnes_improvement)}
                    <span className="text-xs font-medium text-gray-600">Acne</span>
                  </div>
                  <span className={`text-sm font-bold ${effectiveness.acnes_improvement > 0 ? 'text-green-600' : effectiveness.acnes_improvement < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatImprovement(effectiveness.acnes_improvement)}
                  </span>
                </div>
              )}
              {effectiveness.pores_improvement !== null && (
                <div className="p-2 bg-white rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getImprovementIndicator(effectiveness.pores_improvement)}
                    <span className="text-xs font-medium text-gray-600">Pores</span>
                  </div>
                  <span className={`text-sm font-bold ${effectiveness.pores_improvement > 0 ? 'text-green-600' : effectiveness.pores_improvement < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatImprovement(effectiveness.pores_improvement)}
                  </span>
                </div>
              )}
              {effectiveness.pigment_improvement !== null && (
                <div className="p-2 bg-white rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getImprovementIndicator(effectiveness.pigment_improvement)}
                    <span className="text-xs font-medium text-gray-600">Pigment</span>
                  </div>
                  <span className={`text-sm font-bold ${effectiveness.pigment_improvement > 0 ? 'text-green-600' : effectiveness.pigment_improvement < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatImprovement(effectiveness.pigment_improvement)}
                  </span>
                </div>
              )}
              {effectiveness.eye_bag_improvement !== null && (
                <div className="p-2 bg-white rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getImprovementIndicator(effectiveness.eye_bag_improvement)}
                    <span className="text-xs font-medium text-gray-600">Eye Bags</span>
                  </div>
                  <span className={`text-sm font-bold ${effectiveness.eye_bag_improvement > 0 ? 'text-green-600' : effectiveness.eye_bag_improvement < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatImprovement(effectiveness.eye_bag_improvement)}
                  </span>
                </div>
              )}
            </div>

            {effectiveness.days_to_after_scan !== null && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Based on skin scan {effectiveness.days_to_after_scan} days after treatment
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-3">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No matching skin scans found</p>
            <p className="text-xs text-gray-400">Ensure client has FaceAge scans before and after treatment</p>
            <button
              onClick={(e) => { e.stopPropagation(); handleCorrelateTreatment(treatment); }}
              disabled={isCorrelating}
              className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors mx-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCorrelating ? 'animate-spin' : ''}`} />
              Re-analyze
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#CFAFA3]" />
          <h4 className="font-semibold text-gray-900">Treatment History</h4>
          {clientTreatments.length > 0 && (
            <span className="px-2 py-0.5 bg-[#CFAFA3]/10 text-[#CFAFA3] text-xs rounded-full font-medium">
              {clientTreatments.length} treatments
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {clientTreatments.length > 0 && (
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-[#CFAFA3] hover:bg-[#CFAFA3]/10 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" /> Report
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#CFAFA3] text-white text-sm rounded-lg hover:bg-[#B89A8E] transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Treatment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {clientTreatments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gradient-to-br from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clipboard className="w-4 h-4 text-[#CFAFA3]" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.totalTreatments}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">Revenue</span>
            </div>
            <p className="text-xl font-bold text-gray-900">${stats.totalSpent.toFixed(0)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-500">Top Treatment</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{stats.mostCommonTreatment || 'N/A'}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-500">Last Visit</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {stats.lastTreatmentDate ? new Date(stats.lastTreatmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      {clientTreatments.length > 3 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search treatments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm flex-1"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
          >
            <option value="all">All Types</option>
            {usedTreatmentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}

      {/* Empty State */}
      {clientTreatments.length === 0 && !showAddForm && (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-[#CFAFA3]/20 flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6 text-[#CFAFA3]" />
          </div>
          <p className="text-gray-600 mb-2">No treatments logged yet</p>
          <p className="text-sm text-gray-400 mb-4">Start tracking {clientName}'s treatment journey</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#CFAFA3] text-white rounded-lg hover:bg-[#B89A8E] transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Log First Treatment
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gradient-to-br from-[#CFAFA3]/5 to-[#E8D5D0]/5 rounded-xl p-4 mb-4 border border-[#CFAFA3]/20">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-gray-900">
              {editingTreatment ? 'Edit Treatment' : 'Log New Treatment'}
            </h5>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Type *</label>
              <select
                value={formData.treatment_type}
                onChange={(e) => setFormData(prev => ({ ...prev, treatment_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm"
              >
                <option value="">Select treatment...</option>
                {TREATMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.treatment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, treatment_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration_minutes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="e.g., 60"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value ? parseFloat(e.target.value) : undefined }))}
                placeholder="e.g., 150.00"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Products Used</label>
              <div className="flex flex-wrap gap-2 p-3 bg-white border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
                {productCatalog.products.length > 0 ? (
                  productCatalog.products.slice(0, 20).map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleProduct(product.name)}
                      className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        formData.products_used.includes(product.name)
                          ? 'bg-[#CFAFA3] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {product.name}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No products in catalog.</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Details about the treatment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Before Photo</label>
              {formData.before_photo_url ? (
                <div className="relative">
                  <img src={formData.before_photo_url} alt="Before" className="w-full h-32 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, before_photo_url: '' }))}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 bg-white border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#CFAFA3] transition-colors">
                  {uploadingBefore ? (
                    <Loader2 className="w-6 h-6 text-[#CFAFA3] animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Upload before photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'before')} className="hidden" disabled={uploadingBefore} />
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">After Photo</label>
              {formData.after_photo_url ? (
                <div className="relative">
                  <img src={formData.after_photo_url} alt="After" className="w-full h-32 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, after_photo_url: '' }))}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 bg-white border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#CFAFA3] transition-colors">
                  {uploadingAfter ? (
                    <Loader2 className="w-6 h-6 text-[#CFAFA3] animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Upload after photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'after')} className="hidden" disabled={uploadingAfter} />
                </label>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Results Summary</label>
              <textarea
                value={formData.results_summary}
                onChange={(e) => setFormData(prev => ({ ...prev, results_summary: e.target.value }))}
                placeholder="Observed results, improvements..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Notes</label>
              <input
                type="text"
                value={formData.follow_up_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, follow_up_notes: e.target.value }))}
                placeholder="Recommendations..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <button onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSaveTreatment}
              disabled={saving || !formData.treatment_type}
              className="flex items-center gap-2 px-4 py-2 bg-[#CFAFA3] text-white rounded-lg hover:bg-[#B89A8E] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {editingTreatment ? 'Update' : 'Save'} Treatment
            </button>
          </div>
        </div>
      )}

      {/* Timeline View */}
      {filteredTreatments.length > 0 && (
        <div className="space-y-3">
          {filteredTreatments.map((treatment, index) => (
            <div key={treatment.id} className="relative pl-6 pb-3">
              {index < filteredTreatments.length - 1 && (
                <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-gray-200" />
              )}
              
              <div className="absolute left-0 top-1.5 w-[18px] h-[18px] rounded-full bg-[#CFAFA3] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedTreatment(expandedTreatment === treatment.id ? null : treatment.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#CFAFA3]/20 to-[#E8D5D0]/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#CFAFA3]" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{treatment.treatment_type}</h5>
                      <p className="text-xs text-gray-500">{formatDate(treatment.treatment_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {treatmentEffectivenessData[treatment.id]?.effectiveness_score !== null && treatmentEffectivenessData[treatment.id]?.effectiveness_score !== undefined && (
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getEffectivenessColor(treatmentEffectivenessData[treatment.id]!.effectiveness_score!)}`}>
                        {treatmentEffectivenessData[treatment.id]!.effectiveness_score}%
                      </span>
                    )}
                    {treatment.cost && (
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">
                        ${Number(treatment.cost).toFixed(0)}
                      </span>
                    )}
                    {treatment.duration_minutes && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                        {treatment.duration_minutes}min
                      </span>
                    )}
                    {(treatment.before_photo_url || treatment.after_photo_url) && (
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium flex items-center gap-1">
                        <Image className="w-3 h-3" /> Photos
                      </span>
                    )}
                    {expandedTreatment === treatment.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedTreatment === treatment.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="pt-4 space-y-4">
                      {/* FaceAge Effectiveness Section */}
                      {renderEffectivenessSection(treatment)}

                      {/* Before/After Photos */}
                      {(treatment.before_photo_url || treatment.after_photo_url) && (
                        <div className="grid grid-cols-2 gap-3">
                          {treatment.before_photo_url && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Before</p>
                              <img src={treatment.before_photo_url} alt="Before" className="w-full h-32 object-cover rounded-lg" />
                            </div>
                          )}
                          {treatment.after_photo_url && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">After</p>
                              <img src={treatment.after_photo_url} alt="After" className="w-full h-32 object-cover rounded-lg" />
                            </div>
                          )}
                        </div>
                      )}

                      {treatment.products_used && treatment.products_used.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                            <Package className="w-3 h-3" /> Products Used
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {treatment.products_used.map((product, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{product}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {treatment.notes && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Notes
                          </p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{treatment.notes}</p>
                        </div>
                      )}

                      {treatment.results_summary && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Results
                          </p>
                          <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">{treatment.results_summary}</p>
                        </div>
                      )}

                      {treatment.follow_up_date && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="text-xs font-medium text-amber-700">Follow-up: {formatDate(treatment.follow_up_date)}</p>
                            {treatment.follow_up_notes && <p className="text-xs text-amber-600">{treatment.follow_up_notes}</p>}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditTreatment(treatment); }}
                          className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(treatment.id); }}
                          className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Delete Treatment?</h4>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTreatment(showDeleteConfirm)}
                disabled={deleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#CFAFA3]" />
                Generate Treatment Report
              </h4>
              <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Generate a summary report of {clientName}'s treatment history with FaceAge effectiveness data.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-2">Report includes:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Treatment summary statistics</li>
                <li className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Treatment breakdown by type</li>
                <li className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> FaceAge effectiveness scores</li>
                <li className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Detailed treatment history</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                className="flex-1 py-2 bg-[#CFAFA3] text-white rounded-lg hover:bg-[#B89A8E] transition-colors text-sm flex items-center justify-center gap-1"
              >
                <Download className="w-4 h-4" /> Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;
