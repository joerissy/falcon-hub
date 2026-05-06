const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';

import { X, GraduationCap, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

export default function StudentHistoryModal({ student, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch all conversations and filter by student email in metadata or created_by
        const convs = await db.agents.listConversations({ agent_name: 'oppa_joeris' });
        const studentConvs = convs.filter(c =>
          c.created_by === student.email ||
          c.metadata?.student_email === student.email
        );
        setConversations(studentConvs);
      } catch (e) {
        setConversations([]);
      }
      setLoading(false);
    };
    load();
  }, [student.email]);

  const loadMessages = async (conv) => {
    setSelectedConv(conv);
    setLoadingMsgs(true);
    const full = await db.agents.getConversation(conv.id);
    setMessages(full.messages || []);
    setLoadingMsgs(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">
              {(student.full_name || student.email || '?')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{student.full_name || 'Student'}</p>
            <p className="text-xs text-muted-foreground">{student.email}</p>
          </div>
          <Button size="icon" variant="ghost" className="ml-auto h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Conversation list */}
          <div className="w-52 border-r border-border overflow-y-auto shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-2">Chats</p>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 px-3">No chats found for this student</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadMessages(conv)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                    selectedConv?.id === conv.id ? "bg-accent text-accent-foreground" : "hover:bg-muted text-foreground/70"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{conv.metadata?.name || 'Chat'}</span>
                </button>
              ))
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedConv ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Select a chat to view messages</p>
              </div>
            ) : loadingMsgs ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              messages.filter(m => m.content).map((msg, i) => (
                <div key={i} className={cn("flex gap-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role !== 'user' && (
                    <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted border border-border rounded-bl-md"
                  )}>
                    {msg.role === 'user' ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown className="prose prose-sm max-w-none text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}