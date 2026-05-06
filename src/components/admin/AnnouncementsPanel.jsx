const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';

import { Megaphone, Plus, Trash2, Pin, PinOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AnnouncementsPanel({ classroom, user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await db.entities.Announcement.filter({ classroom_id: classroom.id });
    setAnnouncements(data.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, [classroom.id]);

  const handlePost = async () => {
    if (!title.trim() || !message.trim()) return;
    setSaving(true);
    await db.entities.Announcement.create({
      classroom_id: classroom.id,
      teacher_email: user.email,
      teacher_name: user.full_name || user.email,
      title: title.trim(),
      message: message.trim(),
      pinned: false,
    });
    toast.success('Announcement posted!');
    setTitle('');
    setMessage('');
    setShowForm(false);
    setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    await db.entities.Announcement.delete(id);
    toast.success('Deleted');
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const togglePin = async (ann) => {
    await db.entities.Announcement.update(ann.id, { pinned: !ann.pinned });
    load();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground text-sm">Announcements</h2>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="h-8 text-xs gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 rounded-xl bg-muted/50 border border-border space-y-3">
          <Input
            placeholder="Announcement title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="bg-card text-sm"
          />
          <Textarea
            placeholder="Write your message to students..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            className="bg-card text-sm resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handlePost} disabled={saving || !title.trim() || !message.trim()}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Post
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-10">
          <Megaphone className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No announcements yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Post something for your students</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <div
              key={ann.id}
              className={cn(
                "rounded-xl border p-4 transition-all",
                ann.pinned ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                    <p className="text-sm font-semibold text-foreground truncate">{ann.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{ann.message}</p>
                  <p className="text-xs text-muted-foreground/50 mt-2">
                    {ann.created_date ? format(new Date(ann.created_date), 'MMM d, yyyy · h:mm a') : ''}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => togglePin(ann)}
                    title={ann.pinned ? 'Unpin' : 'Pin'}
                  >
                    {ann.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(ann.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}