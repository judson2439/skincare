// CSVProductImport.tsx - Component for professionals to bulk import products via CSV
import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Check,
  X,
  Loader2,
  AlertCircle,
  Package,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  Edit,
  Image as ImageIcon,
  Link as LinkIcon,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';
import { useProductCatalog, PRODUCT_CATEGORIES } from '@/hooks/useProductCatalog';
import { useToast } from '@/hooks/use-toast';

interface CSVProduct {
  row: number;
  name: string;
  brand: string;
  category: string;
  description?: string;
  price?: number;
  image_url?: string;
  purchase_url?: string;
  ingredients?: string;
  skin_types?: string;
  usage_instructions?: string;
  isValid: boolean;
  errors: string[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; name: string; error: string }[];
}

const CSVProductImport: React.FC = () => {
  const { toast } = useToast();
  const productCatalog = useProductCatalog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [parsedProducts, setParsedProducts] = useState<CSVProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [editingProduct, setEditingProduct] = useState<CSVProduct | null>(null);

  // Parse CSV file
  const parseCSV = (text: string): CSVProduct[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    // Map column indices
    const columnMap: Record<string, number> = {};
    const expectedColumns = ['name', 'brand', 'category', 'description', 'price', 'image_url', 'purchase_url', 'ingredients', 'skin_types', 'usage_instructions'];
    
    header.forEach((col, idx) => {
      // Handle various column name formats
      const normalizedCol = col.replace(/[\s_-]/g, '').toLowerCase();
      if (normalizedCol.includes('name') && !normalizedCol.includes('brand')) columnMap['name'] = idx;
      else if (normalizedCol.includes('brand')) columnMap['brand'] = idx;
      else if (normalizedCol.includes('category') || normalizedCol.includes('type')) columnMap['category'] = idx;
      else if (normalizedCol.includes('description') || normalizedCol.includes('desc')) columnMap['description'] = idx;
      else if (normalizedCol.includes('price') || normalizedCol.includes('cost')) columnMap['price'] = idx;
      else if (normalizedCol.includes('image') || normalizedCol.includes('img') || normalizedCol.includes('photo')) columnMap['image_url'] = idx;
      else if (normalizedCol.includes('purchase') || normalizedCol.includes('url') || normalizedCol.includes('link') || normalizedCol.includes('shop')) columnMap['purchase_url'] = idx;
      else if (normalizedCol.includes('ingredient')) columnMap['ingredients'] = idx;
      else if (normalizedCol.includes('skin')) columnMap['skin_types'] = idx;
      else if (normalizedCol.includes('instruction') || normalizedCol.includes('usage') || normalizedCol.includes('howto')) columnMap['usage_instructions'] = idx;
    });

    // Parse data rows
    const products: CSVProduct[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const errors: string[] = [];
      
      const name = values[columnMap['name']]?.trim() || '';
      const brand = values[columnMap['brand']]?.trim() || '';
      const category = values[columnMap['category']]?.trim() || '';
      const description = values[columnMap['description']]?.trim() || '';
      const priceStr = values[columnMap['price']]?.trim() || '';
      const image_url = values[columnMap['image_url']]?.trim() || '';
      const purchase_url = values[columnMap['purchase_url']]?.trim() || '';
      const ingredients = values[columnMap['ingredients']]?.trim() || '';
      const skin_types = values[columnMap['skin_types']]?.trim() || '';
      const usage_instructions = values[columnMap['usage_instructions']]?.trim() || '';

      // Validate required fields
      if (!name) errors.push('Name is required');
      if (!brand) errors.push('Brand is required');
      if (!category) errors.push('Category is required');
      
      // Validate category
      if (category && !PRODUCT_CATEGORIES.includes(category)) {
        errors.push(`Invalid category "${category}". Valid options: ${PRODUCT_CATEGORIES.join(', ')}`);
      }

      // Parse price
      let price: number | undefined;
      if (priceStr) {
        const parsedPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsedPrice)) {
          price = parsedPrice;
        }
      }

      // Validate URLs
      if (image_url && !isValidUrl(image_url)) {
        errors.push('Invalid image URL format');
      }
      if (purchase_url && !isValidUrl(purchase_url)) {
        errors.push('Invalid purchase URL format');
      }

      products.push({
        row: i + 1,
        name,
        brand,
        category,
        description: description || undefined,
        price,
        image_url: image_url || undefined,
        purchase_url: purchase_url || undefined,
        ingredients: ingredients || undefined,
        skin_types: skin_types || undefined,
        usage_instructions: usage_instructions || undefined,
        isValid: errors.length === 0,
        errors,
      });
    }

    return products;
  };

  // Parse a single CSV line (handles quoted values with commas)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));

    return result;
  };

  // Validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please select a CSV file',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const products = parseCSV(text);
      
      if (products.length === 0) {
        toast({
          title: 'No Products Found',
          description: 'The CSV file appears to be empty or incorrectly formatted',
          variant: 'destructive',
        });
        return;
      }

      setParsedProducts(products);
      setSelectedProducts(new Set(products.filter(p => p.isValid).map(p => p.row)));
      setImportResult(null);
      
      toast({
        title: 'File Parsed',
        description: `Found ${products.length} products (${products.filter(p => p.isValid).length} valid)`,
      });
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Toggle product selection
  const toggleProductSelection = (row: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(row)) {
        newSet.delete(row);
      } else {
        newSet.add(row);
      }
      return newSet;
    });
  };

  // Select all valid products
  const selectAllValid = () => {
    setSelectedProducts(new Set(parsedProducts.filter(p => p.isValid).map(p => p.row)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedProducts(new Set());
  };

  // Import selected products
  const importProducts = async () => {
    const productsToImport = parsedProducts.filter(p => selectedProducts.has(p.row) && p.isValid);
    
    if (productsToImport.length === 0) {
      toast({
        title: 'No Products Selected',
        description: 'Please select at least one valid product to import',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: productsToImport.length });

    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < productsToImport.length; i++) {
      const product = productsToImport[i];
      setImportProgress({ current: i + 1, total: productsToImport.length });

      try {
        const createResult = await productCatalog.createProduct({
          name: product.name,
          brand: product.brand,
          category: product.category,
          description: product.description,
          price: product.price,
          image_url: product.image_url,
          purchase_url: product.purchase_url,
          ingredients: product.ingredients ? product.ingredients.split(',').map(i => i.trim()).filter(i => i) : [],
          skin_types: product.skin_types ? product.skin_types.split(',').map(t => t.trim()).filter(t => t) : [],
          usage_instructions: product.usage_instructions,
        });

        if (createResult.success) {
          result.success++;
        } else {
          result.failed++;
          result.errors.push({
            row: product.row,
            name: product.name,
            error: createResult.error || 'Unknown error',
          });
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          row: product.row,
          name: product.name,
          error: err.message || 'Import failed',
        });
      }
    }

    setImporting(false);
    setImportResult(result);

    if (result.success > 0) {
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.success} product${result.success !== 1 ? 's' : ''}${result.failed > 0 ? `. ${result.failed} failed.` : ''}`,
      });
      productCatalog.refreshProducts();
    } else {
      toast({
        title: 'Import Failed',
        description: 'No products were imported. Please check the errors.',
        variant: 'destructive',
      });
    }
  };

  // Download sample CSV
  const downloadSampleCSV = () => {
    const sampleData = `name,brand,category,description,price,image_url,purchase_url,ingredients,skin_types,usage_instructions
"Vitamin C Brightening Serum","SkinAura Essentials","Serum","A powerful brightening serum with 15% Vitamin C",45.00,"https://example.com/images/vitamin-c.jpg","https://example.com/products/vitamin-c","Vitamin C, Hyaluronic Acid, Vitamin E","All Skin Types, Dry, Normal","Apply 3-4 drops to clean skin morning and evening"
"Hyaluronic Acid Moisturizer","Glow Labs","Moisturizer","Deep hydrating moisturizer for all skin types",38.00,"https://example.com/images/ha-moisturizer.jpg","https://example.com/products/ha-moisturizer","Hyaluronic Acid, Ceramides, Squalane","Dry, Normal, Combination","Apply generously after serum"
"Retinol Night Treatment","SkinAura PRO","Treatment","Advanced anti-aging night treatment",65.00,"https://example.com/images/retinol.jpg","https://example.com/products/retinol","Retinol, Peptides, Niacinamide","Normal, Combination, Oily","Use 2-3 times per week at night"`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear imported data
  const clearData = () => {
    setParsedProducts([]);
    setSelectedProducts(new Set());
    setImportResult(null);
  };

  // Update product in preview
  const updateProduct = (row: number, updates: Partial<CSVProduct>) => {
    setParsedProducts(prev => prev.map(p => {
      if (p.row === row) {
        const updated = { ...p, ...updates };
        // Re-validate
        const errors: string[] = [];
        if (!updated.name) errors.push('Name is required');
        if (!updated.brand) errors.push('Brand is required');
        if (!updated.category) errors.push('Category is required');
        if (updated.category && !PRODUCT_CATEGORIES.includes(updated.category)) {
          errors.push(`Invalid category`);
        }
        updated.errors = errors;
        updated.isValid = errors.length === 0;
        return updated;
      }
      return p;
    }));
  };

  const validCount = parsedProducts.filter(p => p.isValid).length;
  const invalidCount = parsedProducts.filter(p => !p.isValid).length;
  const selectedCount = selectedProducts.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-teal-600" />
            CSV Bulk Import
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Import multiple products at once using a CSV file
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Help
          </button>
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
        </div>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">CSV Format Guide</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>Your CSV file should include the following columns:</p>
                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="font-medium text-blue-900">Required Columns:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li><code className="bg-blue-100 px-1 rounded">name</code> - Product name</li>
                      <li><code className="bg-blue-100 px-1 rounded">brand</code> - Brand name</li>
                      <li><code className="bg-blue-100 px-1 rounded">category</code> - Product category</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Optional Columns:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li><code className="bg-blue-100 px-1 rounded">description</code> - Product description</li>
                      <li><code className="bg-blue-100 px-1 rounded">price</code> - Price (number)</li>
                      <li><code className="bg-blue-100 px-1 rounded">image_url</code> - Product image URL</li>
                      <li><code className="bg-blue-100 px-1 rounded">purchase_url</code> - Where to buy</li>
                      <li><code className="bg-blue-100 px-1 rounded">ingredients</code> - Comma-separated</li>
                      <li><code className="bg-blue-100 px-1 rounded">skin_types</code> - Comma-separated</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-3">
                  <strong>Valid Categories:</strong> {PRODUCT_CATEGORIES.join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Area */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {parsedProducts.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-teal-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
          <p className="text-gray-500 mb-4">
            Click to select or drag and drop your CSV file here
          </p>
          <p className="text-sm text-gray-400">
            Supports .csv files with product data including image URLs and purchase links
          </p>
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{parsedProducts.length}</p>
                    <p className="text-xs text-gray-500">Total Rows</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{validCount}</p>
                    <p className="text-xs text-gray-500">Valid</p>
                  </div>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-600">{invalidCount}</p>
                      <p className="text-xs text-gray-500">Invalid</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{selectedCount}</p>
                    <p className="text-xs text-gray-500">Selected</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllValid}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Select All Valid
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Deselect All
                </button>
                <button
                  onClick={clearData}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload New
                </button>
                <button
                  onClick={importProducts}
                  disabled={importing || selectedCount === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing {importProgress.current}/{importProgress.total}...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Import Selected ({selectedCount})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className={`rounded-2xl p-4 ${importResult.failed > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-start gap-3">
                {importResult.failed > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${importResult.failed > 0 ? 'text-amber-800' : 'text-green-800'}`}>
                    Import Complete: {importResult.success} succeeded, {importResult.failed} failed
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {importResult.errors.map((err, idx) => (
                        <p key={idx} className="text-sm text-amber-700">
                          Row {err.row} ({err.name}): {err.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="font-medium">{showPreview ? 'Hide' : 'Show'} Preview</span>
          </button>

          {/* Products Preview */}
          {showPreview && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Links</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedProducts.map((product) => (
                      <tr
                        key={product.row}
                        className={`hover:bg-gray-50 ${!product.isValid ? 'bg-red-50/50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.row)}
                            onChange={() => toggleProductSelection(product.row)}
                            disabled={!product.isValid}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{product.row}</td>
                        <td className="px-4 py-3">
                          {product.isValid ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs">Valid</span>
                            </span>
                          ) : (
                            <div className="group relative">
                              <span className="flex items-center gap-1 text-red-600 cursor-help">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-xs">Invalid</span>
                              </span>
                              <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-64 p-2 bg-red-100 border border-red-200 rounded-lg text-xs text-red-700">
                                {product.errors.join(', ')}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {product.image_url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 max-w-[200px] truncate">{product.name || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600 max-w-[150px] truncate">{product.brand || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            PRODUCT_CATEGORIES.includes(product.category)
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {product.category || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {product.price !== undefined ? (
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <DollarSign className="w-3 h-3" />
                              {product.price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {product.image_url && (
                              <a
                                href={product.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-gray-100 rounded"
                                title="View Image"
                              >
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              </a>
                            )}
                            {product.purchase_url && (
                              <a
                                href={product.purchase_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-gray-100 rounded"
                                title="View Purchase Link"
                              >
                                <LinkIcon className="w-4 h-4 text-gray-400" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Edit Product (Row {editingProduct.row})</h3>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                <input
                  type="text"
                  value={editingProduct.brand}
                  onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                >
                  <option value="">Select category...</option>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.price || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={editingProduct.image_url || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value || undefined })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase URL</label>
                <input
                  type="url"
                  value={editingProduct.purchase_url || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, purchase_url: e.target.value || undefined })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {editingProduct.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-700 font-medium">Validation Errors:</p>
                <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                  {editingProduct.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateProduct(editingProduct.row, editingProduct);
                  setEditingProduct(null);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Progress Modal */}
      {importing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center">
            <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
              Importing Products
            </h3>
            <p className="text-gray-500 mb-4">
              Please wait while we import your products...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-teal-500 to-teal-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              {importProgress.current} of {importProgress.total} products
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVProductImport;
