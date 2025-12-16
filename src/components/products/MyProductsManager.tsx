// MyProductsManager.tsx - Component for clients to manage their products
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
} from 'lucide-react';
import { useClientProducts, ClientProduct, PRODUCT_CATEGORIES } from '@/hooks/useClientProducts';
import { useToast } from '@/hooks/use-toast';

interface MyProductsManagerProps {
  onProductAdded?: (product: ClientProduct) => void;
}

const MyProductsManager: React.FC<MyProductsManagerProps> = ({ onProductAdded }) => {
  const clientProducts = useClientProducts();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ClientProduct | null>(null);

  // Form states
  const [productName, setProductName] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productNotes, setProductNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Photo upload states
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Reset form
  const resetForm = () => {
    setProductName('');
    setProductBrand('');
    setProductCategory('');
    setProductNotes('');
    setPhotoPreview(null);
    setSelectedFile(null);
  };

  // Handle manual product add
  const handleAddProduct = async () => {
    if (!productName.trim()) {
      toast({ title: 'Error', description: 'Please enter a product name', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const result = await clientProducts.addProduct({
      name: productName.trim(),
      brand: productBrand.trim() || undefined,
      category: productCategory || undefined,
      notes: productNotes.trim() || undefined,
      added_via: 'manual',
    });
    setSaving(false);

    if (result.success) {
      toast({ title: 'Success', description: 'Product added to your collection!' });
      setShowAddModal(false);
      resetForm();
      if (onProductAdded && result.product) {
        onProductAdded(result.product);
      }
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to add product', variant: 'destructive' });
    }
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
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle product add from photo
  const handleAddProductFromPhoto = async () => {
    if (!selectedFile) {
      toast({ title: 'Error', description: 'Please select a photo', variant: 'destructive' });
      return;
    }

    if (!productName.trim()) {
      toast({ title: 'Error', description: 'Please enter a product name', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const result = await clientProducts.addProductFromPhoto(
      selectedFile,
      productName.trim(),
      productBrand.trim() || undefined,
      productCategory || undefined,
      productNotes.trim() || undefined
    );
    setSaving(false);

    if (result.success) {
      toast({ title: 'Success', description: 'Product added with photo!' });
      setShowPhotoModal(false);
      resetForm();
      if (onProductAdded && result.product) {
        onProductAdded(result.product);
      }
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to add product', variant: 'destructive' });
    }
  };

  // Handle product update
  const handleUpdateProduct = async () => {
    if (!selectedProduct || !productName.trim()) {
      toast({ title: 'Error', description: 'Please enter a product name', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const result = await clientProducts.updateProduct(selectedProduct.id, {
      name: productName.trim(),
      brand: productBrand.trim() || undefined,
      category: productCategory || undefined,
      notes: productNotes.trim() || undefined,
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
    if (!confirm('Are you sure you want to remove this product?')) return;

    const result = await clientProducts.deleteProduct(productId);
    if (result.success) {
      toast({ title: 'Success', description: 'Product removed' });
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to remove product', variant: 'destructive' });
    }
  };

  // Open edit modal
  const openEditModal = (product: ClientProduct) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setProductBrand(product.brand || '');
    setProductCategory(product.category || '');
    setProductNotes(product.notes || '');
    setShowEditModal(true);
  };

  // Filter products
  const filteredProducts = clientProducts.products.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

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

      {/* Header with Add Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">My Products</h2>
          <p className="text-sm text-gray-500">Track the products you're currently using</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { resetForm(); setShowPhotoModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Camera className="w-4 h-4" /> Add with Photo
          </button>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
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
            className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-teal-400 outline-none"
          >
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {clientProducts.loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!clientProducts.loading && filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-teal-600" />
          </div>
          <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
            {searchQuery || categoryFilter !== 'all' ? 'No Products Found' : 'No Products Yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add the skincare products you\'re currently using to track your routine'}
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { resetForm(); setShowPhotoModal(true); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-teal-500 text-teal-600 rounded-xl font-medium hover:bg-teal-50 transition-all"
              >
                <Camera className="w-5 h-5" /> Upload Product Photo
              </button>
              <button
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" /> Add Manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Grid */}
      {!clientProducts.loading && filteredProducts.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-50">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {/* Added via badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.added_via === 'photo'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-teal-100 text-teal-700'
                  }`}>
                    {product.added_via === 'photo' ? 'Photo' : 'Manual'}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                {product.brand && (
                  <p className="text-xs text-teal-600 font-medium mb-1">{product.brand}</p>
                )}
                <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">{product.name}</h4>
                {product.category && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {product.category}
                  </span>
                )}
                {product.notes && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.notes}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Added {new Date(product.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal (Manual) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Add Product</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                  placeholder="e.g., Vitamin C Serum"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <input
                  type="text"
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                  placeholder="e.g., The Ordinary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                >
                  <option value="">Select category...</option>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={productNotes}
                  onChange={(e) => setProductNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none resize-none"
                  rows={3}
                  placeholder="Any notes about this product..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={saving || !productName.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product from Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Add Product with Photo</h3>
              <button onClick={() => { setShowPhotoModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Upload Area */}
            <div className="mb-6">
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={photoPreview} alt="Product preview" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => { setPhotoPreview(null); setSelectedFile(null); }}
                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-teal-600" />
                  </div>
                  <p className="text-gray-600 mb-4">Take a photo or upload an image of your product</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                  placeholder="e.g., Vitamin C Serum"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <input
                  type="text"
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                  placeholder="e.g., The Ordinary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                >
                  <option value="">Select category...</option>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={productNotes}
                  onChange={(e) => setProductNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none resize-none"
                  rows={2}
                  placeholder="Any notes about this product..."
                />
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
                disabled={saving || clientProducts.uploading || !productName.trim() || !selectedFile}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving || clientProducts.uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {clientProducts.uploading ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Add Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold">Edit Product</h3>
              <button onClick={() => { setShowEditModal(false); setSelectedProduct(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Show existing image if available */}
            {selectedProduct.image_url && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-32 object-cover" />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <input
                  type="text"
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                >
                  <option value="">Select category...</option>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={productNotes}
                  onChange={(e) => setProductNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setSelectedProduct(null); resetForm(); }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProduct}
                disabled={saving || !productName.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProductsManager;
