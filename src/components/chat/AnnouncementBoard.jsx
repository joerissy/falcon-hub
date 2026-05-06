const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';

import { Megaphone, Pin, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AnnouncementBoard({ user, onClose }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const load = async () => {
      const classrooms = await db.entities.Classroom.filter({ student_emails: user.email });
      if (classrooms.length === 0) { setLoading(false); return; }
      const classroomMap = Object.fromEntries(classrooms.map(c => [c.id, c.name]));
      const all = await Promise.all(
        classrooms.map(c => db.entities.Announcement.filter({ classroom_id: c.id }))
      );
      const flat = all.flat().map(a => ({ ...a, _classroomName: classroomMap[a.classroom_id] || '' })).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_date) - new Date(a.created_date);
      });
      setAnnouncements(flat);
      setLoading(false);
    };
    load();
  }, [user.email]);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[75vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">Announcements</h2>
            <p className="text-xs text-muted-foreground">From your teacher</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No announcements yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Your teacher hasn't posted anything</p>
            </div>
          ) : (
            announcements.map(ann => {
              const isExpanded = expanded[ann.id];
              const isLong = ann.message.length > 120;
              return (
                <div
                  key={ann.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    ann.pinned ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {ann._classroomName && (
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {ann._classroomName}
                      </span>
                    )}
                    {ann.pinned && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                        <Pin className="h-2.5 w-2.5" /> Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">{ann.title}</p>
                  <p className={cn("text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap", !isExpanded && isLong && "line-clamp-3")}>
                    {ann.message}
                  </p>
                  {isLong && (
                    <button
                      onClick={() => toggle(ann.id)}
                      className="flex items-center gap-1 text-xs text-primary mt-1 font-medium hover:underline"
                    >
                      {isExpanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Read more</>}
                    </button>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground/50">
                      {ann.teacher_name || ann.teacher_email}
                    </p>
                    <p className="text-xs text-muted-foreground/40">
                      {ann.created_date ? format(new Date(ann.created_date), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}