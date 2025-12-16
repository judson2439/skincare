// ShopifyProductImport.tsx - Component for professionals to import products from Shopify
import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Link as LinkIcon,
  Check,
  X,
  Loader2,
  AlertCircle,
  Package,
  RefreshCw,
  Download,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Store,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProductCatalog, PRODUCT_CATEGORIES } from '@/hooks/useProductCatalog';
import { useToast } from '@/hooks/use-toast';

interface ShopifyProduct {
  shopify_id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  image_url: string | null;
  price: number | null;
  purchase_url: string;
  tags: string[];
  status: string;
  variants_count: number;
  inventory_quantity: number;
}

interface ShopifyConnection {
  connected: boolean;
  shop?: {
    name: string;
    domain: string;
    email: string;
    currency: string;
    plan_name: string;
  };
  error?: string;
}

const ShopifyProductImport: React.FC = () => {
  const { toast } = useToast();
  const productCatalog = useProductCatalog();

  // Connection state
  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [connection, setConnection] = useState<ShopifyConnection | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Products state
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // Pagination
  const [nextPageInfo, setNextPageInfo] = useState<string | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Settings panel
  const [showSettings, setShowSettings] = useState(true);

  // Load saved credentials from localStorage
  useEffect(() => {
    const savedDomain = localStorage.getItem('shopify_domain');
    const savedToken = localStorage.getItem('shopify_token');
    if (savedDomain) setShopDomain(savedDomain);
    if (savedToken) setAccessToken(savedToken);
  }, []);

  // Verify Shopify connection
  const verifyConnection = async () => {
    if (!shopDomain.trim() || !accessToken.trim()) {
      toast({
        title: 'Missing Credentials',
        description: 'Please enter both shop domain and access token',
        variant: 'destructive',
      });
      return;
    }

    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-import', {
        body: {
          action: 'verify_connection',
          shopDomain: shopDomain.trim(),
          accessToken: accessToken.trim(),
        },
      });

      if (error) throw error;

      if (data.connected) {
        setConnection(data);
        // Save credentials
        localStorage.setItem('shopify_domain', shopDomain.trim());
        localStorage.setItem('shopify_token', accessToken.trim());
        toast({
          title: 'Connected!',
          description: `Successfully connected to ${data.shop.name}`,
        });
        // Fetch product count
        fetchProductCount();
      } else {
        setConnection({ connected: false, error: data.error });
        toast({
          title: 'Connection Failed',
          description: data.error || 'Could not connect to Shopify',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setConnection({ connected: false, error: err.message });
      toast({
        title: 'Connection Error',
        description: err.message || 'Failed to connect to Shopify',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from Shopify
  const disconnect = () => {
    setConnection(null);
    setShopifyProducts([]);
    setSelectedProducts(new Set());
    setProductCount(null);
    setNextPageInfo(null);
    localStorage.removeItem('shopify_domain');
    localStorage.removeItem('shopify_token');
    setAccessToken('');
    toast({
      title: 'Disconnected',
      description: 'Shopify connection removed',
    });
  };

  // Fetch product count
  const fetchProductCount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('shopify-import', {
        body: {
          action: 'fetch_product_count',
          shopDomain: shopDomain.trim(),
          accessToken: accessToken.trim(),
        },
      });

      if (!error && data.count !== undefined) {
        setProductCount(data.count);
      }
    } catch (err) {
      console.error('Error fetching product count:', err);
    }
  };

  // Fetch products from Shopify
  const fetchProducts = async (loadMore = false) => {
    if (!connection?.connected) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-import', {
        body: {
          action: 'fetch_products',
          shopDomain: shopDomain.trim(),
          accessToken: accessToken.trim(),
          limit: 50,
          pageInfo: loadMore ? nextPageInfo : undefined,
        },
      });

      if (error) throw error;

      if (loadMore) {
        setShopifyProducts(prev => [...prev, ...data.products]);
      } else {
        setShopifyProducts(data.products);
      }
      setNextPageInfo(data.nextPageInfo);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch products from Shopify',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle product selection
  const toggleProductSelection = (shopifyId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shopifyId)) {
        newSet.delete(shopifyId);
      } else {
        newSet.add(shopifyId);
      }
      return newSet;
    });
  };

  // Select all visible products
  const selectAllVisible = () => {
    const visibleIds = filteredProducts.map(p => p.shopify_id);
    setSelectedProducts(new Set(visibleIds));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedProducts(new Set());
  };

  // Import selected products
  const importSelectedProducts = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: 'No Products Selected',
        description: 'Please select at least one product to import',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: selectedProducts.size });

    const productsToImport = shopifyProducts.filter(p => selectedProducts.has(p.shopify_id));
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < productsToImport.length; i++) {
      const product = productsToImport[i];
      setImportProgress({ current: i + 1, total: productsToImport.length });

      try {
        const result = await productCatalog.createProduct({
          name: product.name,
          brand: product.brand,
          category: product.category,
          description: product.description || undefined,
          image_url: product.image_url || undefined,
          price: product.price || undefined,
          purchase_url: product.purchase_url,
          ingredients: [],
          skin_types: [],
        });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error('Error importing product:', err);
        errorCount++;
      }
    }

    setImporting(false);
    setSelectedProducts(new Set());

    if (successCount > 0) {
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed.` : ''}`,
      });
      productCatalog.refreshProducts();
    } else {
      toast({
        title: 'Import Failed',
        description: 'No products were imported. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter products
  const filteredProducts = shopifyProducts.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from fetched products
  const availableCategories = [...new Set(shopifyProducts.map(p => p.category))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-green-600" />
            Shopify Product Import
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Connect your Shopify store to import products directly into your catalog
          </p>
        </div>
        {connection?.connected && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </button>
        )}
      </div>

      {/* Connection Settings */}
      {(!connection?.connected || showSettings) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Shopify Connection</h3>
                <p className="text-sm text-gray-500">
                  {connection?.connected 
                    ? `Connected to ${connection.shop?.name}`
                    : 'Enter your Shopify credentials to connect'}
                </p>
              </div>
              {connection?.connected && (
                <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Connected
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Domain
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    placeholder="your-store.myshopify.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none"
                    disabled={connection?.connected}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Your Shopify store URL (e.g., mystore.myshopify.com)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="shpat_xxxxxxxxxxxxx"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none"
                    disabled={connection?.connected}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    {showToken ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Admin API access token from your Shopify app
                </p>
              </div>
            </div>

            {/* Connection info */}
            {connection?.connected && connection.shop && (
              <div className="bg-green-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Store Name</span>
                    <p className="font-medium text-gray-900">{connection.shop.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Domain</span>
                    <p className="font-medium text-gray-900">{connection.shop.domain}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Currency</span>
                    <p className="font-medium text-gray-900">{connection.shop.currency}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Plan</span>
                    <p className="font-medium text-gray-900">{connection.shop.plan_name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {connection && !connection.connected && connection.error && (
              <div className="bg-red-50 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">Connection Failed</p>
                  <p className="text-sm text-red-600">{connection.error}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {!connection?.connected ? (
                <button
                  onClick={verifyConnection}
                  disabled={connecting || !shopDomain.trim() || !accessToken.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-5 h-5" />
                      Connect to Shopify
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => fetchProducts(false)}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Fetch Products
                      </>
                    )}
                  </button>
                  <button
                    onClick={disconnect}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Disconnect
                  </button>
                </>
              )}
            </div>

            {/* Help text */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  How to get your Shopify Access Token
                </summary>
                <div className="mt-4 pl-6 text-sm text-gray-500 space-y-2">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Go to your Shopify Admin → Settings → Apps and sales channels</li>
                    <li>Click "Develop apps" → "Create an app"</li>
                    <li>Name your app and click "Create app"</li>
                    <li>Go to "Configuration" → "Admin API integration"</li>
                    <li>Select scopes: <code className="bg-gray-100 px-1 rounded">read_products</code></li>
                    <li>Click "Save" then "Install app"</li>
                    <li>Copy the Admin API access token</li>
                  </ol>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      {connection?.connected && (
        <>
          {/* Stats & Actions Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {productCount !== null && (
                  <div className="text-sm">
                    <span className="text-gray-500">Total in Shopify:</span>{' '}
                    <span className="font-semibold text-gray-900">{productCount} products</span>
                  </div>
                )}
                {shopifyProducts.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-500">Loaded:</span>{' '}
                    <span className="font-semibold text-gray-900">{shopifyProducts.length} products</span>
                  </div>
                )}
                {selectedProducts.size > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-500">Selected:</span>{' '}
                    <span className="font-semibold text-green-600">{selectedProducts.size} products</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {shopifyProducts.length > 0 && (
                  <>
                    <button
                      onClick={selectAllVisible}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Select All
                    </button>
                    {selectedProducts.size > 0 && (
                      <button
                        onClick={deselectAll}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Deselect All
                      </button>
                    )}
                  </>
                )}
                {selectedProducts.size > 0 && (
                  <button
                    onClick={importSelectedProducts}
                    disabled={importing}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing {importProgress.current}/{importProgress.total}...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Import Selected ({selectedProducts.size})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          {shopifyProducts.length > 0 && (
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
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {shopifyProducts.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
                Ready to Import
              </h3>
              <p className="text-gray-500 mb-6">
                Click "Fetch Products" to load your Shopify product catalog
              </p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.shopify_id}
                    onClick={() => toggleProductSelection(product.shopify_id)}
                    className={`bg-white rounded-2xl overflow-hidden border-2 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                      selectedProducts.has(product.shopify_id)
                        ? 'border-green-500 ring-2 ring-green-200'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
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
                          <ImageIcon className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      {/* Selection indicator */}
                      <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        selectedProducts.has(product.shopify_id)
                          ? 'bg-green-500 text-white'
                          : 'bg-white/80 text-gray-400 border border-gray-200'
                      }`}>
                        {selectedProducts.has(product.shopify_id) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      {/* Category badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-white/90 text-gray-700 text-xs font-medium rounded-full">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <p className="text-xs text-green-600 font-medium mb-1">{product.brand}</p>
                      <h4 className="font-medium text-gray-900 line-clamp-2 mb-2">{product.name}</h4>
                      
                      <div className="flex items-center justify-between text-sm">
                        {product.price !== null && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <DollarSign className="w-3 h-3" />
                            {product.price.toFixed(2)}
                          </span>
                        )}
                        {product.tags.length > 0 && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Tag className="w-3 h-3" />
                            {product.tags.length}
                          </span>
                        )}
                      </div>

                      {product.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {nextPageInfo && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => fetchProducts(true)}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-5 h-5" />
                        Load More Products
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Loading State */}
          {loading && shopifyProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
              <p className="text-gray-500">Fetching products from Shopify...</p>
            </div>
          )}
        </>
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
              Please wait while we import your selected products...
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

export default ShopifyProductImport;
