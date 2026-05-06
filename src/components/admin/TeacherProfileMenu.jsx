const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { LogOut, Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function TeacherProfileMenu({ user }) {
  const [open, setOpen] = useState(false);
  const [theme, applyTheme] = useTheme();

  const initials = (user?.full_name || user?.email || '?')[0].toUpperCase();

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">{initials}</span>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">{user?.full_name || user?.email}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
            {/* User info */}
            <div className="px-3 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground truncate">{user?.full_name || 'Teacher'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>

            {/* Theme */}
            <div className="p-3 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Theme</p>
              <div className="flex gap-1">
                {themeOptions.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { applyTheme(id); }}
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

            {/* Logout */}
            <button
              onClick={() => db.auth.logout()}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted transition-colors text-left"
            >
              <LogOut className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}