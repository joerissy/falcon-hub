import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Trophy, RotateCcw, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

function parseQuizQuestions(content) {
  if (!content) return [];
  console.log('[QuizView] raw content:', JSON.stringify(content));

  // Normalize: strip markdown bold (**), normalize line endings
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '');

  const questions = [];

  // Split on lines that start with "Q:" (with optional leading whitespace)
  const blocks = normalized.split(/\n(?=\s*Q:)/);

  for (const block of blocks) {
    const qMatch = block.match(/Q:\s*(.+)/);
    if (!qMatch) continue;

    const question = qMatch[1].trim();
    const choices = [];
    const labels = ['A', 'B', 'C', 'D'];

    for (const label of labels) {
      // Match "A)" or "A." with optional leading whitespace
      const m = block.match(new RegExp(`^\\s*${label}[\\)\\.]\\s*(.+)`, 'm'));
      if (m) choices.push(m[1].trim());
    }

    const answerMatch = block.match(/ANSWER:\s*([A-D])/i);
    const hintMatch = block.match(/HINT:\s*(.+)/i);

    const correct_index = answerMatch ? labels.indexOf(answerMatch[1].trim().toUpperCase()) : 0;
    const hint = hintMatch ? hintMatch[1].trim() : null;

    if (question && choices.length >= 2) {
      questions.push({ question, choices, correct_index, hint });
    }
  }

  // Fallback: old numbered format
  if (questions.length === 0) {
    const blocks2 = normalized.split(/\n(?=\s*\d+[\.\)]\s)/);
    for (const block of blocks2) {
      const questionMatch = block.match(/^\s*(\d+)[\.\)]\s*(.+?)(?:\n|$)/);
      if (!questionMatch) continue;
      const questionText = questionMatch[2].trim();
      if (questionText.length < 5) continue;
      const choiceMatches = [...block.matchAll(/\n\s*([a-dA-D][\.\)]\s*.+)/g)];
      const choices = choiceMatches.map(m => m[1].trim().replace(/^[a-dA-D][\.\)]\s*/, ''));
      questions.push({ question: questionText, choices, correct_index: null, hint: null });
    }
  }

  return questions;
}

function isQuizContent(content) {
  if (!content) return false;
  if (/Q:\s*.+\nA\)\s*.+\nB\)\s*.+/s.test(content)) return true;
  const questionMatches = (content.match(/(?:^|\n)\s*(?:\*\*)?\d+[\.\)]\s+.{10,}/gm) || []).length;
  return questionMatches >= 2;
}

export { isQuizContent };

export default function QuizView({ content }) {
  const [questions] = useState(() => parseQuizQuestions(content));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState({});
  const [revealed, setRevealed] = useState({});
  const [showHint, setShowHint] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  if (questions.length === 0) return null;

  const q = questions[current];
  const total = questions.length;
  const progress = (current / total) * 100;
  const isRevealed = revealed[current];
  const isCorrect = selected[current] === q.correct_index;

  const handleSelect = (ci) => {
    if (isRevealed || submitted) return;
    setSelected(prev => ({ ...prev, [current]: ci }));
    // Auto-reveal answer after selection if we have correct_index
    if (q.correct_index !== null) {
      setRevealed(prev => ({ ...prev, [current]: true }));
    }
  };

  const handleNext = () => {
    if (current < total - 1) setCurrent(i => i + 1);
    else setSubmitted(true);
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(i => i - 1);
  };

  const handleReset = () => {
    setCurrent(0);
    setSelected({});
    setRevealed({});
    setShowHint({});
    setSubmitted(false);
  };

  // ── Compact preview ───────────────────────────────────────────────────────
  if (!fullscreen) {
    return (
      <div className="w-full rounded-2xl border border-rose-300/60 bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-rose-500/5 border-b border-rose-300/40 flex items-center gap-3">
          <div className="h-6 w-6 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
            <span className="text-xs">❓</span>
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
            Quiz · {total} question{total !== 1 ? 's' : ''}
          </p>
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5 bg-rose-500 hover:bg-rose-600 text-white"
            onClick={() => setFullscreen(true)}
          >
            ▶ Start Quiz
          </Button>
        </div>
        <div className="px-4 py-3 space-y-1.5">
          {questions.slice(0, 3).map((q, i) => (
            <p key={i} className="text-xs text-muted-foreground truncate">
              <span className="font-semibold text-foreground mr-1">{i + 1}.</span>{q.question}
            </p>
          ))}
          {total > 3 && <p className="text-xs text-muted-foreground italic">+{total - 3} more questions...</p>}
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (submitted) {
    const correctCount = questions.filter((q, i) =>
      q.correct_index !== null ? selected[i] === q.correct_index : selected[i] !== undefined
    ).length;
    const answered = Object.keys(selected).length;
    const pct = Math.round((correctCount / total) * 100);

    return (
      <div className="fixed inset-0 bg-background z-[100] flex flex-col overflow-y-auto">
        <div className="max-w-xl mx-auto w-full px-5 py-10 text-center">
          <div className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold",
            pct >= 70 ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-600"
          )}>
            {pct}%
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <p className="text-xl font-bold text-foreground">
              {pct >= 90 ? 'Excellent!' : pct >= 70 ? 'Great job!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            {questions[0].correct_index !== null
              ? `${correctCount} correct out of ${total}`
              : `${answered} answered out of ${total}`}
          </p>

          <div className="space-y-3 text-left mb-8">
            {questions.map((q, i) => {
              const wasCorrect = q.correct_index !== null ? selected[i] === q.correct_index : selected[i] !== undefined;
              const wasAnswered = selected[i] !== undefined;
              return (
                <div key={i} className={cn(
                  "rounded-xl border p-4",
                  wasCorrect ? "border-primary/20 bg-primary/5" : "border-rose-500/20 bg-rose-500/5"
                )}>
                  <div className="flex items-start gap-2 mb-2">
                    {wasCorrect
                      ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      : <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />}
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                  </div>
                  {wasAnswered && q.choices.length > 0 && (
                    <div className="ml-6 space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        Your answer: <span className={cn("font-semibold", wasCorrect ? "text-primary" : "text-rose-600")}>{q.choices[selected[i]]}</span>
                      </p>
                      {!wasCorrect && q.correct_index !== null && (
                        <p className="text-xs text-muted-foreground">
                          Correct: <span className="font-semibold text-primary">{q.choices[q.correct_index]}</span>
                        </p>
                      )}
                    </div>
                  )}
                  {!wasAnswered && <p className="text-xs text-muted-foreground ml-6 italic">Not answered</p>}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Retake
            </Button>
            <Button onClick={() => setFullscreen(false)}>Done</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Fullscreen question ───────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={() => setFullscreen(false)}>
          ✕ Exit
        </Button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500 shrink-0" />
          <span className="font-semibold text-sm text-foreground">Quiz</span>
        </div>
        <div className="text-xs text-muted-foreground font-medium w-16 text-right">
          {current + 1} / {total}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted w-full shrink-0">
        <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Question + options */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-xl mx-auto space-y-4">
          {/* Question card */}
          <div className="rounded-2xl border-2 border-rose-400 bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <span>❓</span> Question {current + 1}
            </p>
            <p className="text-base font-bold text-foreground leading-snug">{q.question}</p>
          </div>

          {/* Hint button */}
          {q.hint && !isRevealed && (
            <div>
              {showHint[current] ? (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">{q.hint}</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowHint(prev => ({ ...prev, [current]: true }))}
                  className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-semibold px-3 py-1.5 rounded-lg border border-amber-300/50 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
                >
                  <Lightbulb className="h-3.5 w-3.5" /> Show Hint
                </button>
              )}
            </div>
          )}

          {/* Options */}
          {q.choices.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {q.choices.map((choice, ci) => {
                const isSelected = selected[current] === ci;
                const isCorrectOpt = ci === q.correct_index;
                let style = "border-border bg-card hover:border-rose-300 hover:bg-rose-50/40 text-foreground";
                if (isRevealed) {
                  if (isCorrectOpt) style = "border-primary bg-primary/10 text-primary";
                  else if (isSelected && !isCorrectOpt) style = "border-rose-500 bg-rose-500/10 text-rose-600";
                  else style = "border-border bg-card text-muted-foreground opacity-60";
                } else if (isSelected) {
                  style = "border-rose-400 bg-rose-50 text-rose-700";
                }

                return (
                  <button
                    key={ci}
                    onClick={() => handleSelect(ci)}
                    disabled={isRevealed}
                    className={cn("rounded-2xl border-2 px-4 py-4 text-sm font-semibold text-left transition-all flex items-center gap-3", style)}
                  >
                    <span className="text-xs font-bold opacity-60 shrink-0">{String.fromCharCode(65 + ci)}.</span>
                    <span className="flex-1">{choice}</span>
                    {isRevealed && isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    {isRevealed && isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Feedback after reveal */}
          {isRevealed && q.correct_index !== null && (
            <div className={cn(
              "rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2",
              isCorrect ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-600"
            )}>
              {isCorrect
                ? <><CheckCircle2 className="h-4 w-4" /> Correct! Well done.</>
                : <><XCircle className="h-4 w-4" /> Incorrect — the correct answer is <span className="font-bold ml-1">{String.fromCharCode(65 + q.correct_index)}</span>.</>
              }
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 border-t border-border bg-card px-5 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={handlePrev} disabled={current === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            className="flex-1 rounded-full"
            onClick={handleNext}
            disabled={!isRevealed && selected[current] === undefined && q.choices.length > 0}
          >
            {current < total - 1 ? 'Next →' : 'Finish Quiz'}
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={handleNext} disabled={current === total - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}