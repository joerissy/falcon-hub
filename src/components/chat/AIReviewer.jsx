const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';

import { Brain, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export default function AIReviewer({ quiz, onClose }) {
  const [reviewer, setReviewer] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    const generate = async () => {
      const questionsText = quiz.questions.map((q, i) =>
        `${i + 1}. ${q.question}\n   Correct answer: ${q.options[q.correct_index]}${q.explanation ? `\n   Explanation: ${q.explanation}` : ''}`
      ).join('\n\n');

      const prompt = `You are a helpful study reviewer. Based on this quiz titled "${quiz.title}", create a comprehensive study reviewer/guide for a student preparing to take it.

Quiz questions and answers:
${questionsText}

Create a well-structured reviewer with:
1. **Key Concepts** — A summary of the main topics covered
2. **Important Facts to Remember** — Bullet points of critical information
3. **Common Mistakes to Avoid** — Based on the question topics
4. **Quick Tips** — Memory tricks or mnemonics if applicable

Make it student-friendly, clear, and focused on helping them understand the material (not just memorize answers). Use markdown formatting.`;

      const result = await db.integrations.Core.InvokeLLM({ prompt });
      setReviewer(result || 'Could not generate reviewer. Please try again.');
      setLoading(false);
    };
    generate();
  }, [quiz.id]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-start justify-center pt-4 pb-4 px-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border rounded-t-2xl px-5 py-4 flex items-center gap-3 z-10">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Brain className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground truncate">AI Reviewer</h2>
            <p className="text-xs text-muted-foreground truncate">{quiz.title}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-14 w-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <Brain className="h-7 w-7 text-violet-600 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground mb-1">Generating your reviewer…</p>
                <p className="text-xs text-muted-foreground">Analyzing quiz topics and creating study materials</p>
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-li:text-foreground/80">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold text-foreground mt-5 mb-2 pb-1 border-b border-border">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold text-foreground mt-4 mb-1.5">{children}</h3>
                  ),
                  p: ({ children }) => <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="space-y-1 mb-3 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="space-y-1 mb-3 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="text-sm text-foreground/80 leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                }}
              >
                {reviewer}
              </ReactMarkdown>
            </div>
          )}

          {!loading && (
            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <Button onClick={onClose}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}