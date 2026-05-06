const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { HelpCircle, Loader2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trophy, RotateCcw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Step 1: Ask for topic
// Step 2: Ask for count
// Step 3: Generate + show quiz

export default function QuizGenerator({ onDone }) {
  const [step, setStep] = useState('topic'); // 'topic' | 'count' | 'generating' | 'quiz' | 'results'
  const [topic, setTopic] = useState('');
  const [countInput, setCountInput] = useState('');
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState({});
  const [revealed, setRevealed] = useState({});
  const [showHint, setShowHint] = useState({});
  const [error, setError] = useState('');

  const generateQuiz = async (topicText, count) => {
    setStep('generating');
    setError('');
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `Generate exactly ${count} multiple-choice quiz questions about: "${topicText}".
Each question MUST have exactly 4 answer options (A, B, C, D) and one correct answer index (0-3).
Return ONLY valid JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                correct_index: { type: 'number' },
                hint: { type: 'string' },
              },
              required: ['question', 'options', 'correct_index'],
            },
          },
        },
        required: ['questions'],
      },
    });

    if (!result?.questions?.length) {
      setError('Failed to generate questions. Please try again.');
      setStep('topic');
      return;
    }

    setQuestions(result.questions);
    setCurrent(0);
    setSelected({});
    setRevealed({});
    setShowHint({});
    setStep('quiz');
  };

  const handleTopicSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setStep('count');
  };

  const handleCountSubmit = (e) => {
    e.preventDefault();
    const n = parseInt(countInput);
    if (!n || n < 1 || n > 20) { setError('Enter a number between 1 and 20'); return; }
    setError('');
    generateQuiz(topic.trim(), n);
  };

  const handleSelect = (ci) => {
    if (revealed[current]) return;
    setSelected(prev => ({ ...prev, [current]: ci }));
    setRevealed(prev => ({ ...prev, [current]: true }));
  };

  const handleNext = () => {
    if (current < questions.length - 1) setCurrent(i => i + 1);
    else setStep('results');
  };

  const handleReset = () => {
    setStep('topic');
    setTopic('');
    setCountInput('');
    setQuestions([]);
    setCurrent(0);
    setSelected({});
    setRevealed({});
    setShowHint({});
  };

  // ── Topic input ────────────────────────────────────────────────────────────
  if (step === 'topic') {
    return (
      <div className="w-full rounded-2xl border border-rose-300/60 bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-rose-500/5 border-b border-rose-300/40 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-rose-500" />
          <p className="text-sm font-semibold text-foreground">Quiz Generator</p>
        </div>
        <form onSubmit={handleTopicSubmit} className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">What topic would you like to be quizzed on?</p>
          <input
            autoFocus
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Gene Flow, World War II, Python basics..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/50"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={!topic.trim()} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
            Continue →
          </Button>
        </form>
      </div>
    );
  }

  // ── Count input ────────────────────────────────────────────────────────────
  if (step === 'count') {
    return (
      <div className="w-full rounded-2xl border border-rose-300/60 bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-rose-500/5 border-b border-rose-300/40 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-rose-500" />
          <p className="text-sm font-semibold text-foreground">Quiz Generator</p>
        </div>
        <form onSubmit={handleCountSubmit} className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Topic: <span className="font-semibold text-foreground">{topic}</span>
          </p>
          <p className="text-sm text-muted-foreground">How many questions? (1–20)</p>
          <div className="flex gap-2 flex-wrap">
            {[3, 5, 10, 15, 20].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setCountInput(String(n))}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                  countInput === String(n)
                    ? "bg-rose-500 border-rose-500 text-white"
                    : "border-border bg-card hover:border-rose-300 text-foreground"
                )}
              >
                {n}
              </button>
            ))}
            <input
              value={countInput}
              onChange={e => setCountInput(e.target.value.replace(/\D/g, ''))}
              placeholder="or type..."
              className="w-20 px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/50"
              maxLength={2}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={!countInput} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
            Generate Quiz
          </Button>
        </form>
      </div>
    );
  }

  // ── Generating ─────────────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="w-full rounded-2xl border border-rose-300/60 bg-card shadow-sm p-6 flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
        <p className="text-sm font-semibold text-foreground">Generating your quiz on "{topic}"...</p>
        <p className="text-xs text-muted-foreground">This takes a few seconds</p>
      </div>
    );
  }

  const total = questions.length;
  const q = questions[current];
  const isRevealed = revealed[current];
  const isCorrect = selected[current] === q?.correct_index;

  // ── Results ────────────────────────────────────────────────────────────────
  if (step === 'results') {
    const correctCount = questions.filter((q, i) => selected[i] === q.correct_index).length;
    const pct = Math.round((correctCount / total) * 100);

    return (
      <div className="w-full rounded-2xl border border-rose-300/60 bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-rose-500/5 border-b border-rose-300/40 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-foreground">Results — {topic}</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-center">
            <div className={cn("h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl font-bold", pct >= 70 ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-600")}>
              {pct}%
            </div>
            <p className="font-bold text-foreground">{pct >= 90 ? 'Excellent!' : pct >= 70 ? 'Great job!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'}</p>
            <p className="text-xs text-muted-foreground">{correctCount} correct out of {total}</p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {questions.map((q, i) => {
              const correct = selected[i] === q.correct_index;
              return (
                <div key={i} className={cn("rounded-xl border p-3", correct ? "border-primary/20 bg-primary/5" : "border-rose-500/20 bg-rose-500/5")}>
                  <div className="flex items-start gap-2">
                    {correct ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">{q.question}</p>
                      {!correct && q.options && (
                        <p className="text-xs text-muted-foreground mt-0.5">Correct: <span className="text-primary font-semibold">{q.options[q.correct_index]}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" /> New Quiz
            </Button>
            <Button className="flex-1 bg-rose-500 hover:bg-rose-600 text-white gap-1.5" onClick={() => { setStep('quiz'); setCurrent(0); setSelected({}); setRevealed({}); setShowHint({}); }}>
              <RotateCcw className="h-3.5 w-3.5" /> Retake
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="w-full rounded-2xl border border-rose-300/60 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-rose-500/5 border-b border-rose-300/40 flex items-center gap-3">
        <HelpCircle className="h-4 w-4 text-rose-500" />
        <p className="text-sm font-semibold text-foreground flex-1">{topic} · {total} questions</p>
        <span className="text-xs text-muted-foreground font-medium">{current + 1}/{total}</span>
      </div>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="p-4 space-y-4">
        {/* Question */}
        <div className="rounded-xl border-2 border-rose-300/60 bg-rose-500/3 p-4">
          <p className="text-xs text-muted-foreground mb-1">Question {current + 1}</p>
          <p className="text-sm font-bold text-foreground leading-snug">{q.question}</p>
        </div>

        {/* Hint */}
        {q.hint && !isRevealed && (
          showHint[current] ? (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-400/30">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">{q.hint}</p>
            </div>
          ) : (
            <button onClick={() => setShowHint(p => ({ ...p, [current]: true }))} className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold px-3 py-1.5 rounded-lg border border-amber-300/50 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
              <Lightbulb className="h-3 w-3" /> Show Hint
            </button>
          )
        )}

        {/* Options */}
        <div className="grid gap-2">
          {(q.options || []).map((opt, ci) => {
            const isSelected = selected[current] === ci;
            const isCorrectOpt = ci === q.correct_index;
            let style = "border-border bg-card hover:border-rose-300 hover:bg-rose-50/40 dark:hover:bg-rose-900/10 text-foreground";
            if (isRevealed) {
              if (isCorrectOpt) style = "border-primary bg-primary/10 text-primary";
              else if (isSelected) style = "border-rose-500 bg-rose-500/10 text-rose-600";
              else style = "border-border bg-card text-muted-foreground opacity-50";
            } else if (isSelected) {
              style = "border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-700";
            }
            return (
              <button
                key={ci}
                onClick={() => handleSelect(ci)}
                disabled={isRevealed}
                className={cn("rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-all flex items-center gap-3", style)}
              >
                <span className="text-xs font-bold opacity-50 shrink-0">{String.fromCharCode(65 + ci)}.</span>
                <span className="flex-1">{opt}</span>
                {isRevealed && isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                {isRevealed && isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {isRevealed && (
          <div className={cn("rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2", isCorrect ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-600")}>
            {isCorrect ? <><CheckCircle2 className="h-4 w-4" /> Correct!</> : <><XCircle className="h-4 w-4" /> The correct answer is <span className="font-bold ml-1">{String.fromCharCode(65 + q.correct_index)}</span>.</>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 pt-1">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={() => setCurrent(i => i - 1)} disabled={current === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            className="flex-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white"
            onClick={handleNext}
            disabled={selected[current] === undefined}
          >
            {current < total - 1 ? 'Next →' : 'Finish Quiz'}
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0" onClick={() => setCurrent(i => i + 1)} disabled={current === total - 1 || selected[current] === undefined}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}