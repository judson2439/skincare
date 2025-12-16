import React, { useState, useEffect, useMemo } from 'react';
import { useTreatmentEffectiveness, EffectivenessByType, EffectivenessReport, TreatmentEffectiveness } from '@/hooks/useTreatmentEffectiveness';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  Download,
  Calendar,
  Award,
  Target,
  Sparkles,
  Eye,
  Droplets,
  Sun,
  CircleDot,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  FileText,
  X,
  AlertCircle
} from 'lucide-react';

interface TreatmentEffectivenessAnalyticsProps {
  onClose?: () => void;
}

const METRIC_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  skin_age: { label: 'Skin Age', icon: <Sparkles className="w-4 h-4" />, color: 'purple' },
  dark_circle: { label: 'Dark Circles', icon: <Eye className="w-4 h-4" />, color: 'indigo' },
  eye_bag: { label: 'Eye Bags', icon: <Eye className="w-4 h-4" />, color: 'blue' },
  wrinkles: { label: 'Wrinkles', icon: <Zap className="w-4 h-4" />, color: 'amber' },
  acnes: { label: 'Acne', icon: <CircleDot className="w-4 h-4" />, color: 'red' },
  pores: { label: 'Pores', icon: <Droplets className="w-4 h-4" />, color: 'cyan' },
  pigment: { label: 'Pigmentation', icon: <Sun className="w-4 h-4" />, color: 'orange' },
};

const TreatmentEffectivenessAnalytics: React.FC<TreatmentEffectivenessAnalyticsProps> = ({ onClose }) => {
  const { 
    effectivenessByType, 
    loading, 
    error, 
    fetchEffectivenessByType,
    generateEffectivenessReport 
  } = useTreatmentEffectiveness();
  const { toast } = useToast();

  const [report, setReport] = useState<EffectivenessReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'byType' | 'report'>('overview');

  // Fetch report on mount
  useEffect(() => {
    handleGenerateReport();
  }, []);

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    const result = await generateEffectivenessReport(startDate || undefined, endDate || undefined);
    setLoadingReport(false);

    if (result.success && result.report) {
      setReport(result.report);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to generate report',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = async () => {
    await fetchEffectivenessByType();
    await handleGenerateReport();
    toast({ title: 'Data Refreshed', description: 'Treatment effectiveness data has been updated' });
  };

  const handleDownloadReport = () => {
    if (!report) return;

    let content = `TREATMENT EFFECTIVENESS REPORT\n`;
    content += `==============================\n\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n`;
    if (report.dateRange.start || report.dateRange.end) {
      content += `Period: ${report.dateRange.start || 'All time'} to ${report.dateRange.end || 'Present'}\n`;
    }
    content += `\n`;

    content += `SUMMARY\n`;
    content += `-------\n`;
    content += `Total Treatments Analyzed: ${report.summary.totalTreatments}\n`;
    content += `Treatments with FaceAge Data: ${report.summary.treatmentsWithData}\n`;
    content += `Average Effectiveness Score: ${report.summary.avgEffectivenessScore ?? 'N/A'}%\n\n`;

    content += `TOP PERFORMING TREATMENTS\n`;
    content += `-------------------------\n`;
    report.summary.topPerformingTreatments.forEach((t, i) => {
      content += `${i + 1}. ${t.treatment_type}: ${t.avg_effectiveness}% effectiveness (${t.count} treatments)\n`;
    });
    content += `\n`;

    content += `TREATMENTS BY TYPE\n`;
    content += `------------------\n`;
    Object.entries(report.summary.treatmentsByType).forEach(([type, count]) => {
      content += `${type}: ${count} treatment(s)\n`;
    });
    content += `\n`;

    content += `METRICS IMPACT SUMMARY\n`;
    content += `----------------------\n`;
    Object.entries(report.summary.metricsImpact).forEach(([metric, data]) => {
      const label = METRIC_LABELS[metric]?.label || metric;
      content += `${label}: ${data.improved} improved, ${data.worsened} worsened, ${data.unchanged} unchanged\n`;
    });
    content += `\n`;

    content += `DETAILED TREATMENT DATA\n`;
    content += `-----------------------\n\n`;
    report.treatments.forEach((t, i) => {
      content += `${i + 1}. ${t.treatment_type} (${t.treatment_date})\n`;
      content += `   Effectiveness Score: ${t.effectiveness_score ?? 'N/A'}%\n`;
      if (t.skin_age_improvement !== null) content += `   Skin Age Improvement: ${t.skin_age_improvement > 0 ? '+' : ''}${t.skin_age_improvement} years\n`;
      if (t.days_to_after_scan !== null) content += `   Days to Follow-up Scan: ${t.days_to_after_scan}\n`;
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treatment-effectiveness-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Report Downloaded', description: 'Treatment effectiveness report has been saved' });
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getImprovementIndicator = (value: number | null) => {
    if (value === null) return <Minus className="w-4 h-4 text-gray-400" />;
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatImprovement = (value: number | null) => {
    if (value === null) return 'N/A';
    if (value > 0) return `+${value}`;
    return value.toString();
  };

  // Calculate best treatment for each metric
  const bestTreatmentsByMetric = useMemo(() => {
    const results: Record<string, { treatment: string; improvement: number }> = {};
    
    Object.keys(METRIC_LABELS).forEach(metric => {
      const key = `avg_${metric}_improvement` as keyof EffectivenessByType;
      let best: { treatment: string; improvement: number } | null = null;
      
      effectivenessByType.forEach(t => {
        const value = t[key] as number | null;
        if (value !== null && value > 0) {
          if (!best || value > best.improvement) {
            best = { treatment: t.treatment_type, improvement: value };
          }
        }
      });
      
      if (best) {
        results[metric] = best;
      }
    });
    
    return results;
  }, [effectivenessByType]);

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#CFAFA3]/10 to-[#E8D5D0]/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#B89A8E] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Treatment Effectiveness Analytics</h2>
            <p className="text-sm text-gray-500">FaceAge-powered treatment impact analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading || loadingReport}
            className="p-2 text-gray-500 hover:text-[#CFAFA3] hover:bg-[#CFAFA3]/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${(loading || loadingReport) ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-gray-100 flex gap-2">
        {[
          { id: 'overview', label: 'Overview', icon: <Target className="w-4 h-4" /> },
          { id: 'byType', label: 'By Treatment Type', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'report', label: 'Full Report', icon: <FileText className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#CFAFA3] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && report && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-[#CFAFA3]/10 to-[#E8D5D0]/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-[#CFAFA3]" />
                  <span className="text-sm text-gray-600">Total Analyzed</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{report.summary.totalTreatments}</p>
                <p className="text-xs text-gray-500 mt-1">{report.summary.treatmentsWithData} with FaceAge data</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Avg Effectiveness</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {report.summary.avgEffectivenessScore ?? 'N/A'}
                  {report.summary.avgEffectivenessScore !== null && <span className="text-lg">%</span>}
                </p>
                <p className="text-xs text-gray-500 mt-1">Overall score</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-600">Top Treatment</span>
                </div>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {report.summary.topPerformingTreatments[0]?.treatment_type || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {report.summary.topPerformingTreatments[0]?.avg_effectiveness}% effective
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Treatment Types</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(report.summary.treatmentsByType).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Different treatments</p>
              </div>
            </div>

            {/* Top Performing Treatments */}
            {report.summary.topPerformingTreatments.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Top Performing Treatments
                </h3>
                <div className="space-y-3">
                  {report.summary.topPerformingTreatments.map((treatment, index) => (
                    <div key={treatment.treatment_type} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{treatment.treatment_type}</p>
                        <p className="text-xs text-gray-500">{treatment.count} treatments</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEffectivenessColor(treatment.avg_effectiveness)}`}>
                        {treatment.avg_effectiveness}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Treatment by Metric */}
            {Object.keys(bestTreatmentsByMetric).length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#CFAFA3]" />
                  Best Treatment for Each Concern
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(bestTreatmentsByMetric).map(([metric, data]) => {
                    const metricInfo = METRIC_LABELS[metric];
                    return (
                      <div key={metric} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-lg bg-${metricInfo.color}-100 flex items-center justify-center`}>
                          {metricInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{metricInfo.label}</p>
                          <p className="text-xs text-gray-500 truncate">{data.treatment}</p>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">+{data.improvement}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Metrics Impact */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#CFAFA3]" />
                Overall Metrics Impact
              </h3>
              <div className="space-y-3">
                {Object.entries(report.summary.metricsImpact).map(([metric, data]) => {
                  const metricInfo = METRIC_LABELS[metric];
                  const total = data.improved + data.worsened + data.unchanged;
                  const improvedPercent = total > 0 ? Math.round((data.improved / total) * 100) : 0;
                  
                  return (
                    <div key={metric}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {metricInfo?.icon}
                          <span className="text-sm font-medium text-gray-700">{metricInfo?.label || metric}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {data.improved} improved / {total} total
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${total > 0 ? (data.improved / total) * 100 : 0}%` }}
                        />
                        <div 
                          className="h-full bg-gray-300 transition-all"
                          style={{ width: `${total > 0 ? (data.unchanged / total) * 100 : 0}%` }}
                        />
                        <div 
                          className="h-full bg-red-500 transition-all"
                          style={{ width: `${total > 0 ? (data.worsened / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Improved</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-gray-300" />
                  <span>Unchanged</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span>Worsened</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* By Type Tab */}
        {activeTab === 'byType' && (
          <div className="space-y-4">
            {effectivenessByType.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No effectiveness data yet</p>
                <p className="text-sm text-gray-400">
                  Correlate treatments with FaceAge scans to see effectiveness analytics
                </p>
              </div>
            ) : (
              effectivenessByType.map((typeData) => (
                <div key={typeData.treatment_type} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedType(expandedType === typeData.treatment_type ? null : typeData.treatment_type)}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#CFAFA3]/20 to-[#E8D5D0]/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#CFAFA3]" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{typeData.treatment_type}</p>
                        <p className="text-sm text-gray-500">{typeData.treatment_count} treatments analyzed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEffectivenessColor(typeData.avg_effectiveness_score)}`}>
                        {typeData.avg_effectiveness_score}% effective
                      </div>
                      {expandedType === typeData.treatment_type ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedType === typeData.treatment_type && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {typeData.avg_skin_age_improvement !== null && (
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              <span className="text-xs text-purple-700">Skin Age</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getImprovementIndicator(typeData.avg_skin_age_improvement)}
                              <span className="font-semibold text-gray-900">
                                {formatImprovement(typeData.avg_skin_age_improvement)} yrs
                              </span>
                            </div>
                          </div>
                        )}
                        {typeData.avg_dark_circle_improvement !== null && (
                          <div className="p-3 bg-indigo-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Eye className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs text-indigo-700">Dark Circles</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getImprovementIndicator(typeData.avg_dark_circle_improvement)}
                              <span className="font-semibold text-gray-900">
                                {formatImprovement(typeData.avg_dark_circle_improvement)}
                              </span>
                            </div>
                          </div>
                        )}
                        {typeData.avg_wrinkles_improvement !== null && (
                          <div className="p-3 bg-amber-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Zap className="w-4 h-4 text-amber-600" />
                              <span className="text-xs text-amber-700">Wrinkles</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getImprovementIndicator(typeData.avg_wrinkles_improvement)}
                              <span className="font-semibold text-gray-900">
                                {formatImprovement(typeData.avg_wrinkles_improvement)}
                              </span>
                            </div>
                          </div>
                        )}
                        {typeData.avg_acnes_improvement !== null && (
                          <div className="p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <CircleDot className="w-4 h-4 text-red-600" />
                              <span className="text-xs text-red-700">Acne</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getImprovementIndicator(typeData.avg_acnes_improvement)}
                              <span className="font-semibold text-gray-900">
                                {formatImprovement(typeData.avg_acnes_improvement)}
                              </span>
                            </div>
                          </div>
                        )}
                        {typeData.avg_pores_improvement !== null && (
                          <div className="p-3 bg-cyan-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Droplets className="w-4 h-4 text-cyan-600" />
                              <span className="text-xs text-cyan-700">Pores</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getImprovementIndicator(typeData.avg_pores_improvement)}
                              <span className="font-semibold text-gray-900">
                                {formatImprovement(typeData.avg_pores_improvement)}
                              </span>
                            </div>
                          </div>
                        )}
                        {typeData.avg_pigment_improvement !== null && (
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Sun className="w-4 h-4 text-orange-600" />
                              <span className="text-xs text-orange-700">Pigmentation</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getImprovementIndicator(typeData.avg_pigment_improvement)}
                              <span className="font-semibold text-gray-900">
                                {formatImprovement(typeData.avg_pigment_improvement)}
                              </span>
                            </div>
                          </div>
                        )}
                        {typeData.avg_eye_bag_improvement !== null && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Eye className="w-4 h-4 text-blue-600" />
                              <span className="text-xs text-blue-700">Eye Bags</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getImprovementIndicator(typeData.avg_eye_bag_improvement)}
                              <span className="font-semibold text-gray-900">
                                {formatImprovement(typeData.avg_eye_bag_improvement)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            {/* Date Range Filter */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#CFAFA3]" />
                Filter by Date Range
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleGenerateReport}
                    disabled={loadingReport}
                    className="px-4 py-2 bg-[#CFAFA3] text-white rounded-lg hover:bg-[#B89A8E] transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingReport ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {/* Download Button */}
            {report && (
              <button
                onClick={handleDownloadReport}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                <Download className="w-5 h-5" />
                Download Full Report
              </button>
            )}

            {/* Report Preview */}
            {report && (
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#CFAFA3]" />
                  Report Preview
                </h4>

                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-700 mb-2">Summary Statistics</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-600">
                      <p>Total Treatments: <span className="font-medium text-gray-900">{report.summary.totalTreatments}</span></p>
                      <p>With FaceAge Data: <span className="font-medium text-gray-900">{report.summary.treatmentsWithData}</span></p>
                      <p>Avg Effectiveness: <span className="font-medium text-gray-900">{report.summary.avgEffectivenessScore ?? 'N/A'}%</span></p>
                      <p>Treatment Types: <span className="font-medium text-gray-900">{Object.keys(report.summary.treatmentsByType).length}</span></p>
                    </div>
                  </div>

                  {report.treatments.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Recent Treatments ({Math.min(5, report.treatments.length)} of {report.treatments.length})</p>
                      <div className="space-y-2">
                        {report.treatments.slice(0, 5).map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{t.treatment_type}</p>
                              <p className="text-xs text-gray-500">{new Date(t.treatment_date).toLocaleDateString()}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              t.effectiveness_score !== null ? getEffectivenessColor(t.effectiveness_score) : 'text-gray-500 bg-gray-100'
                            }`}>
                              {t.effectiveness_score !== null ? `${t.effectiveness_score}%` : 'No data'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">How Effectiveness is Calculated</p>
                <p className="text-blue-600">
                  Treatment effectiveness is measured by comparing FaceAge skin scans taken before and after each treatment. 
                  The system looks for scans within 14 days of the treatment date and calculates improvements across all skin metrics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeTab === 'overview' && !report && !loadingReport && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No report data available</p>
            <button
              onClick={handleGenerateReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#CFAFA3] text-white rounded-lg hover:bg-[#B89A8E] transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentEffectivenessAnalytics;
