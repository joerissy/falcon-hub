const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';

import { Plus, Trash2, X, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotesPanel({ user, onClose }) {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    db.entities.Note.filter({ student_email: user.email }).then(n => {
      setNotes(n);
      setLoading(false);
    });
  }, [user]);

  const selectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || '');
  };

  const createNote = async () => {
    const note = await db.entities.Note.create({
      title: 'Untitled Note',
      content: '',
      student_email: user.email,
    });
    const updated = [note, ...notes];
    setNotes(updated);
    selectNote(note);
  };

  const saveNote = async () => {
    if (!selectedNote) return;
    setSaving(true);
    const updated = await db.entities.Note.update(selectedNote.id, {
      title: editTitle || 'Untitled Note',
      content: editContent,
    });
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    setSelectedNote(updated);
    setSaving(false);
    toast.success('Note saved!');
  };

  const deleteNote = async (noteId, e) => {
    e.stopPropagation();
    await db.entities.Note.delete(noteId);
    const remaining = notes.filter(n => n.id !== noteId);
    setNotes(remaining);
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setEditTitle('');
      setEditContent('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl h-[85vh] sm:h-[75vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="font-bold text-foreground flex-1">My Notes</h3>
          <Button size="sm" onClick={createNote} className="gap-1.5 text-xs h-8">
            <Plus className="h-3.5 w-3.5" /> New Note
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Note list */}
          <div className="w-44 border-r border-border overflow-y-auto shrink-0">
            {loading ? (
              <div className="p-4 text-xs text-muted-foreground text-center">Loading...</div>
            ) : notes.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground text-center">No notes yet.<br />Click New Note!</div>
            ) : (
              notes.map(note => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-3 cursor-pointer border-b border-border/50 transition-colors",
                    selectedNote?.id === note.id ? "bg-accent" : "hover:bg-muted"
                  )}
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{note.title}</span>
                  <button
                    onClick={(e) => deleteNote(note.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedNote ? (
              <div className="flex-1 flex items-center justify-center text-center px-6">
                <div>
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select a note or create a new one</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-border shrink-0">
                  <Input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Note title..."
                    className="font-semibold border-0 bg-transparent px-0 text-base focus-visible:ring-0 h-auto"
                  />
                </div>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="Start writing your notes here..."
                  className="flex-1 p-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
                />
                <div className="p-3 border-t border-border shrink-0 flex justify-end">
                  <Button size="sm" onClick={saveNote} disabled={saving} className="gap-1.5 text-xs h-8">
                    <Save className="h-3.5 w-3.5" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}