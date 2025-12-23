import { useState, useEffect } from 'react';
import { FaStickyNote, FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

export default function CandidateNotes({ candidateId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load notes from API (to be implemented)
    // For now, using localStorage as fallback
    const loadNotes = async () => {
      try {
        // TODO: Implement API endpoint for notes
        // const response = await fetch(`/api/candidates/${candidateId}/notes`);
        // const data = await response.json();
        // if (data.success) {
        //   setNotes(data.data);
        // }
        
        // Fallback to localStorage for now
        const storedNotes = localStorage.getItem(`candidate_notes_${candidateId}`);
        if (storedNotes) {
          setNotes(JSON.parse(storedNotes));
        }
      } catch (err) {
        console.error('Error loading notes:', err);
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) {
      loadNotes();
    }
  }, [candidateId]);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;

    try {
      setSaving(true);
      const newNote = {
        id: editingId || Date.now(),
        text: noteText.trim(),
        createdAt: editingId ? notes.find(n => n.id === editingId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updatedNotes;
      if (editingId) {
        updatedNotes = notes.map(n => n.id === editingId ? newNote : n);
      } else {
        updatedNotes = [newNote, ...notes];
      }

      setNotes(updatedNotes);
      
      // Save to localStorage (temporary until API is implemented)
      localStorage.setItem(`candidate_notes_${candidateId}`, JSON.stringify(updatedNotes));

      // TODO: Save to API
      // const response = await fetch(`/api/candidates/${candidateId}/notes`, {
      //   method: editingId ? 'PUT' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newNote),
      // });

      setNoteText('');
      setShowAddForm(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const updatedNotes = notes.filter(n => n.id !== noteId);
      setNotes(updatedNotes);
      
      // Save to localStorage
      localStorage.setItem(`candidate_notes_${candidateId}`, JSON.stringify(updatedNotes));

      // TODO: Delete from API
      // await fetch(`/api/candidates/${candidateId}/notes/${noteId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note. Please try again.');
    }
  };

  const handleEditNote = (note) => {
    setEditingId(note.id);
    setNoteText(note.text);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setNoteText('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">HR Notes</h2>
        <div className="text-center py-4 text-slate-500">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">HR Notes</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            <FaPlus />
            Add Note
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note about this candidate..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            rows={4}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              disabled={saving}
            >
              <FaTimes className="inline mr-1" />
              Cancel
            </button>
            <button
              onClick={handleSaveNote}
              disabled={saving || !noteText.trim()}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave className="inline mr-1" />
              {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="bg-slate-50 rounded-lg p-6 text-center text-slate-500">
          <FaStickyNote className="mx-auto text-3xl mb-2 text-slate-400" />
          <p className="text-sm">No notes yet. Add your first note above.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs text-slate-500">
                  {formatDate(note.createdAt)}
                  {note.updatedAt !== note.createdAt && (
                    <span className="ml-2">(edited)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditNote(note)}
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Edit note"
                  >
                    <FaEdit className="text-sm" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete note"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

