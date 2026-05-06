const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';

import { GraduationCap, Lightbulb, FileText, HelpCircle, CreditCard, MessageSquare } from 'lucide-react';

const staticConfig = {
  chat: {
    icon: GraduationCap,
    title: "Hi, I'm FalconHub",
    subtitle: "Your AI tutor ready to guide your learning journey. I won't give you answers — I'll help you find them yourself.",
    color: 'text-primary',
    bg: 'bg-primary/10',
    fallback: [
      "Help me understand photosynthesis",
      "I'm struggling with Newton's laws",
      "Explain the causes of World War I",
      "I need help with quadratic equations",
    ],
  },
  concept: {
    icon: Lightbulb,
    title: "Concept Explainer",
    subtitle: "Tell me any topic or concept and I'll break it down clearly with examples, analogies, and the 'why' behind it.",
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    fallback: [
      "Explain how DNA replication works",
      "What is the concept of supply and demand?",
      "Break down photosynthesis for me",
      "Explain recursion in programming",
    ],
  },
  summarizer: {
    icon: FileText,
    title: "Text Summarizer",
    subtitle: "Paste any text, article, or describe a chapter and I'll extract the key ideas in a clear, structured summary.",
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    fallback: [
      "Summarize the French Revolution",
      "Here's a passage I need summarized: [paste text]",
      "Key points of the water cycle",
      "Summarize the themes of Romeo and Juliet",
    ],
  },
  quiz: {
    icon: HelpCircle,
    title: "Quiz Generator",
    subtitle: "Give me a topic and I'll generate challenging quiz questions to test your understanding — no answers included!",
    color: 'text-rose-600',
    bg: 'bg-rose-500/10',
    fallback: [
      "Quiz me on the periodic table",
      "Generate questions about World War II",
      "Test my knowledge of Python basics",
      "Create a quiz on the human digestive system",
    ],
  },
  flashcard: {
    icon: CreditCard,
    title: "Flashcard Generator",
    subtitle: "Give me a topic and I'll create study flashcards with hints on the back — perfect for memorization and review.",
    color: 'text-violet-600',
    bg: 'bg-violet-500/10',
    fallback: [
      "Flashcards for the elements in Group 1",
      "Vocabulary flashcards for Spanish basics",
      "Flashcards on key history dates",
      "Flashcards for calculus formulas",
    ],
  },
};

export default function WelcomeScreen({ onSuggestionClick, activeMode = 'chat', user }) {
  const config = staticConfig[activeMode] || staticConfig.chat;
  const Icon = config.icon;
  const [suggestions, setSuggestions] = useState(config.fallback);

  useEffect(() => {
    const loadDynamic = async () => {
      try {
        // Get quizzes from teacher (title-based suggestions)
        const quizSuggestions = [];
        if (user?.email) {
          const classrooms = await db.entities.Classroom.filter({ student_emails: user.email });
          if (classrooms.length > 0) {
            const quizResults = await Promise.all(
              classrooms.map(c => db.entities.Quiz.filter({ classroom_id: c.id, status: 'published' }))
            );
            const quizzes = quizResults.flat().slice(0, 3);
            quizzes.forEach(q => {
              if (activeMode === 'quiz') {
                quizSuggestions.push(`Quiz me on: ${q.title}`);
              } else if (activeMode === 'flashcard') {
                quizSuggestions.push(`Flashcards for: ${q.title}`);
              } else if (activeMode === 'concept') {
                quizSuggestions.push(`Explain the key concepts in: ${q.title}`);
              } else {
                quizSuggestions.push(`Help me study: ${q.title}`);
              }
            });
          }
        }

        // Get recent conversations as "what others searched"
        const recentConvs = await db.agents.listConversations({ agent_name: 'oppa_joeris' });
        const recentTitles = recentConvs
          .filter(c => c.metadata?.name && c.metadata.name.length > 5 && c.metadata.name !== 'New Chat')
          .slice(0, 6)
          .map(c => c.metadata.name);

        const combined = [...quizSuggestions, ...recentTitles];
        const unique = [...new Set(combined)].slice(0, 4);
        setSuggestions(unique.length >= 2 ? unique : config.fallback);
      } catch {
        setSuggestions(config.fallback);
      }
    };
    loadDynamic();
  }, [activeMode, user?.email]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 gap-6">
      <div
        key={activeMode}
        className="flex flex-col items-center animate-[fadeInUp_0.45s_ease_both]"
      >
        <div className="relative mb-5">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-primary/20 blur-xl rounded-full" />
          <div className="relative bg-gradient-to-b from-card to-accent/30 border border-border/60 rounded-3xl p-5 shadow-xl">
            <img
              src="https://media.db.com/images/public/69ef66fe4f340c1dcd4f7578/1f99ebf78_684434411_1447343886627885_3205513454921292553_n.png"
              alt="Falcon mascot"
              className="h-32 w-32 object-contain drop-shadow-lg"
              loading="lazy"
              width="128"
              height="128"
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">{config.title}</h1>
        <p className="text-muted-foreground text-sm max-w-sm text-center leading-relaxed">{config.subtitle}</p>
      </div>

      <div
        key={`suggestions-${activeMode}`}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full animate-[fadeInUp_0.4s_0.12s_ease_both]"
      >
        {suggestions.map((text, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(text)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/40 transition-all text-left group"
          >
            <div className={`h-7 w-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
            </div>
            <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors leading-snug">
              {text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}