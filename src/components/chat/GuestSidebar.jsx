const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { Button } from "@/components/ui/button";
import { Plus, X, GraduationCap, LogIn } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

import { MODES } from './Sidebar';

export default function GuestSidebar({ activeMode, onSelectMode, onNew, isOpen, onClose }) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed md:relative z-50 md:z-auto top-0 left-0 h-full w-72",
        "bg-card border-r border-border flex flex-col",
        "transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img
                src="https://media.db.com/images/public/69ef66fe4f340c1dcd4f7578/1f99ebf78_684434411_1447343886627885_3205513454921292553_n.png"
                alt="Falcon"
                className="h-7 w-7 object-contain"
              />
              <span className="font-bold text-sm tracking-tight">FalconHub</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={() => { onNew(); onClose(); }}
            className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-0"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Modes */}
        <div className="p-3 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Learning Modes</p>
          <div className="space-y-0.5">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isActive = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => { onSelectMode(mode.id); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground/70 hover:text-foreground"
                  )}
                >
                  <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", isActive ? "bg-primary/20" : mode.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : mode.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{mode.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{mode.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sign up CTA */}
        <div className="p-4 border-t border-border">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 mb-3">
            <p className="text-xs font-semibold text-foreground mb-1">Save your progress</p>
            <p className="text-xs text-muted-foreground mb-3">Sign up free to keep your conversations, notes, and join a class.</p>
            <Button
              size="sm"
              onClick={() => db.auth.redirectToLogin(window.location.href)}
              className="w-full gap-1.5 text-xs bg-primary hover:bg-primary/90"
            >
              <LogIn className="h-3.5 w-3.5" /> Create Free Account
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}