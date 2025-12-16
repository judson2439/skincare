import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Product {
  id: string;
  created_at: string;
  updated_at: string;
  professional_id: string | null;
  name: string;
  brand: string;
  category: string;
  description: string | null;
  ingredients: string[];
  skin_types: string[];
  usage_instructions: string | null;
  image_url: string | null;
  purchase_url: string | null;
  price: number | null;
  is_active: boolean;
}

export interface ProductRecommendation {
  id: string;
  created_at: string;
  professional_id: string;
  client_id: string;
  product_id: string;
  notes: string | null;
  is_active: boolean;
  product?: Product;
}

export interface CreateProductInput {
  name: string;
  brand: string;
  category: string;
  description?: string;
  ingredients?: string[];
  skin_types?: string[];
  usage_instructions?: string;
  image_url?: string;
  purchase_url?: string;
  price?: number;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  is_active?: boolean;
}

export const PRODUCT_CATEGORIES = [
  'Cleanser',
  'Toner',
  'Serum',
  'Moisturizer',
  'Sunscreen',
  'Treatment',
  'Eye Cream',
  'Mask',
  'Oil',
  'Exfoliant',
  'Essence',
  'Mist',
  'Lip Care',
  'Body Care',
];

export const SKIN_TYPES = [
  'Normal',
  'Dry',
  'Oily',
  'Combination',
  'Sensitive',
  'Acne-Prone',
  'Mature',
];

export function useProductCatalog() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to track if we've already fetched to prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const isProfessional = profile?.role === 'professional';
  const isClient = profile?.role === 'client';

  // Fetch products - memoized with stable dependencies
  const fetchProducts = useCallback(async () => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      return;
    }
    
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      let data: Product[] | null = null;
      let fetchError: any = null;

      // If professional, get their own products plus all active products
      if (isProfessional) {
        // First, get all active products
        const { data: activeProducts, error: activeError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (activeError) {
          fetchError = activeError;
        } else {
          // Then get professional's own products (including inactive)
          const { data: myProducts, error: myError } = await supabase
            .from('products')
            .select('*')
            .eq('professional_id', user.id)
            .order('created_at', { ascending: false });

          if (myError) {
            fetchError = myError;
          } else {
            // Merge and deduplicate
            const allProducts = [...(myProducts || [])];
            const myProductIds = new Set(allProducts.map(p => p.id));
            
            (activeProducts || []).forEach(p => {
              if (!myProductIds.has(p.id)) {
                allProducts.push(p);
              }
            });
            
            data = allProducts;
          }
        }
      } else {
        // For clients, just get active products
        const result = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        data = result.data;
        fetchError = result.error;
      }

      if (fetchError) {
        console.error('Error fetching products:', fetchError);
        setError(fetchError.message);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id, isProfessional]);

  // Fetch recommendations for clients
  const fetchRecommendations = useCallback(async () => {
    if (!user || !isClient) {
      return;
    }

    try {
      // First fetch recommendations
      const { data: recommendationsData, error: fetchError } = await supabase
        .from('product_recommendations')
        .select('*')
        .eq('client_id', user.id)
        .eq('is_active', true);

      if (fetchError) {
        console.error('Error fetching recommendations:', fetchError);
        setRecommendations([]);
        return;
      }

      if (!recommendationsData || recommendationsData.length === 0) {
        setRecommendations([]);
        return;
      }

      // Get unique product IDs from recommendations
      const productIds = [...new Set(recommendationsData.map(r => r.product_id))];

      // Fetch the related products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (productsError) {
        console.error('Error fetching recommendation products:', productsError);
        // Still set recommendations without product details
        setRecommendations(recommendationsData);
        return;
      }

      // Create a map of products by ID for quick lookup
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);

      // Combine recommendations with their products
      const recommendationsWithProducts = recommendationsData.map(rec => ({
        ...rec,
        product: productsMap.get(rec.product_id) || undefined
      }));

      setRecommendations(recommendationsWithProducts);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      // Set empty array on error to prevent UI issues
      setRecommendations([]);
    }
  }, [user?.id, isClient]);


  // Create a new product
  const createProduct = async (input: CreateProductInput): Promise<{ success: boolean; product?: Product; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can create products' };
    }

    try {
      const { data, error: createError } = await supabase
        .from('products')
        .insert({
          ...input,
          professional_id: user.id,
          ingredients: input.ingredients || [],
          skin_types: input.skin_types || [],
        })
        .select()
        .single();

      if (createError) throw createError;

      setProducts(prev => [data, ...prev]);
      return { success: true, product: data };
    } catch (err: any) {
      console.error('Error creating product:', err);
      return { success: false, error: err.message };
    }
  };

  // Update a product
  const updateProduct = async (productId: string, input: UpdateProductInput): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can update products' };
    }

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('professional_id', user.id);

      if (updateError) throw updateError;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, ...input, updated_at: new Date().toISOString() } : p
      ));
      return { success: true };
    } catch (err: any) {
      console.error('Error updating product:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete a product
  const deleteProduct = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can delete products' };
    }

    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('professional_id', user.id);

      if (deleteError) throw deleteError;

      setProducts(prev => prev.filter(p => p.id !== productId));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting product:', err);
      return { success: false, error: err.message };
    }
  };

  // Recommend a product to a client
  const recommendProduct = async (
    clientId: string,
    productId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can recommend products' };
    }

    try {
      const { error: recommendError } = await supabase
        .from('product_recommendations')
        .upsert({
          professional_id: user.id,
          client_id: clientId,
          product_id: productId,
          notes,
          is_active: true,
        }, {
          onConflict: 'professional_id,client_id,product_id',
        });

      if (recommendError) throw recommendError;
      return { success: true };
    } catch (err: any) {
      console.error('Error recommending product:', err);
      return { success: false, error: err.message };
    }
  };

  // Remove a recommendation
  const removeRecommendation = async (recommendationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can remove recommendations' };
    }

    try {
      const { error: deleteError } = await supabase
        .from('product_recommendations')
        .delete()
        .eq('id', recommendationId)
        .eq('professional_id', user.id);

      if (deleteError) throw deleteError;
      return { success: true };
    } catch (err: any) {
      console.error('Error removing recommendation:', err);
      return { success: false, error: err.message };
    }
  };

  // Link product to routine step
  const linkProductToStep = async (
    routineStepId: string,
    productId: string,
    isPrimary: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can link products' };
    }

    try {
      const { error: linkError } = await supabase
        .from('routine_step_products')
        .insert({
          routine_step_id: routineStepId,
          product_id: productId,
          is_primary: isPrimary,
        });

      if (linkError) throw linkError;
      return { success: true };
    } catch (err: any) {
      console.error('Error linking product:', err);
      return { success: false, error: err.message };
    }
  };

  // Unlink product from routine step
  const unlinkProductFromStep = async (
    routineStepId: string,
    productId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isProfessional) {
      return { success: false, error: 'Only professionals can unlink products' };
    }

    try {
      const { error: unlinkError } = await supabase
        .from('routine_step_products')
        .delete()
        .eq('routine_step_id', routineStepId)
        .eq('product_id', productId);

      if (unlinkError) throw unlinkError;
      return { success: true };
    } catch (err: any) {
      console.error('Error unlinking product:', err);
      return { success: false, error: err.message };
    }
  };

  // Get products by category
  const getProductsByCategory = (category: string): Product[] => {
    return products.filter(p => p.category === category && p.is_active);
  };

  // Get products by skin type
  const getProductsBySkinType = (skinType: string): Product[] => {
    return products.filter(p => p.skin_types.includes(skinType) && p.is_active);
  };

  // Get my products (for professionals)
  const getMyProducts = (): Product[] => {
    if (!user || !isProfessional) return [];
    return products.filter(p => p.professional_id === user.id);
  };

  // Search products
  const searchProducts = (query: string): Product[] => {
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.is_active && (
        p.name.toLowerCase().includes(lowerQuery) ||
        p.brand.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        p.ingredients.some(i => i.toLowerCase().includes(lowerQuery))
      )
    );
  };

  // Initial fetch - only run once when user and profile are ready
  useEffect(() => {
    // Only fetch if we have a user and profile, and haven't fetched yet
    if (user && profile && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchProducts();
      if (isClient) {
        fetchRecommendations();
      }
    }
    
    // Reset the fetch flag when user changes (logout/login)
    if (!user) {
      hasFetchedRef.current = false;
      setProducts([]);
      setRecommendations([]);
      setLoading(false);
    }
  }, [user, profile, isClient, fetchProducts, fetchRecommendations]);

  // Manual refresh function that resets the fetch flag
  const refreshProducts = useCallback(async () => {
    hasFetchedRef.current = false;
    isFetchingRef.current = false;
    await fetchProducts();
  }, [fetchProducts]);

  const refreshRecommendations = useCallback(async () => {
    await fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    products,
    recommendations,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    recommendProduct,
    removeRecommendation,
    linkProductToStep,
    unlinkProductFromStep,
    getProductsByCategory,
    getProductsBySkinType,
    getMyProducts,
    searchProducts,
    refreshProducts,
    refreshRecommendations,
  };
}
