import React, { useState, useRef, useCallback } from 'react';
import { useRoutineManagement, ClientForAssignment } from '@/hooks/useRoutineManagement';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileSpreadsheet,
  Download,
  X,
  Check,
  AlertCircle,
  Loader2,
  Users,
  Mail,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

interface ImportRow {
  email: string;
  originalRow: number;
  status: 'pending' | 'valid' | 'invalid' | 'duplicate' | 'success' | 'error';
  message?: string;
}

interface ImportSummary {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  invalid: number;
}

interface BulkClientImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
  existingClientEmails: string[];
}

const BulkClientImport: React.FC<BulkClientImportProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingClientEmails
}) => {
  const { addClientByEmail } = useRoutineManagement();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Generate template CSV content
  const generateTemplateCSV = (): string => {
    return 'email\nclient1@example.com\nclient2@example.com\nclient3@example.com';
  };

  // Download template CSV
  const downloadTemplate = () => {
    const csvContent = generateTemplateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'client_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Template Downloaded',
      description: 'Fill in the email addresses and upload the file to import clients.',
    });
  };

  // Parse CSV content
  const parseCSV = (content: string): string[] => {
    const lines = content.split(/\r?\n/);
    const emails: string[] = [];
    
    // Skip header row if it looks like a header
    const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // Handle both simple email list and CSV with columns
        const parts = line.split(',');
        const email = parts[0].trim().replace(/"/g, '').toLowerCase();
        if (email) {
          emails.push(email);
        }
      }
    }
    
    return emails;
  };

  // Validate emails and check for duplicates
  const validateEmails = (emails: string[]): ImportRow[] => {
    const seen = new Set<string>();
    const existingSet = new Set(existingClientEmails.map(e => e.toLowerCase()));
    
    return emails.map((email, index) => {
      const row: ImportRow = {
        email,
        originalRow: index + 2, // +2 because of 0-index and header row
        status: 'pending',
      };

      // Check if valid email format
      if (!emailRegex.test(email)) {
        row.status = 'invalid';
        row.message = 'Invalid email format';
        return row;
      }

      // Check for duplicates in the file
      if (seen.has(email)) {
        row.status = 'duplicate';
        row.message = 'Duplicate entry in file';
        return row;
      }
      seen.add(email);

      // Check if already a client
      if (existingSet.has(email)) {
        row.status = 'duplicate';
        row.message = 'Already connected to your practice';
        return row;
      }

      row.status = 'valid';
      row.message = 'Ready to import';
      return row;
    });
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const emails = parseCSV(content);
      
      if (emails.length === 0) {
        toast({
          title: 'No Emails Found',
          description: 'The CSV file appears to be empty or incorrectly formatted.',
          variant: 'destructive',
        });
        return;
      }

      const validatedRows = validateEmails(emails);
      setImportRows(validatedRows);
      setStep('preview');
    };
    reader.onerror = () => {
      toast({
        title: 'Error Reading File',
        description: 'Could not read the CSV file. Please try again.',
        variant: 'destructive',
      });
    };
    reader.readAsText(file);
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [existingClientEmails]);

  // Remove a row from import
  const removeRow = (index: number) => {
    setImportRows(prev => prev.filter((_, i) => i !== index));
  };

  // Start the import process
  const startImport = async () => {
    const validRows = importRows.filter(row => row.status === 'valid');
    
    if (validRows.length === 0) {
      toast({
        title: 'No Valid Emails',
        description: 'There are no valid emails to import.',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');
    setImporting(true);
    setImportProgress(0);

    const results: ImportRow[] = [...importRows];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      
      if (row.status !== 'valid') {
        continue;
      }

      try {
        const result = await addClientByEmail(row.email);
        
        if (result.success) {
          results[i] = { ...row, status: 'success', message: 'Successfully added' };
          successful++;
        } else {
          results[i] = { ...row, status: 'error', message: result.error || 'Failed to add' };
          failed++;
        }
      } catch (error: any) {
        results[i] = { ...row, status: 'error', message: error.message || 'Unknown error' };
        failed++;
      }

      // Update progress
      const progress = Math.round(((i + 1) / results.length) * 100);
      setImportProgress(progress);
      setImportRows([...results]);

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Calculate summary
    const duplicates = results.filter(r => r.status === 'duplicate').length;
    const invalid = results.filter(r => r.status === 'invalid').length;

    setSummary({
      total: results.length,
      successful,
      failed,
      duplicates,
      invalid,
    });

    setImporting(false);
    setStep('complete');
    
    if (onImportComplete) {
      onImportComplete();
    }
  };

  // Reset the import process
  const resetImport = () => {
    setStep('upload');
    setImportRows([]);
    setSummary(null);
    setImportProgress(0);
    setShowAllRows(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Close and reset
  const handleClose = () => {
    resetImport();
    onClose();
  };

  // Get counts for preview
  const getPreviewCounts = () => {
    const valid = importRows.filter(r => r.status === 'valid').length;
    const invalid = importRows.filter(r => r.status === 'invalid').length;
    const duplicate = importRows.filter(r => r.status === 'duplicate').length;
    return { valid, invalid, duplicate };
  };

  // Get status icon
  const getStatusIcon = (status: ImportRow['status']) => {
    switch (status) {
      case 'valid':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'duplicate':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />;
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status: ImportRow['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-700';
      case 'invalid':
        return 'bg-red-100 text-red-700';
      case 'duplicate':
        return 'bg-amber-100 text-amber-700';
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  const counts = getPreviewCounts();
  const displayRows = showAllRows ? importRows : importRows.slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#CFAFA3]/20 via-[#E8D5D0]/10 to-white px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CFAFA3] to-[#B89A8E] flex items-center justify-center shadow-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-900">Bulk Client Import</h2>
                <p className="text-sm text-gray-500">
                  {step === 'upload' && 'Upload a CSV file with client emails'}
                  {step === 'preview' && 'Review and confirm the import'}
                  {step === 'importing' && 'Importing clients...'}
                  {step === 'complete' && 'Import complete'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  dragActive
                    ? 'border-[#CFAFA3] bg-[#CFAFA3]/5'
                    : 'border-gray-200 hover:border-[#CFAFA3]/50 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-[#CFAFA3]" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your CSV file here
                </h3>
                <p className="text-gray-500 mb-4">
                  or click to browse your files
                </p>
                <p className="text-sm text-gray-400">
                  Supports CSV files with email addresses
                </p>
              </div>

              {/* Template Download */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <FileText className="w-5 h-5 text-[#CFAFA3]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">Need a template?</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Download our CSV template with the correct format for importing clients.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Import Instructions</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Each client must have already signed up on SkinAura PRO as a "Client"</li>
                      <li>• One email address per row in your CSV file</li>
                      <li>• Duplicate emails will be automatically detected</li>
                      <li>• Invalid email formats will be flagged for review</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-700">{counts.valid}</span>
                  </div>
                  <p className="text-sm text-green-600">Ready to import</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="text-2xl font-bold text-amber-700">{counts.duplicate}</span>
                  </div>
                  <p className="text-sm text-amber-600">Duplicates</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-2xl font-bold text-red-700">{counts.invalid}</span>
                  </div>
                  <p className="text-sm text-red-600">Invalid</p>
                </div>
              </div>

              {/* Email List */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      {importRows.length} email{importRows.length !== 1 ? 's' : ''} found
                    </h4>
                    {importRows.length > 10 && (
                      <button
                        onClick={() => setShowAllRows(!showAllRows)}
                        className="text-sm text-[#CFAFA3] font-medium flex items-center gap-1"
                      >
                        {showAllRows ? (
                          <>Show Less <ChevronUp className="w-4 h-4" /></>
                        ) : (
                          <>Show All <ChevronDown className="w-4 h-4" /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {displayRows.map((row, index) => (
                        <tr key={index} className={row.status === 'valid' ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-3 text-sm text-gray-500">{row.originalRow}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{row.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(row.status)}
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(row.status)}`}>
                                {row.message}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => removeRow(index)}
                              className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {!showAllRows && importRows.length > 10 && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
                    <span className="text-sm text-gray-500">
                      Showing 10 of {importRows.length} emails
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={resetImport}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Start Over
                </button>
                <button
                  onClick={startImport}
                  disabled={counts.valid === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Import {counts.valid} Client{counts.valid !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-10 h-10 text-[#CFAFA3] animate-spin" />
                </div>
                <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
                  Importing Clients
                </h3>
                <p className="text-gray-500 mb-6">
                  Please wait while we add your clients...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className="text-sm font-medium text-gray-900">{importProgress}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>

              {/* Live Status */}
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                <div className="divide-y divide-gray-100">
                  {importRows.filter(r => r.status === 'success' || r.status === 'error').slice(-5).map((row, index) => (
                    <div key={index} className="px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(row.status)}
                        <span className="text-sm text-gray-700">{row.email}</span>
                      </div>
                      <span className={`text-xs ${row.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {row.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && summary && (
            <div className="space-y-6">
              {/* Success/Mixed Result Icon */}
              <div className="text-center py-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  summary.failed === 0 ? 'bg-green-100' : 'bg-amber-100'
                }`}>
                  {summary.failed === 0 ? (
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-10 h-10 text-amber-600" />
                  )}
                </div>
                <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
                  {summary.failed === 0 ? 'Import Complete!' : 'Import Finished'}
                </h3>
                <p className="text-gray-500">
                  {summary.successful} of {summary.total} clients were successfully added
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                  <p className="text-2xl font-bold text-green-700">{summary.successful}</p>
                  <p className="text-xs text-green-600">Successful</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                  <p className="text-2xl font-bold text-amber-700">{summary.duplicates}</p>
                  <p className="text-xs text-amber-600">Duplicates</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                  <p className="text-2xl font-bold text-red-700">{summary.failed + summary.invalid}</p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
              </div>

              {/* Detailed Results */}
              {(summary.failed > 0 || summary.invalid > 0) && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Failed Imports</h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="divide-y divide-gray-100">
                      {importRows.filter(r => r.status === 'error' || r.status === 'invalid').map((row, index) => (
                        <div key={index} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(row.status)}
                            <span className="text-sm text-gray-700">{row.email}</span>
                          </div>
                          <span className="text-xs text-red-600">{row.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={resetImport}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Import More
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkClientImport;
