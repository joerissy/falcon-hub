import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import WelcomeScreen from './WelcomeScreen';
import ChatInput from './ChatInput';
import QuizGenerator from './QuizGenerator';
import { Button } from "@/components/ui/button";
import { Menu, Lightbulb, FileText, HelpCircle, CreditCard, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const modeLabels = {
  chat: { label: 'Free Chat', icon: MessageSquare },
  concept: { label: 'Concept Explainer', icon: Lightbulb },
  summarizer: { label: 'Summarizer', icon: FileText },
  quiz: { label: 'Quiz Generator', icon: HelpCircle },
  flashcard: { label: 'Flashcard Generator', icon: CreditCard },
};

export default function ChatArea({ messages, onSend, isLoading, onToggleSidebar, activeMode = 'chat', onSendWithFiles, user, onModeChange }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasMessages = messages && messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Top bar */}
      <div className="h-12 border-b border-border/60 flex items-center px-4 shrink-0 bg-card/70 backdrop-blur-md">
        <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 mr-2" onClick={onToggleSidebar} aria-label="Open sidebar menu">
          <Menu className="h-4 w-4" />
        </Button>
        {(() => {
          const m = modeLabels[activeMode];
          const Icon = m?.icon || MessageSquare;
          return (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/15 flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">{m?.label || 'AI Tutor'}</span>
            </div>
          );
        })()}
      </div>

      {/* Quiz Generator — standalone direct mode */}
      {activeMode === 'quiz' && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6">
            <QuizGenerator />
          </div>
        </div>
      )}

      {/* Messages or Welcome */}
      {activeMode !== 'quiz' && hasMessages ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageBubble message={msg} />
              </motion.div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      ) : activeMode !== 'quiz' ? (
        <WelcomeScreen onSuggestionClick={onSend} activeMode={activeMode} user={user} />
      ) : null}

      {/* Input — hidden in quiz mode */}
      {activeMode !== 'quiz' && (
        <div className="shrink-0">
          <ChatInput onSend={(text, fileUrls) => onSend(text, fileUrls)} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}