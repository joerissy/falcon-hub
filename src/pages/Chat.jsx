const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useCallback, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import Sidebar from '../components/chat/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import VoiceMode from '../components/chat/VoiceMode';
import { Button } from '@/components/ui/button';
import { GraduationCap, PanelLeftOpen } from 'lucide-react';
import ProfileMenu from '../components/chat/ProfileMenu';
import { AnimatePresence } from 'framer-motion';

const MODE_PREFIXES = {
  chat: '',
  concept: '[MODE: CONCEPT EXPLAINER]\n',
  summarizer: '[MODE: SUMMARIZER]\n',
  quiz: '[MODE: QUIZ GENERATOR]\n',
  flashcard: '[MODE: FLASHCARD GENERATOR]\n',
};

export default function Chat() {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('chat');
  const [agentConversations, setAgentConversations] = useState([]);
  const [user, setUser] = useState(null);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  const loadAgentConvs = useCallback(async () => {
    const convs = await db.agents.listConversations({ agent_name: 'oppa_joeris' });
    setAgentConversations(
      convs.sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date))
    );
  }, []);

  useEffect(() => { loadAgentConvs(); }, [activeConversationId, messages.length]);

  useEffect(() => {
    if (!activeConversationId) { setMessages([]); return; }
    const load = async () => {
      const conv = await db.agents.getConversation(activeConversationId);
      setMessages(conv.messages || []);
    };
    load();
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    const unsubscribe = db.agents.subscribeToConversation(activeConversationId, (data) => {
      setMessages(data.messages || []);
      const msgs = data.messages || [];
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [activeConversationId]);

  // Track activity on unmount or session end
  const logActivity = useCallback(async (msgCount) => {
    if (!user || msgCount === 0) return;
    const studyMinutes = Math.round((Date.now() - sessionStartRef.current) / 60000);
    const classrooms = await db.entities.Classroom.filter({ student_emails: user.email });
    if (classrooms.length === 0) return;
    await db.entities.StudentActivity.create({
      student_email: user.email,
      student_name: user.full_name,
      classroom_id: classrooms[0].id,
      session_date: new Date().toISOString().split('T')[0],
      messages_sent: msgCount,
      study_minutes: studyMinutes,
      mode_used: activeMode,
    });
  }, [user, activeMode]);

  const msgCountRef = useRef(0);
  useEffect(() => {
    msgCountRef.current = messages.filter(m => m.role === 'user').length;
  }, [messages]);

  useEffect(() => {
    return () => { logActivity(msgCountRef.current); };
  }, []);

  const createConversation = useCallback(async (displayTitle) => {
    const conv = await db.agents.createConversation({
      agent_name: 'oppa_joeris',
      metadata: { name: displayTitle, mode: activeMode, student_email: user?.email }
    });
    await db.entities.Conversation.create({ title: displayTitle, last_message_preview: displayTitle });
    return conv;
  }, [activeMode, user]);

  const handleSend = useCallback(async (content, fileUrls) => {
    setIsLoading(true);
    const prefix = MODE_PREFIXES[activeMode] || '';
    const fullContent = prefix + content;
    const msgPayload = { role: 'user', content: fullContent };
    if (fileUrls?.length) msgPayload.file_urls = fileUrls;

    if (!activeConversationId) {
      const title = content.length > 45 ? content.slice(0, 45) + '...' : content;
      const conv = await createConversation(title);
      setActiveConversationId(conv.id);
      setMessages([{ role: 'user', content }]);
      sessionStartRef.current = Date.now();
      await db.agents.addMessage(conv, msgPayload);
    } else {
      const conv = await db.agents.getConversation(activeConversationId);
      setMessages(prev => [...prev, { role: 'user', content }]);
      await db.agents.addMessage(conv, msgPayload);
    }
    await loadAgentConvs();
  }, [activeConversationId, activeMode, createConversation, loadAgentConvs]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const handleSelectMode = useCallback((mode) => {
    setActiveMode(mode);
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const handleDeleteConv = useCallback((convId) => {
    if (activeConversationId === convId) {
      setActiveConversationId(null);
      setMessages([]);
    }
    setAgentConversations(prev => prev.filter(c => c.id !== convId));
  }, [activeConversationId]);

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-14 bg-card border-b border-border flex items-center px-4 justify-between shrink-0 z-10" role="banner">
        <div className="flex items-center gap-2">
          {sidebarCollapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSidebarCollapsed(false)} aria-label="Show sidebar">
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">FalconHub</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium" aria-label="Student account">Student</span>
        </div>
        <ProfileMenu user={user} topbar />
      </header>

      <div className="flex flex-1 min-h-0">
        {!sidebarCollapsed && (
          <Sidebar
            conversations={agentConversations.map(c => ({ id: c.id, title: c.metadata?.name || 'New Chat' }))}
            activeId={activeConversationId}
            activeMode={activeMode}
            onSelectMode={handleSelectMode}
            onSelect={setActiveConversationId}
            onNew={handleNewChat}
            onDelete={handleDeleteConv}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            user={user}
            onVoiceMode={() => setVoiceModeOpen(true)}
            onCollapse={() => setSidebarCollapsed(true)}
          />
        )}
        <ChatArea
          messages={messages}
          onSend={handleSend}
          isLoading={isLoading}
          onToggleSidebar={() => setSidebarOpen(true)}
          activeMode={activeMode}
          user={user}
        />
      </div>

      <AnimatePresence>
        {voiceModeOpen && (
          <VoiceMode
            onClose={() => setVoiceModeOpen(false)}
            onSend={(text) => { handleSend(text); setVoiceModeOpen(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}