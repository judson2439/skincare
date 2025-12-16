import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientNote {
  id: string;
  professional_id: string;
  client_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface UseClientNotesReturn {
  notes: ClientNote[];
  loading: boolean;
  error: string | null;
  getNotesForClient: (clientId: string) => ClientNote[];
  hasNotes: (clientId: string) => boolean;
  getNoteCount: (clientId: string) => number;
  addNote: (clientId: string, content: string) => Promise<{ success: boolean; note?: ClientNote; error?: string }>;
  updateNote: (noteId: string, content: string) => Promise<{ success: boolean; error?: string }>;
  deleteNote: (noteId: string) => Promise<{ success: boolean; error?: string }>;
  refreshNotes: () => Promise<void>;
}

export const useClientNotes = (): UseClientNotesReturn => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all notes for the current professional
  const fetchNotes = useCallback(async () => {
    if (!user?.id) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('client_notes')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setNotes(data || []);
    } catch (err: any) {
      console.error('Error fetching client notes:', err);
      setError(err.message || 'Failed to fetch notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Get notes for a specific client
  const getNotesForClient = useCallback((clientId: string): ClientNote[] => {
    return notes.filter(note => note.client_id === clientId);
  }, [notes]);

  // Check if a client has notes
  const hasNotes = useCallback((clientId: string): boolean => {
    return notes.some(note => note.client_id === clientId);
  }, [notes]);

  // Get note count for a client
  const getNoteCount = useCallback((clientId: string): number => {
    return notes.filter(note => note.client_id === clientId).length;
  }, [notes]);

  // Add a new note
  const addNote = useCallback(async (clientId: string, content: string): Promise<{ success: boolean; note?: ClientNote; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!content.trim()) {
      return { success: false, error: 'Note content cannot be empty' };
    }

    try {
      const newNote = {
        professional_id: user.id,
        client_id: clientId,
        content: content.trim(),
      };

      const { data, error: insertError } = await supabase
        .from('client_notes')
        .insert(newNote)
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state
      setNotes(prev => [data, ...prev]);

      return { success: true, note: data };
    } catch (err: any) {
      console.error('Error adding note:', err);
      return { success: false, error: err.message || 'Failed to add note' };
    }
  }, [user?.id]);

  // Update an existing note
  const updateNote = useCallback(async (noteId: string, content: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!content.trim()) {
      return { success: false, error: 'Note content cannot be empty' };
    }

    try {
      const { data, error: updateError } = await supabase
        .from('client_notes')
        .update({ 
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('professional_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setNotes(prev => prev.map(note => 
        note.id === noteId ? data : note
      ));

      return { success: true };
    } catch (err: any) {
      console.error('Error updating note:', err);
      return { success: false, error: err.message || 'Failed to update note' };
    }
  }, [user?.id]);

  // Delete a note
  const deleteNote = useCallback(async (noteId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error: deleteError } = await supabase
        .from('client_notes')
        .delete()
        .eq('id', noteId)
        .eq('professional_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      setNotes(prev => prev.filter(note => note.id !== noteId));

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting note:', err);
      return { success: false, error: err.message || 'Failed to delete note' };
    }
  }, [user?.id]);

  // Refresh notes
  const refreshNotes = useCallback(async () => {
    await fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    getNotesForClient,
    hasNotes,
    getNoteCount,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes,
  };
};

export default useClientNotes;
