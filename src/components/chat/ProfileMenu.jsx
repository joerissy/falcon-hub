const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { LogOut, Sun, Moon, Monitor, KeyRound, ChevronRight, X, ArrowRight, Loader2, CheckCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system');
  const applyTheme = (t) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark');
    else if (t === 'light') root.classList.remove('dark');
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  };
  return [theme, applyTheme];
}

function JoinClassModal({ onClose, userEmail }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const classrooms = await db.entities.Classroom.filter({ invite_code: code.trim().toUpperCase() });
    if (classrooms.length === 0) {
      toast.error('Invalid invite code. Please check and try again.');
      setLoading(false);
      return;
    }
    const classroom = classrooms[0];
    const emails = classroom.student_emails || [];
    if (!emails.includes(userEmail)) {
      await db.entities.Classroom.update(classroom.id, {
        student_emails: [...emails, userEmail],
      });
    }
    setJoined(true);
    setLoading(false);
    toast.success('Joined class successfully!');
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        {joined ? (
          <div className="text-center py-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold text-foreground">Joined successfully!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-foreground">Join a Class</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Enter the code your teacher shared</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative mb-4">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="e.g. GRN-4821"
                className="pl-10 text-center text-base font-mono tracking-widest uppercase bg-muted/50"
                maxLength={10}
                autoFocus
              />
            </div>
            <Button
              onClick={handleJoin}
              disabled={!code.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Joining...</>
              ) : (
                <><ArrowRight className="h-4 w-4 mr-2" /> Join Class</>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfileMenu({ user, onUserUpdate, topbar = false }) {
  const [open, setOpen] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [theme, applyTheme] = useTheme();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  const saveName = async () => {
    if (!nameValue.trim()) return;
    setSavingName(true);
    await db.auth.updateMe({ full_name: nameValue.trim() });
    toast.success('Name updated! Reload to see changes.');
    setSavingName(false);
    setEditingName(false);
    // Reload so full_name propagates everywhere
    setTimeout(() => window.location.reload(), 800);
  };

  const initials = (user?.full_name || user?.email || '?')[0].toUpperCase();

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  if (topbar) {
    return (
      <>
        {/* Compact topbar avatar button */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{initials}</span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block truncate max-w-[120px]">{user?.full_name || user?.email}</span>
            <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform hidden sm:block", open && "rotate-90")} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
              {/* Name edit */}
              <div className="p-3 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Display Name</p>
                {editingName ? (
                  <div className="flex gap-2">
                    <Input value={nameValue} onChange={e => setNameValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }} className="h-8 text-sm flex-1" autoFocus />
                    <Button size="sm" className="h-8 px-2" onClick={saveName} disabled={savingName}>
                      {savingName ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                ) : (
                  <button onClick={() => { setNameValue(user?.full_name || user?.email || ''); setEditingName(true); }} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
                    <span className="text-sm text-foreground">{user?.full_name || 'Set your name'}</span>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              {/* Theme */}
              <div className="p-3 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Theme</p>
                <div className="flex gap-1">
                  {themeOptions.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => applyTheme(id)} className={cn("flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors", theme === id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                      <Icon className="h-3.5 w-3.5" />{label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Join class */}
              <button onClick={() => { setShowJoinModal(true); setOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left">
                <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0"><KeyRound className="h-3.5 w-3.5 text-blue-600" /></div>
                <span className="text-sm text-foreground">Join a Class</span>
              </button>
              {/* Logout */}
              <button onClick={() => db.auth.logout()} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left border-t border-border">
                <div className="h-7 w-7 rounded-md bg-destructive/10 flex items-center justify-center shrink-0"><LogOut className="h-3.5 w-3.5 text-destructive" /></div>
                <span className="text-sm text-destructive">Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {showJoinModal && <JoinClassModal onClose={() => setShowJoinModal(false)} userEmail={user?.email} />}
      </>
    );
  }

  return (
    <>
      {/* Profile Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
      >
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-primary">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{user?.full_name || 'Student'}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="mt-2 bg-muted/60 border border-border rounded-xl overflow-hidden">
          {/* Name edit */}
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Display Name</p>
            {editingName ? (
              <div className="flex gap-2">
                <Input
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                  className="h-8 text-sm flex-1"
                  autoFocus
                />
                <Button size="sm" className="h-8 px-2" onClick={saveName} disabled={savingName}>
                  {savingName ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => { setNameValue(user?.full_name || user?.email || ''); setEditingName(true); }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="text-sm text-foreground">{user?.full_name || 'Set your name'}</span>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Theme switcher */}
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Theme</p>
            <div className="flex gap-1">
              {themeOptions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => applyTheme(id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors",
                    theme === id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Join a class */}
          <button
            onClick={() => { setShowJoinModal(true); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
          >
            <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
              <KeyRound className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-sm text-foreground">Join a Class</span>
          </button>

          {/* Logout */}
          <button
            onClick={() => db.auth.logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left border-t border-border"
          >
            <div className="h-7 w-7 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
              <LogOut className="h-3.5 w-3.5 text-destructive" />
            </div>
            <span className="text-sm text-destructive">Sign Out</span>
          </button>
        </div>
      )}

      {showJoinModal && (
        <JoinClassModal
          onClose={() => setShowJoinModal(false)}
          userEmail={user?.email}
        />
      )}
    </>
  );
}