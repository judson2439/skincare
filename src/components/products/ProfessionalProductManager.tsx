// ProfessionalProductManager.tsx - Component for professionals to manage products with photo upload and AI recognition
import React, { useState, useRef } from 'react';
import {
  Plus,
  Camera,
  Upload,
  Package,
  X,
  Loader2,
  Edit,
  Trash2,
  Search,
  Filter,
  Check,
  Image as ImageIcon,
  DollarSign,
  Link,
  ExternalLink,
  Heart,
  FileSpreadsheet,
  ShoppingBag,
  Tag,
  Beaker,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Wand2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useProductCatalog, Product, PRODUCT_CATEGORIES, SKIN_TYPES, CreateProductInput } from '@/hooks/useProductCatalog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import CSVProductImport from './CSVProductImport';
import ShopifyProductImport from './ShopifyProductImport';

type ImportMethod = 'none' | 'csv' | 'shopify';

interface AIRecognitionResult {
  name: string;
  brand: string;
  category: string;
  description: string;
  ingredients: string[];
  skinTypes: string[];
  confidence: 'high' | 'medium' | 'low';
}

// Utility function to compress and resize image before sending to AI
const compressImage = (
  base64String: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed JPEG
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = base64String;
  });
};

const ProfessionalProductManager: React.FC = () => {
  const { user } = useAuth();
  const productCatalog = useProductCatalog();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // View states
  const [activeTab, setActiveTab] = useState<'products' | 'import'>('products');
  const [importMethod, setImportMethod] = useState<ImportMethod>('none');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [productName, setProductName] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productIngredients, setProductIngredients] = useState('');
  const [productSkinTypes, setProductSkinTypes] = useState<string[]>([]);
  const [productInstructions, setProductInstructions] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Photo upload states
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // AI Recognition states
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIRecognitionResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Reset form
  const resetForm = () => {
    setProductName('');
    setProductBrand('');
    setProductCategory('');
    setProductDescription('');
    setProductIngredients('');
    setProductSkinTypes([]);
    setProductInstructions('');
    setProductPrice('');
    setProductUrl('');
    setProductImageUrl('');
    setPhotoPreview(null);
    setSelectedFile(null);
    setAiResult(null);
    setAiError(null);
  };

  // Toggle skin type selection
  const toggleSkinType = (skinType: string) => {
    setProductSkinTypes(prev =>
      prev.includes(skinType)
        ? prev.filter(t => t !== skinType)
        : [...prev, skinType]
    );
  };

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 10MB', variant: 'destructive' });
      return;
    }

    setSelectedFile(file);
    setAiResult(null);
    setAiError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // AI Product Recognition with image compression
  const analyzeProductImage = async () => {
    if (!photoPreview) {
      toast({ title: 'Error', description: 'Please upload a photo first', variant: 'destructive' });
      return;
    }

    setAnalyzing(true);
    setAiError(null);
    setAiResult(null);

    try {
      // Compress the image before sending to reduce payload size
      toast({ title: 'Processing', description: 'Compressing image for analysis...' });
      
      const compressedImage = await compressImage(photoPreview, 800, 800, 0.6);
      
      // Log the size for debugging
      const originalSize = Math.round(photoPreview.length / 1024);
      const compressedSize = Math.round(compressedImage.length / 1024);
      console.log(`Image compressed: ${originalSize}KB -> ${compressedSize}KB`);

      const { data, error } = await supabase.functions.invoke('ai-product-recognition', {
        body: { imageBase64: compressedImage }
      });

      if (error) throw error;

      if (data.success && data.product) {
        const product = data.product as AIRecognitionResult;
        setAiResult(product);

        // Auto-fill form fields with AI results
        if (product.name) setProductName(product.name);
        if (product.brand) setProductBrand(product.brand);
        if (product.category && PRODUCT_CATEGORIES.includes(product.category)) {
          setProductCategory(product.category);
        }
        if (product.description) setProductDescription(product.description);
        if (product.ingredients && product.ingredients.length > 0) {
          setProductIngredients(product.ingredients.join(', '));
        }
        if (product.skinTypes && product.skinTypes.length > 0) {
          const validSkinTypes = product.skinTypes.filter(st => SKIN_TYPES.includes(st));
          setProductSkinTypes(validSkinTypes);
        }

        toast({
          title: 'Product Identified!',
          description: `Detected: ${product.name || 'Unknown product'} by ${product.brand || 'Unknown brand'}`,
        });
      } else {
        throw new Error(data.error || 'Failed to analyze image');
      }
    } catch (err: any) {
      console.error('AI recognition error:', err);
      const errorMessage = err.message || 'Failed to analyze product image';
      setAiError(errorMessage);
      toast({
        title: 'Analysis Failed',
        description: errorMessage.includes('too large') 
          ? 'Image is too large. Please try a smaller image or take a new photo.'
          : 'Could not identify the product. Please fill in the details manually.',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
    }
  };


  // Upload photo to storage
  const uploadProductPhoto = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setUploading(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/catalog/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      return { success: true, url: publicUrl };
    } catch (err: any) {
      console.error('Error uploading product photo:', err);
      return { success: false, error: err.message };
    } finally {
      setUploading(false);
    }
  };

  // Handle manual product add
  const handleAddProduct = async () => {
    if (!productName.trim() || !productBrand.trim() || !productCategory) {
      toast({ title: 'Error', description: 'Please fill in required fields (Name, Brand, Category)', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const result = await productCatalog.createProduct({
        name: productName.trim(),
        brand: productBrand.trim(),
        category: productCategory,
        description: productDescription.trim() || undefined,
        ingredients: productIngredients ? productIngredients.split(',').map(i => i.trim()).filter(i => i) : [],
        skin_types: productSkinTypes,
        usage_instructions: productInstructions.trim() || undefined,
        price: productPrice ? parseFloat(productPrice) : undefined,
        purchase_url: productUrl.trim() || undefined,
        image_url: productImageUrl.trim() || undefined,
      });

      if (result.success) {
        toast({ title: 'Success', description: 'Product added to your catalog!' });
        setShowAddModal(false);
        resetForm();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to add product', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Error adding product:', err);
      toast({ title: 'Error', description: err.message || 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Handle product add from photo
  const handleAddProductFromPhoto = async () => {
    if (!productName.trim() || !productBrand.trim() || !productCategory) {
      toast({ title: 'Error', description: 'Please fill in required fields (Name, Brand, Category)', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      let imageUrl: string | undefined = undefined;

      // Upload photo if one was selected
      if (selectedFile) {
        const uploadResult = await uploadProductPhoto(selectedFile);
        if (!uploadResult.success) {
          // Photo upload failed, but we can still save the product without a photo
          console.warn('Photo upload failed:', uploadResult.error);
          toast({ 
            title: 'Warning', 
            description: 'Photo upload failed, but product will be saved without an image.', 
            variant: 'default' 
          });
        } else {
          imageUrl = uploadResult.url;
        }
      }

      // Create the product (with or without photo)
      const result = await productCatalog.createProduct({
        name: productName.trim(),
        brand: productBrand.trim(),
        category: productCategory,
        description: productDescription.trim() || undefined,
        ingredients: productIngredients ? productIngredients.split(',').map(i => i.trim()).filter(i => i) : [],
        skin_types: productSkinTypes,
        usage_instructions: productInstructions.trim() || undefined,
        price: productPrice ? parseFloat(productPrice) : undefined,
        purchase_url: productUrl.trim() || undefined,
        image_url: imageUrl,
      });

      if (result.success) {
        toast({ title: 'Success', description: 'Product added to your catalog!' });
        setShowPhotoModal(false);
        resetForm();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to add product', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Error adding product from photo:', err);
      toast({ title: 'Error', description: err.message || 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };


  // Handle product update
  const handleUpdateProduct = async () => {
    if (!selectedProduct || !productName.trim() || !productBrand.trim() || !productCategory) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    setSaving(true);

    // If there's a new photo selected, upload it first
    let imageUrl = productImageUrl;
    if (selectedFile) {
      const uploadResult = await uploadProductPhoto(selectedFile);
      if (uploadResult.success && uploadResult.url) {
        imageUrl = uploadResult.url;
      }
    }

    const result = await productCatalog.updateProduct(selectedProduct.id, {
      name: productName.trim(),
      brand: productBrand.trim(),
      category: productCategory,
      description: productDescription.trim() || undefined,
      ingredients: productIngredients ? productIngredients.split(',').map(i => i.trim()).filter(i => i) : [],
      skin_types: productSkinTypes,
      usage_instructions: productInstructions.trim() || undefined,
      price: productPrice ? parseFloat(productPrice) : undefined,
      purchase_url: productUrl.trim() || undefined,
      image_url: imageUrl || undefined,
    });
    setSaving(false);

    if (result.success) {
      toast({ title: 'Success', description: 'Product updated!' });
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to update product', variant: 'destructive' });
    }
  };

  // Handle product delete
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const result = await productCatalog.deleteProduct(productId);
    if (result.success) {
      toast({ title: 'Success', description: 'Product deleted' });
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to delete product', variant: 'destructive' });
    }
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setProductBrand(product.brand);
    setProductCategory(product.category);
    setProductDescription(product.description || '');
    setProductIngredients(product.ingredients.join(', '));
    setProductSkinTypes(product.skin_types);
    setProductInstructions(product.usage_instructions || '');
    setProductPrice(product.price?.toString() || '');
    setProductUrl(product.purchase_url || '');
    setProductImageUrl(product.image_url || '');
    setPhotoPreview(product.image_url || null);
    setShowEditModal(true);
  };

  // Filter products
  const myProducts = productCatalog.getMyProducts();
  const filteredProducts = myProducts.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Stats
  const totalProducts = myProducts.length;
  const categoriesCount = new Set(myProducts.map(p => p.category)).size;
  const brandsCount = new Set(myProducts.map(p => p.brand)).size;
  const productsWithImages = myProducts.filter(p => p.image_url).length;

  // Confidence badge color
  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Product Library</h2>
          <p className="text-gray-500">Manage your skincare product catalog with AI-powered recognition</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { resetForm(); setShowPhotoModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" /> AI Photo Scan
          </button>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-[#CFAFA3] text-[#CFAFA3]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            My Products ({totalProducts})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'import'
              ? 'border-[#CFAFA3] text-[#CFAFA3]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Bulk Import
          </div>
        </button>
      </div>

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#CFAFA3]/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#CFAFA3]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                  <p className="text-xs text-gray-500">Total Products</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{productsWithImages}</p>
                  <p className="text-xs text-gray-500">With Photos</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{categoriesCount}</p>
                  <p className="text-xs text-gray-500">Categories</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{brandsCount}</p>
                  <p className="text-xs text-gray-500">Brands</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, brand, or ingredient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm flex-1"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#CFAFA3] outline-none"
              >
                <option value="all">All Categories</option>
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading State */}
          {productCatalog.loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#CFAFA3] animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!productCatalog.loading && filteredProducts.length === 0 && (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-[#CFAFA3]/10 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-[#CFAFA3]" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
                {searchQuery || categoryFilter !== 'all' ? 'No Products Found' : 'No Products Yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first product using AI photo recognition or manually'}
              </p>
              {!searchQuery && categoryFilter === 'all' && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => { resetForm(); setShowPhotoModal(true); }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    <Sparkles className="w-5 h-5" /> AI Photo Scan
                  </button>
                  <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#CFAFA3] text-[#CFAFA3] rounded-xl font-medium hover:bg-[#CFAFA3]/5 transition-all"
                  >
                    <Plus className="w-5 h-5" /> Add Manually
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Products Grid */}
          {!productCatalog.loading && filteredProducts.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    {/* Price badge */}
                    {product.price && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 text-gray-900 text-sm font-medium rounded-full flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {product.price.toFixed(2)}
                      </div>
                    )}
                    {/* Category badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-[#CFAFA3] text-white text-xs font-medium rounded-full">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <p className="text-xs text-[#CFAFA3] font-medium mb-1">{product.brand}</p>
                    <h4 className="font-medium text-gray-900 line-clamp-1 mb-2">{product.name}</h4>

                    {product.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                    )}

                    {/* Skin Types */}
                    {product.skin_types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.skin_types.slice(0, 3).map((type, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#CFAFA3]/10 text-[#CFAFA3] text-xs rounded-full">{type}</span>
                        ))}
                        {product.skin_types.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">+{product.skin_types.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                        {product.purchase_url && (
                          <a
                            href={product.purchase_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Product"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowRecommendModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#CFAFA3]/10 text-[#CFAFA3] rounded-lg text-sm font-medium hover:bg-[#CFAFA3]/20 transition-colors"
                      >
                        <Heart className="w-4 h-4" /> Recommend
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Import Tab Content */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Import Method Selection */}
          {importMethod === 'none' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* CSV Import Card */}
              <div
                onClick={() => setImportMethod('csv')}
                className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-[#CFAFA3] cursor-pointer transition-all hover:shadow-lg group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">CSV Bulk Import</h3>
                <p className="text-gray-500 mb-4">
                  Upload a CSV file with your product data including names, brands, categories, prices, and image URLs.
                </p>
                <div className="flex items-center gap-2 text-[#CFAFA3] font-medium">
                  <span>Get Started</span>
                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </div>
              </div>

              {/* Shopify Import Card */}
              <div
                onClick={() => setImportMethod('shopify')}
                className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-green-500 cursor-pointer transition-all hover:shadow-lg group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Shopify Import</h3>
                <p className="text-gray-500 mb-4">
                  Connect your Shopify store and import products directly with images, prices, and descriptions.
                </p>
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <span>Connect Store</span>
                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </div>
              </div>
            </div>
          )}

          {/* CSV Import Component */}
          {importMethod === 'csv' && (
            <div>
              <button
                onClick={() => setImportMethod('none')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
                <span>Back to Import Options</span>
              </button>
              <CSVProductImport />
            </div>
          )}

          {/* Shopify Import Component */}
          {importMethod === 'shopify' && (
            <div>
              <button
                onClick={() => setImportMethod('none')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
                <span>Back to Import Options</span>
              </button>
              <ShopifyProductImport />
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal (Manual) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Add New Product</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  placeholder="e.g., Vitamin C Brightening Serum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                <input
                  type="text"
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  placeholder="e.g., SkinAura Essentials"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                >
                  <option value="">Select category...</option>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (Optional)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                rows={2}
                placeholder="Brief product description..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Key Ingredients (comma-separated)</label>
              <textarea
                value={productIngredients}
                onChange={(e) => setProductIngredients(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                rows={2}
                placeholder="e.g., Vitamin C, Hyaluronic Acid, Niacinamide"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Skin Type Compatibility</label>
              <div className="flex flex-wrap gap-2">
                {SKIN_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleSkinType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      productSkinTypes.includes(type)
                        ? 'bg-[#CFAFA3] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Usage Instructions</label>
              <textarea
                value={productInstructions}
                onChange={(e) => setProductInstructions(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                rows={2}
                placeholder="e.g., Apply 3-4 drops to clean skin morning and evening..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (Optional)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={productImageUrl}
                    onChange={(e) => setProductImageUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase URL (Optional)</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={saving || !productName.trim() || !productBrand.trim() || !productCategory}
                className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product from Photo Modal with AI Recognition */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI Product Scanner
                </h3>
                <p className="text-sm text-gray-500 mt-1">Upload a photo and let AI identify the product</p>
              </div>
              <button onClick={() => { setShowPhotoModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Upload Area */}
            <div className="mb-6">
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={photoPreview} alt="Product preview" className="w-full h-64 object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => { setPhotoPreview(null); setSelectedFile(null); setAiResult(null); setAiError(null); }}
                      className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* AI Scan Button Overlay */}
                  {!aiResult && !analyzing && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                      <button
                        onClick={analyzeProductImage}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Wand2 className="w-5 h-5" />
                        Analyze with AI
                      </button>
                    </div>
                  )}
                  {/* Analyzing Overlay */}
                  {analyzing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                      <p className="text-white font-medium">Analyzing product...</p>
                      <p className="text-white/70 text-sm">AI is identifying your product</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gradient-to-br from-purple-50 to-indigo-50">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-700 font-medium mb-2">Upload a product photo</p>
                  <p className="text-gray-500 text-sm mb-4">AI will automatically identify the product name, brand, and category</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      <Camera className="w-4 h-4" /> Take Photo
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" /> Upload Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Recognition Result */}
            {aiResult && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-green-900">Product Identified!</h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getConfidenceBadge(aiResult.confidence)}`}>
                        {aiResult.confidence} confidence
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      {aiResult.name ? `${aiResult.name}` : 'Unknown product'} 
                      {aiResult.brand ? ` by ${aiResult.brand}` : ''}
                    </p>
                    <p className="text-xs text-green-600 mt-1">Form fields have been pre-filled. Review and adjust as needed.</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Error */}
            {aiError && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Analysis Failed</h4>
                    <p className="text-sm text-red-700">{aiError}</p>
                    <button
                      onClick={analyzeProductImage}
                      className="mt-2 text-sm text-red-600 font-medium hover:text-red-800"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                  {aiResult?.name && <span className="ml-2 text-xs text-purple-500">(AI detected)</span>}
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none ${
                    aiResult?.name ? 'border-purple-200 bg-purple-50/50' : 'border-gray-200'
                  }`}
                  placeholder="e.g., Vitamin C Serum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                  {aiResult?.brand && <span className="ml-2 text-xs text-purple-500">(AI detected)</span>}
                </label>
                <input
                  type="text"
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none ${
                    aiResult?.brand ? 'border-purple-200 bg-purple-50/50' : 'border-gray-200'
                  }`}
                  placeholder="e.g., The Ordinary"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                  {aiResult?.category && <span className="ml-2 text-xs text-purple-500">(AI detected)</span>}
                </label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none ${
                    aiResult?.category ? 'border-purple-200 bg-purple-50/50' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select category...</option>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (Optional)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
                {aiResult?.description && <span className="ml-2 text-xs text-purple-500">(AI detected)</span>}
              </label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none ${
                  aiResult?.description ? 'border-purple-200 bg-purple-50/50' : 'border-gray-200'
                }`}
                rows={2}
                placeholder="Brief product description..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Ingredients (comma-separated)
                {aiResult?.ingredients && aiResult.ingredients.length > 0 && (
                  <span className="ml-2 text-xs text-purple-500">(AI detected)</span>
                )}
              </label>
              <textarea
                value={productIngredients}
                onChange={(e) => setProductIngredients(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none ${
                  aiResult?.ingredients && aiResult.ingredients.length > 0 ? 'border-purple-200 bg-purple-50/50' : 'border-gray-200'
                }`}
                rows={2}
                placeholder="e.g., Vitamin C, Hyaluronic Acid, Niacinamide"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skin Type Compatibility
                {aiResult?.skinTypes && aiResult.skinTypes.length > 0 && (
                  <span className="ml-2 text-xs text-purple-500">(AI detected)</span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {SKIN_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleSkinType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      productSkinTypes.includes(type)
                        ? 'bg-[#CFAFA3] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowPhotoModal(false); resetForm(); }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProductFromPhoto}
                disabled={saving || uploading || analyzing || !productName.trim() || !productBrand.trim() || !productCategory}
                className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving || uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploading ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> {selectedFile ? 'Add Product' : 'Add Without Photo'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Edit Product</h3>
              <button onClick={() => { setShowEditModal(false); setSelectedProduct(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current/New Image */}
            <div className="mb-6">
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={photoPreview} alt="Product" className="w-full h-48 object-cover" />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white/90 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition-colors flex items-center gap-1"
                    >
                      <Camera className="w-4 h-4" /> Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#CFAFA3] transition-colors"
                >
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to add a product photo</p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                <input
                  type="text"
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                >
                  <option value="">Select category...</option>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                rows={2}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Key Ingredients (comma-separated)</label>
              <textarea
                value={productIngredients}
                onChange={(e) => setProductIngredients(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                rows={2}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Skin Type Compatibility</label>
              <div className="flex flex-wrap gap-2">
                {SKIN_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleSkinType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      productSkinTypes.includes(type)
                        ? 'bg-[#CFAFA3] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Usage Instructions</label>
              <textarea
                value={productInstructions}
                onChange={(e) => setProductInstructions(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none resize-none"
                rows={2}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase URL</label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CFAFA3] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowEditModal(false); setSelectedProduct(null); resetForm(); }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProduct}
                disabled={saving || uploading || !productName.trim() || !productBrand.trim() || !productCategory}
                className="flex-1 py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommend Product Modal - Placeholder */}
      {showRecommendModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Recommend Product</h3>
              <button onClick={() => { setShowRecommendModal(false); setSelectedProduct(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-xs text-[#CFAFA3] font-medium">{selectedProduct.brand}</p>
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500">{selectedProduct.category}</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 text-center mb-4">
              To recommend this product to a client, go to their profile and use the product recommendation feature.
            </p>

            <button
              onClick={() => { setShowRecommendModal(false); setSelectedProduct(null); }}
              className="w-full py-3 bg-gradient-to-r from-[#CFAFA3] to-[#B89A8E] text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalProductManager;
