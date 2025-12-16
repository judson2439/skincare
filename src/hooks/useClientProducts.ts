import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientProduct {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  name: string;
  brand: string | null;
  category: string | null;
  notes: string | null;
  image_url: string | null;
  is_active: boolean;
  days_used: number;
  added_via: 'manual' | 'photo';
}

export interface CreateClientProductInput {
  name: string;
  brand?: string;
  category?: string;
  notes?: string;
  image_url?: string;
  added_via?: 'manual' | 'photo';
}

export interface UpdateClientProductInput {
  name?: string;
  brand?: string;
  category?: string;
  notes?: string;
  image_url?: string;
  is_active?: boolean;
  days_used?: number;
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
  'Other',
];

export function useClientProducts() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClient = profile?.role === 'client';

  // Fetch client's products
  const fetchProducts = useCallback(async () => {
    if (!user || !isClient) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('client_products')
        .select('*')
        .eq('client_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching client products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isClient]);

  // Add a new product manually
  const addProduct = async (input: CreateClientProductInput): Promise<{ success: boolean; product?: ClientProduct; error?: string }> => {
    if (!user || !isClient) {
      return { success: false, error: 'Only clients can add products' };
    }

    try {
      const { data, error: insertError } = await supabase
        .from('client_products')
        .insert({
          client_id: user.id,
          name: input.name,
          brand: input.brand || null,
          category: input.category || null,
          notes: input.notes || null,
          image_url: input.image_url || null,
          added_via: input.added_via || 'manual',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setProducts(prev => [data, ...prev]);
      return { success: true, product: data };
    } catch (err: any) {
      console.error('Error adding product:', err);
      return { success: false, error: err.message };
    }
  };

  // Update a product
  const updateProduct = async (productId: string, input: UpdateClientProductInput): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isClient) {
      return { success: false, error: 'Only clients can update products' };
    }

    try {
      const { error: updateError } = await supabase
        .from('client_products')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('client_id', user.id);

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

  // Delete a product (soft delete by setting is_active to false)
  const deleteProduct = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isClient) {
      return { success: false, error: 'Only clients can delete products' };
    }

    try {
      const { error: deleteError } = await supabase
        .from('client_products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('client_id', user.id);

      if (deleteError) throw deleteError;

      setProducts(prev => prev.filter(p => p.id !== productId));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting product:', err);
      return { success: false, error: err.message };
    }
  };

  // Upload product photo to storage
  const uploadProductPhoto = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!user || !isClient) {
      return { success: false, error: 'Only clients can upload photos' };
    }

    try {
      setUploading(true);

      // Validate file
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Please select an image file' };
      }

      if (file.size > 10 * 1024 * 1024) {
        return { success: false, error: 'Image must be less than 10MB' };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/products/${Date.now()}.${fileExt}`;

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

  // Add product from photo (uploads photo and creates product entry)
  const addProductFromPhoto = async (
    file: File,
    productName: string,
    brand?: string,
    category?: string,
    notes?: string
  ): Promise<{ success: boolean; product?: ClientProduct; error?: string }> => {
    // First upload the photo
    const uploadResult = await uploadProductPhoto(file);
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    // Then create the product with the photo URL
    return addProduct({
      name: productName,
      brand,
      category,
      notes,
      image_url: uploadResult.url,
      added_via: 'photo',
    });
  };

  // Get products by category
  const getProductsByCategory = (category: string): ClientProduct[] => {
    return products.filter(p => p.category === category && p.is_active);
  };

  // Get active products count
  const activeProductsCount = products.filter(p => p.is_active).length;

  // Fetch products for a specific client (for professionals to view)
  const fetchClientProducts = async (clientId: string): Promise<{ success: boolean; products?: ClientProduct[]; error?: string }> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('client_products')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return { success: true, products: data || [] };
    } catch (err: any) {
      console.error('Error fetching client products:', err);
      return { success: false, error: err.message };
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && isClient) {
      fetchProducts();
    }
  }, [user, isClient, fetchProducts]);

  return {
    products,
    loading,
    uploading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadProductPhoto,
    addProductFromPhoto,
    getProductsByCategory,
    activeProductsCount,
    refreshProducts: fetchProducts,
    fetchClientProducts, // For professionals to fetch a specific client's products
  };
}
