const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useCallback, useRef } from 'react';

import { GraduationCap, Sparkles, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ChatArea from '../components/chat/ChatArea';
import GuestSidebar from '../components/chat/GuestSidebar';

const GUEST_MESSAGES_KEY = 'oppa_guest_messages';
const GUEST_CONV_KEY = 'oppa_guest_conv_id';

const MODE_PREFIXES = {
  chat: '',
  concept: '[MODE: CONCEPT EXPLAINER]\n',
  summarizer: '[MODE: SUMMARIZER]\n',
  quiz: '[MODE: QUIZ GENERATOR]\n',
  flashcard: '[MODE: FLASHCARD GENERATOR]\n',
};

export default function GuestChat() {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(GUEST_MESSAGES_KEY)) || []; } catch { return []; }
  });
  const [convId, setConvId] = useState(() => localStorage.getItem(GUEST_CONV_KEY) || null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (convId) localStorage.setItem(GUEST_CONV_KEY, convId);
    else localStorage.removeItem(GUEST_CONV_KEY);
  }, [convId]);

  // Subscribe to live updates
  useEffect(() => {
    if (!convId) return;
    const unsub = db.agents.subscribeToConversation(convId, (data) => {
      const msgs = data.messages || [];
      // Show clean messages (strip mode prefix from user messages)
      setMessages(msgs.map(m => {
        if (m.role === 'user') {
          const cleaned = Object.values(MODE_PREFIXES).reduce((s, p) => s.startsWith(p) ? s.slice(p.length) : s, m.content);
          return { ...m, content: cleaned };
        }
        return m;
      }));
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') setIsLoading(false);
    });
    return () => unsub();
  }, [convId]);

  const handleSend = useCallback(async (content) => {
    setIsLoading(true);
    const prefix = MODE_PREFIXES[activeMode] || '';
    const fullContent = prefix + content;
    const optimisticMsg = { role: 'user', content };

    if (!convId) {
      const title = content.length > 45 ? content.slice(0, 45) + '...' : content;
      const conv = await db.agents.createConversation({
        agent_name: 'oppa_joeris',
        metadata: { name: title, mode: activeMode, guest: true }
      });
      setConvId(conv.id);
      setMessages([optimisticMsg]);
      await db.agents.addMessage(conv, { role: 'user', content: fullContent });
    } else {
      const conv = await db.agents.getConversation(convId);
      setMessages(prev => [...prev, optimisticMsg]);
      await db.agents.addMessage(conv, { role: 'user', content: fullContent });
    }
  }, [convId, activeMode]);

  const handleNewChat = useCallback(() => {
    setConvId(null);
    setMessages([]);
    localStorage.removeItem(GUEST_CONV_KEY);
    localStorage.removeItem(GUEST_MESSAGES_KEY);
  }, []);

  const handleSelectMode = useCallback((mode) => {
    setActiveMode(mode);
    handleNewChat();
  }, [handleNewChat]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Guest banner */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/15 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <p className="text-xs text-foreground/80">
            <span className="font-semibold text-amber-700 dark:text-amber-400">Guest Mode</span> — Your chats won't be saved after you leave.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => db.auth.redirectToLogin(window.location.href)}
          className="h-7 text-xs gap-1.5 bg-primary hover:bg-primary/90 shrink-0"
        >
          <LogIn className="h-3 w-3" /> Sign up free
        </Button>
      </motion.div>

      {/* Top bar */}
      <header className="h-12 bg-card border-b border-border flex items-center px-4 justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">FalconHub</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">Guest</span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <GuestSidebar
          activeMode={activeMode}
          onSelectMode={handleSelectMode}
          onNew={handleNewChat}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <ChatArea
          messages={messages}
          onSend={handleSend}
          isLoading={isLoading}
          onToggleSidebar={() => setSidebarOpen(true)}
          activeMode={activeMode}
        />
      </div>
    </div>
  );
}