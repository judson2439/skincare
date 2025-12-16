import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProgressPhoto {
  id: string;
  client_id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'progress';
  title: string | null;
  notes: string | null;
  taken_at: string;
  created_at: string;
  updated_at: string;
}

export interface PhotoComment {
  id: string;
  photo_id: string;
  professional_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  professional_name?: string;
  professional_avatar?: string;
}

export interface PhotoWithComments extends ProgressPhoto {
  comments: PhotoComment[];
}

export function useProgressPhotos() {
  const { user, profile } = useAuth();
  const [photos, setPhotos] = useState<PhotoWithComments[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Use refs to prevent duplicate fetches
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Fetch photos based on role
  const fetchPhotos = useCallback(async () => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      return;
    }
    
    if (!user) {
      setLoading(false);
      return;
    }
    
    isFetchingRef.current = true;
    setLoading(true);
    
    try {
      let query = supabase
        .from('progress_photos')
        .select('*')
        .order('taken_at', { ascending: false });

      // If client, only fetch their own photos
      if (profile?.role === 'client') {
        query = query.eq('client_id', user.id);
      }

      const { data: photosData, error: photosError } = await query;

      if (photosError) {
        console.warn('Error fetching photos (table may not exist):', photosError);
        setPhotos([]);
        return;
      }

      // Fetch comments for each photo
      const photosWithComments: PhotoWithComments[] = await Promise.all(
        (photosData || []).map(async (photo) => {
          const { data: commentsData } = await supabase
            .from('photo_comments')
            .select('*')
            .eq('photo_id', photo.id)
            .order('created_at', { ascending: true });

          return {
            ...photo,
            comments: commentsData || [],
          };
        })
      );

      setPhotos(photosWithComments);
    } catch (error) {
      console.warn('Error fetching photos:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id, profile?.role]);


  // Initial fetch - only run once when user and profile are ready
  useEffect(() => {
    // Only fetch if we have a user and profile, and haven't fetched yet
    if (user && profile && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPhotos();
    }
    
    // Reset the fetch flag when user changes (logout/login)
    if (!user) {
      hasFetchedRef.current = false;
      setPhotos([]);
      setLoading(false);
    }
  }, [user, profile, fetchPhotos]);

  // Manual refresh function that resets the fetch flag
  const refreshPhotos = useCallback(async () => {
    hasFetchedRef.current = false;
    isFetchingRef.current = false;
    await fetchPhotos();
  }, [fetchPhotos]);

  // Upload a new photo
  const uploadPhoto = async (
    file: File,
    photoType: 'before' | 'after' | 'progress',
    title?: string,
    notes?: string,
    takenAt?: Date
  ): Promise<{ success: boolean; error?: string; photo?: ProgressPhoto }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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

      // Insert record
      const { data, error: insertError } = await supabase
        .from('progress_photos')
        .insert({
          client_id: user.id,
          photo_url: publicUrl,
          photo_type: photoType,
          title: title || null,
          notes: notes || null,
          taken_at: takenAt?.toISOString() || new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Refresh photos
      await refreshPhotos();

      return { success: true, photo: data };
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      return { success: false, error: error.message || 'Failed to upload photo' };
    } finally {
      setUploading(false);
    }
  };

  // Delete a photo
  const deletePhoto = async (photoId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Get photo to find the file path
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return { success: false, error: 'Photo not found' };

      // Extract file path from URL
      const urlParts = photo.photo_url.split('/progress-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        // Delete from storage
        await supabase.storage.from('progress-photos').remove([filePath]);
      }

      // Delete record
      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      // Refresh photos
      await refreshPhotos();

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      return { success: false, error: error.message || 'Failed to delete photo' };
    }
  };

  // Update photo details
  const updatePhoto = async (
    photoId: string,
    updates: { title?: string; notes?: string; photo_type?: 'before' | 'after' | 'progress' }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('progress_photos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', photoId);

      if (error) throw error;

      // Refresh photos
      await refreshPhotos();

      return { success: true };
    } catch (error: any) {
      console.error('Error updating photo:', error);
      return { success: false, error: error.message || 'Failed to update photo' };
    }
  };

  // Add comment (for professionals) - now with notification
  const addComment = async (
    photoId: string,
    comment: string,
    sendSmsNotification: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (profile?.role !== 'professional') return { success: false, error: 'Only professionals can add comments' };

    try {
      // Get the photo to find the client_id
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return { success: false, error: 'Photo not found' };

      // Insert the comment
      const { error } = await supabase
        .from('photo_comments')
        .insert({
          photo_id: photoId,
          professional_id: user.id,
          comment,
        });

      if (error) throw error;

      // Send notification to client via edge function
      try {
        const { data: clientData } = await supabase
          .from('user_profiles')
          .select('phone')
          .eq('id', photo.client_id)
          .single();

        await supabase.functions.invoke('notify-photo-feedback', {
          body: {
            photoId,
            clientId: photo.client_id,
            professionalId: user.id,
            comment,
            sendSms: sendSmsNotification,
            clientPhone: clientData?.phone || null
          }
        });
      } catch (notifyError) {
        // Don't fail the whole operation if notification fails
        console.error('Error sending notification:', notifyError);
      }

      // Refresh photos
      await refreshPhotos();

      return { success: true };
    } catch (error: any) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message || 'Failed to add comment' };
    }
  };


  // Delete comment
  const deleteComment = async (commentId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('photo_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Refresh photos
      await refreshPhotos();

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message || 'Failed to delete comment' };
    }
  };

  // Get photos for a specific client (for professionals)
  const getClientPhotos = useCallback((clientId: string): PhotoWithComments[] => {
    return photos.filter(p => p.client_id === clientId);
  }, [photos]);

  // Get photos grouped by month for timeline view
  const getPhotosByMonth = useCallback((): Record<string, PhotoWithComments[]> => {
    const grouped: Record<string, PhotoWithComments[]> = {};
    
    photos.forEach(photo => {
      const date = new Date(photo.taken_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(photo);
    });

    return grouped;
  }, [photos]);

  return {
    photos,
    loading,
    uploading,
    uploadPhoto,
    deletePhoto,
    updatePhoto,
    addComment,
    deleteComment,
    getClientPhotos,
    getPhotosByMonth,
    refreshPhotos,
  };
}
