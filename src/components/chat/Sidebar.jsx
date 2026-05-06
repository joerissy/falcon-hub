const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, X, GraduationCap, Lightbulb, FileText, HelpCircle, CreditCard, NotebookPen, Mic, Megaphone, PanelLeftClose } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import NotesPanel from './NotesPanel';
import AnnouncementBoard from './AnnouncementBoard';
import StudentQuizView from './StudentQuizView';

export const MODES = [
  {
    id: 'chat',
    label: 'Free Chat',
    icon: MessageSquare,
    description: 'Ask anything freely',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'concept',
    label: 'Concept Explainer',
    icon: Lightbulb,
    description: 'Deep-dive any topic',
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'summarizer',
    label: 'Summarizer',
    icon: FileText,
    description: 'Summarize texts fast',
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'quiz',
    label: 'Quiz Generator',
    icon: HelpCircle,
    description: 'Test your knowledge',
    color: 'text-rose-600',
    bg: 'bg-rose-500/10',
  },
  {
    id: 'flashcard',
    label: 'Flashcard Generator',
    icon: CreditCard,
    description: 'Build memory cards',
    color: 'text-violet-600',
    bg: 'bg-violet-500/10',
  },
];

export default function Sidebar({ conversations, activeId, activeMode, onSelectMode, onSelect, onNew, onDelete, isOpen, onClose, user, onVoiceMode, onCollapse }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showQuizzes, setShowQuizzes] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed md:relative z-50 md:z-auto top-0 left-0 h-full w-[280px] sm:w-72",
        "bg-card border-r border-border flex flex-col",
        "transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
        role="navigation"
        aria-label="Sidebar navigation"
      >
        {/* Header */}
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img
                src="https://media.db.com/images/public/69ef66fe4f340c1dcd4f7578/1f99ebf78_684434411_1447343886627885_3205513454921292553_n.png"
                alt="Falcon"
                className="h-7 w-7 object-contain"
                loading="eager"
                width="28"
                height="28"
              />
              <span className="font-bold text-sm tracking-tight">FalconHub</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:flex text-muted-foreground hover:text-foreground" onClick={onCollapse} aria-label="Hide sidebar">
                <PanelLeftClose className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onClose} aria-label="Close sidebar">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onNew(); onClose(); }}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4 shrink-0" />
              New Chat
            </button>
            <Button
              onClick={() => setShowNotes(true)}
              variant="outline"
              size="icon"
              className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0 shrink-0 h-10 w-10"
              aria-label="My Notes"
            >
              <NotebookPen className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              onClick={() => setShowAnnouncements(true)}
              variant="outline"
              size="icon"
              className="bg-primary/10 text-primary hover:bg-primary/20 border-0 shrink-0 h-10 w-10"
              aria-label="Announcements"
            >
              <Megaphone className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              onClick={() => setShowQuizzes(true)}
              variant="outline"
              size="icon"
              className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-0 shrink-0 h-10 w-10"
              aria-label="Quizzes"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Voice Mode Button */}
        <div className="px-3 pb-3">
          <button
            onClick={() => { onVoiceMode?.(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 hover:from-primary/20 hover:to-primary/10 transition-all text-left"
          >
            <div className="h-7 w-7 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
              <Mic className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary leading-none">Voice Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Speak to your AI tutor</p>
            </div>
            <span className="ml-auto text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">New</span>
          </button>
        </div>

        {/* Mode Sections */}
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Learning Modes</p>
          <div className="space-y-0.5">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isActive = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => { onSelectMode(mode.id); onNew(); onClose(); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground/70 hover:text-foreground"
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

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 mt-1">Recent Chats</p>
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No conversations yet</p>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => { onSelect(conv.id); onClose(); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm",
                    activeId === conv.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted text-foreground/70 hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  <span className="truncate flex-1">{conv.title || 'New Chat'}</span>
                  {hoveredId === conv.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100 hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {showNotes && <NotesPanel user={user} onClose={() => setShowNotes(false)} />}
      {showAnnouncements && <AnnouncementBoard user={user} onClose={() => setShowAnnouncements(false)} />}
      {showQuizzes && <StudentQuizView user={user} onClose={() => setShowQuizzes(false)} />}
    </>
  );
}