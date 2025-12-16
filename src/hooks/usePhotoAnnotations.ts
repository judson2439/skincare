import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  id: string;
  type: 'pen' | 'highlighter';
  points: AnnotationPoint[];
  color: string;
  width: number;
  opacity: number;
}

export interface TextAnnotation {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export interface ShapeAnnotation {
  id: string;
  type: 'arrow' | 'line' | 'circle' | 'rectangle';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  width: number;
}

export interface MarkerAnnotation {
  id: string;
  type: 'marker';
  x: number;
  y: number;
  label: string;
  color: string;
  note?: string;
}

export type Annotation = DrawingPath | TextAnnotation | ShapeAnnotation | MarkerAnnotation;

export interface AnnotationData {
  annotations: Annotation[];
  width: number;
  height: number;
}

export interface PhotoAnnotation {
  id: string;
  photo_id: string;
  professional_id: string;
  annotation_data: AnnotationData;
  thumbnail_url: string | null;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function usePhotoAnnotations(photoId?: string) {
  const { user, profile } = useAuth();
  const [annotations, setAnnotations] = useState<PhotoAnnotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch annotations for a photo
  const fetchAnnotations = useCallback(async () => {
    if (!photoId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photo_annotations')
        .select('*')
        .eq('photo_id', photoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching annotations (table may not exist):', error);
        setAnnotations([]);
        setLoading(false);
        return;
      }
      setAnnotations(data || []);
    } catch (error) {
      console.warn('Error fetching annotations:', error);
      setAnnotations([]);
    } finally {
      setLoading(false);
    }
  }, [photoId]);


  useEffect(() => {
    if (photoId) {
      fetchAnnotations();
    }
  }, [photoId, fetchAnnotations]);

  // Save annotation
  const saveAnnotation = async (
    annotationData: AnnotationData,
    title?: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string; annotation?: PhotoAnnotation }> => {
    if (!user || !photoId) return { success: false, error: 'Not authenticated or no photo selected' };
    if (profile?.role !== 'professional') return { success: false, error: 'Only professionals can add annotations' };

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('photo_annotations')
        .insert({
          photo_id: photoId,
          professional_id: user.id,
          annotation_data: annotationData,
          title: title || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh annotations
      await fetchAnnotations();

      return { success: true, annotation: data };
    } catch (error: any) {
      console.error('Error saving annotation:', error);
      return { success: false, error: error.message || 'Failed to save annotation' };
    } finally {
      setSaving(false);
    }
  };

  // Update annotation
  const updateAnnotation = async (
    annotationId: string,
    annotationData: AnnotationData,
    title?: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setSaving(true);
    try {
      const { error } = await supabase
        .from('photo_annotations')
        .update({
          annotation_data: annotationData,
          title: title || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', annotationId)
        .eq('professional_id', user.id);

      if (error) throw error;

      // Refresh annotations
      await fetchAnnotations();

      return { success: true };
    } catch (error: any) {
      console.error('Error updating annotation:', error);
      return { success: false, error: error.message || 'Failed to update annotation' };
    } finally {
      setSaving(false);
    }
  };

  // Delete annotation
  const deleteAnnotation = async (annotationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('photo_annotations')
        .delete()
        .eq('id', annotationId)
        .eq('professional_id', user.id);

      if (error) throw error;

      // Refresh annotations
      await fetchAnnotations();

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting annotation:', error);
      return { success: false, error: error.message || 'Failed to delete annotation' };
    }
  };

  return {
    annotations,
    loading,
    saving,
    saveAnnotation,
    updateAnnotation,
    deleteAnnotation,
    refreshAnnotations: fetchAnnotations,
  };
}

// Generate unique ID for annotations
export function generateAnnotationId(): string {
  return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
