import React, { useState, useEffect } from 'react';
import { useClientNotes, ClientNote } from '@/hooks/useClientNotes';
import { useToast } from '@/hooks/use-toast';
import {
  StickyNote,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  Loader2,
  Clock,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface ClientNotesSectionProps {
  clientId: string;
  clientName: string;
}

const ClientNotesSection: React.FC<ClientNotesSectionProps> = ({ clientId, clientName }) => {
  const { 
    getNotesForClient, 
    addNote, 
    updateNote, 
    deleteNote,
    loading 
  } = useClientNotes();
  const { toast } = useToast();

  const [clientNotes, setClientNotes] = useState<ClientNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Get notes for this client
  useEffect(() => {
    const notes = getNotesForClient(clientId);
    setClientNotes(notes);
  }, [clientId, getNotesForClient]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Format full date for tooltip
  const formatFullDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast({ title: 'Error', description: 'Please enter a note', variant: 'destructive' });
      return;
    }

    setSavingNote(true);
    const result = await addNote(clientId, newNoteContent);
    setSavingNote(false);

    if (result.success) {
      toast({ title: 'Note Added', description: 'Your note has been saved' });
      setNewNoteContent('');
      setIsAddingNote(false);
      // Refresh notes
      const notes = getNotesForClient(clientId);
      setClientNotes(notes);
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to add note', variant: 'destructive' });
    }
  };

  // Handle start editing
  const handleStartEdit = (note: ClientNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  // Handle save edit
  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) {
      toast({ title: 'Error', description: 'Note cannot be empty', variant: 'destructive' });
      return;
    }

    setSavingNote(true);
    const result = await updateNote(noteId, editContent);
    setSavingNote(false);

    if (result.success) {
      toast({ title: 'Note Updated', description: 'Your changes have been saved' });
      setEditingNoteId(null);
      setEditContent('');
      // Refresh notes
      const notes = getNotesForClient(clientId);
      setClientNotes(notes);
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to update note', variant: 'destructive' });
    }
  };

  // Handle delete note
  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    const result = await deleteNote(noteId);
    setDeletingNoteId(null);
    setShowDeleteConfirm(null);

    if (result.success) {
      toast({ title: 'Note Deleted', description: 'The note has been removed' });
      // Refresh notes
      const notes = getNotesForClient(clientId);
      setClientNotes(notes);
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to delete note', variant: 'destructive' });
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-amber-500" />
          <h4 className="font-medium text-gray-900">Private Notes</h4>
          {clientNotes.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              {clientNotes.length}
            </span>
          )}
        </div>
        {!isAddingNote && (
          <button
            onClick={() => setIsAddingNote(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#CFAFA3] hover:bg-[#CFAFA3]/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Note
          </button>
        )}
      </div>

      {/* Add Note Form */}
      {isAddingNote && (
        <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder={`Add a private note about ${clientName}...`}
            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Only you can see this note
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsAddingNote(false); setNewNoteContent(''); }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={savingNote || !newNoteContent.trim()}
                className="flex items-center gap-1 px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingNote ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Note
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      ) : clientNotes.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No notes yet</p>
          <p className="text-xs text-gray-400 mt-1">Add a private note about this client</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {clientNotes.map((note) => (
            <div
              key={note.id}
              className="group bg-white border border-gray-100 rounded-xl p-4 hover:border-amber-200 transition-colors"
            >
              {editingNoteId === note.id ? (
                // Edit Mode
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-transparent outline-none resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      disabled={savingNote || !editContent.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      {savingNote ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              ) : showDeleteConfirm === note.id ? (
                // Delete Confirmation
                <div className="text-center py-2">
                  <p className="text-sm text-gray-700 mb-3">Delete this note?</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={deletingNoteId === note.id}
                      className="flex items-center gap-1 px-4 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingNoteId === note.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-xs text-gray-400" title={formatFullDate(note.created_at)}>
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(note.created_at)}</span>
                      {note.updated_at !== note.created_at && (
                        <span className="text-gray-300">(edited)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit note"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(note.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientNotesSection;
