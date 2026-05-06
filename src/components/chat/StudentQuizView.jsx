const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef } from 'react';

import { HelpCircle, X, CheckCircle2, XCircle, Trophy, AlertTriangle, Maximize2, Brain, BookOpen, Download, BarChart2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import AIReviewer from './AIReviewer';

// ─── Exit-warning modal ─────────────────────────────────────────────────────
function ExitWarningModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
        <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
        </div>
        <h3 className="font-bold text-foreground text-lg mb-2">Leave the quiz?</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          This quiz is <span className="font-semibold text-foreground">not retakeable</span>. If you leave now your progress will be lost and you won't be able to attempt it again.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Stay</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>Leave anyway</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Fullscreen quiz ─────────────────────────────────────────────────────────
function FullscreenQuiz({ quiz, user, onFinished, onForceExit }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const containerRef = useRef(null);

  const total = quiz.questions.length;
  const q = quiz.questions[currentQ];
  const progress = ((currentQ) / total) * 100;
  const answered = answers[currentQ] !== undefined;

  useEffect(() => {
    const el = containerRef.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => {});
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && !submitted) setShowExitWarning(true);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [submitted]);

  const handleSelect = (oi) => {
    setAnswers(prev => ({ ...prev, [currentQ]: oi }));
  };

  const handleNext = () => {
    if (currentQ < total - 1) {
      setCurrentQ(i => i + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    let correct = 0;
    quiz.questions.forEach((q, i) => { if (answers[i] === q.correct_index) correct++; });
    const pct = Math.round((correct / quiz.questions.length) * 100);
    setScore(pct);
    setSubmitted(true);
    const scores = JSON.parse(localStorage.getItem('quiz_scores') || '{}');
    scores[quiz.id] = pct;
    localStorage.setItem('quiz_scores', JSON.stringify(scores));
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

    const quizAnswers = quiz.questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      chosen_index: answers[i] ?? -1,
      correct_index: q.correct_index,
    }));

    await db.entities.StudentActivity.create({
      student_email: user.email, student_name: user.full_name,
      classroom_id: quiz.classroom_id, session_date: new Date().toISOString().split('T')[0],
      messages_sent: 0, study_minutes: 0, mode_used: 'quiz', quiz_score: pct,
      quiz_id: quiz.id, quiz_title: quiz.title, quiz_answers: quizAnswers,
    });
  };

  const confirmExit = () => { setShowExitWarning(false); onForceExit(); };
  const stayInQuiz = () => {
    setShowExitWarning(false);
    const el = containerRef.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => {});
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-background z-[100] flex flex-col">
      {showExitWarning && <ExitWarningModal onConfirm={confirmExit} onCancel={stayInQuiz} />}

      {submitted ? (
        // ── Results screen ──
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto px-6 py-10 text-center">
            <div className={cn(
              "h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold",
              score >= 70 ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-600"
            )}>{score}%</div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <p className="text-xl font-bold text-foreground">
                {score >= 90 ? 'Excellent!' : score >= 70 ? 'Great job!' : score >= 50 ? 'Good effort!' : 'Keep practicing!'}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-8">
              You got {quiz.questions.filter((q, i) => answers[i] === q.correct_index).length} out of {total} correct
            </p>
            <div className="space-y-3 text-left mb-8">
              {quiz.questions.map((q, i) => {
                const isCorrect = answers[i] === q.correct_index;
                return (
                  <div key={i} className={cn("rounded-xl border p-4", isCorrect ? "border-primary/30 bg-primary/5" : "border-rose-500/30 bg-rose-500/5")}>
                    <div className="flex items-start gap-2 mb-1">
                      {isCorrect ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />}
                      <p className="text-sm font-medium text-foreground">{q.question}</p>
                    </div>
                    {!isCorrect && <p className="text-xs text-muted-foreground ml-6">Correct: <span className="text-primary font-medium">{q.options[q.correct_index]}</span></p>}
                    {q.explanation && <p className="text-xs text-muted-foreground/70 ml-6 mt-1 italic">{q.explanation}</p>}
                  </div>
                );
              })}
            </div>
            <Button className="w-full max-w-xs" onClick={onFinished}>Done</Button>
          </div>
        </div>
      ) : (
        // ── Question screen ──
        <div className="flex flex-col h-full">
          {/* Top bar */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-card shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setShowExitWarning(true)}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex items-center justify-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500 shrink-0" />
              <span className="font-semibold text-sm text-foreground truncate max-w-xs">{quiz.title}</span>
            </div>
            <div className="h-8 w-8" />
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted w-full shrink-0">
            <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between px-5 py-3 bg-card border-b border-border shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-muted-foreground">
                {currentQ + 1} <span className="text-muted-foreground/50">/ {total}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-base">✅</span>
                <span className="text-sm font-bold text-foreground">{Object.values(answers).filter((a, i) => a === quiz.questions[i]?.correct_index).length}</span>
              </div>
            </div>
            <div className="px-4 py-1 rounded-full border border-border text-xs font-semibold text-muted-foreground bg-muted/40">
              {answered ? '+ XP' : '+ 0 XP'}
            </div>
          </div>

          {/* Question card + options */}
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="max-w-xl mx-auto space-y-5">
              {/* Question card */}
              <div className="rounded-2xl border-2 border-rose-400 bg-card p-5 shadow-sm">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <span>🕐</span> Question {currentQ + 1}
                </p>
                <p className="text-base font-bold text-foreground leading-snug">{q.question}</p>
              </div>

              {/* Options 2-col grid */}
              <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => handleSelect(oi)}
                    className={cn(
                      "rounded-2xl border-2 px-4 py-5 text-sm font-semibold text-center transition-all",
                      answers[currentQ] === oi
                        ? "border-rose-400 bg-rose-50 text-rose-700"
                        : "border-border bg-card hover:border-rose-300 hover:bg-rose-50/40 text-foreground"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Bottom action bar */}
          <div className="shrink-0 border-t border-border bg-card px-5 py-4">
            <div className="max-w-xl mx-auto">
              <Button
                className="w-full rounded-full"
                onClick={handleNext}
                disabled={!answered}
              >
                {currentQ < total - 1 ? 'Next →' : 'Submit Quiz'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teacher Reviewer Modal ───────────────────────────────────────────────────
function TeacherReviewerModal({ quiz, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-start justify-center pt-4 pb-4 px-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="sticky top-0 bg-card border-b border-border rounded-t-2xl px-5 py-4 flex items-center gap-3 z-10">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground">Reviewer</h2>
            <p className="text-xs text-muted-foreground truncate">{quiz.title} · from your teacher</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">
          {quiz.teacher_reviewer && (
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap mb-4">{quiz.teacher_reviewer}</p>
          )}
          {quiz.reviewer_file_url && (
            <a
              href={quiz.reviewer_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all mb-4"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Download Reviewer File</p>
                <p className="text-xs text-muted-foreground truncate">{quiz.reviewer_file_name || 'Attached file'}</p>
              </div>
            </a>
          )}
          <div className="mt-4 pt-4 border-t border-border flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz list ───────────────────────────────────────────────────────────────
export default function StudentQuizView({ user, onClose }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [aiReviewerQuiz, setAiReviewerQuiz] = useState(null);
  const [teacherReviewerQuiz, setTeacherReviewerQuiz] = useState(null);
  // Track which quiz IDs have been completed this session (non-retakeable)
  const [completedIds, setCompletedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('completed_quiz_ids') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const load = async () => {
      const classrooms = await db.entities.Classroom.filter({ student_emails: user.email });
      if (classrooms.length === 0) { setLoading(false); return; }
      const all = await Promise.all(
        classrooms.map(c => db.entities.Quiz.filter({ classroom_id: c.id, status: 'published' }))
      );
      setQuizzes(all.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setLoading(false);
    };
    load();
  }, [user.email]);

  const startQuiz = (quiz) => {
    if (completedIds.includes(quiz.id)) {
      toast.error('You have already completed this quiz. It cannot be retaken.');
      return;
    }
    setActiveQuiz(quiz);
  };

  const handleFinished = () => {
    // Mark as completed
    const updated = [...new Set([...completedIds, activeQuiz.id])];
    setCompletedIds(updated);
    localStorage.setItem('completed_quiz_ids', JSON.stringify(updated));
    setActiveQuiz(null);
    onClose();
  };

  const handleForceExit = () => {
    // Mark as completed so they can't retake even after abandoning
    const updated = [...new Set([...completedIds, activeQuiz.id])];
    setCompletedIds(updated);
    localStorage.setItem('completed_quiz_ids', JSON.stringify(updated));
    setActiveQuiz(null);
  };

  if (activeQuiz) {
    return (
      <FullscreenQuiz
        quiz={activeQuiz}
        user={user}
        onFinished={handleFinished}
        onForceExit={handleForceExit}
      />
    );
  }

  if (aiReviewerQuiz) {
    return <AIReviewer quiz={aiReviewerQuiz} onClose={() => setAiReviewerQuiz(null)} />;
  }

  if (teacherReviewerQuiz) {
    return <TeacherReviewerModal quiz={teacherReviewerQuiz} onClose={() => setTeacherReviewerQuiz(null)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4 pb-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
          <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <HelpCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">Quizzes</h2>
            <p className="text-xs text-muted-foreground">From your teachers</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Average Score Banner */}
        {!loading && completedIds.length > 0 && (() => {
          const scores = JSON.parse(localStorage.getItem('quiz_scores') || '{}');
          const completedScores = completedIds.map(id => scores[id]).filter(s => s != null);
          if (completedScores.length === 0) return null;
          const avg = Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length);
          return (
            <div className={cn(
              "mx-4 mt-4 px-4 py-3 rounded-xl border flex items-center gap-3",
              avg >= 70 ? "bg-primary/5 border-primary/30" : "bg-rose-500/5 border-rose-500/30"
            )}>
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", avg >= 70 ? "bg-primary/10" : "bg-rose-500/10")}>
                <BarChart2 className={cn("h-4 w-4", avg >= 70 ? "text-primary" : "text-rose-600")} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Quiz Average</p>
                <p className={cn("text-xl font-bold", avg >= 70 ? "text-primary" : "text-rose-600")}>{avg}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{completedScores.length} quiz{completedScores.length !== 1 ? 'zes' : ''} taken</p>
                <p className="text-xs text-muted-foreground">{avg >= 90 ? '🏆 Excellent' : avg >= 70 ? '✅ Passing' : '📚 Keep studying'}</p>
              </div>
            </div>
          );
        })()}

        <div className="flex-1 p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No quizzes yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Your teacher hasn't published any quizzes</p>
            </div>
          ) : (
            quizzes.map(quiz => {
              const done = completedIds.includes(quiz.id);
              const hasTeacherReviewer = !!quiz.teacher_reviewer?.trim();
              const hasAiReviewer = quiz.allow_ai_reviewer !== false;
              return (
                <div key={quiz.id} className={cn(
                  "border rounded-xl p-4 space-y-3 transition-all",
                  done ? "border-border bg-muted/20" : "border-border hover:border-primary/20"
                )}>
                  {/* Quiz info */}
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{quiz.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full font-medium">{quiz.classroom_name}</span>
                        <span className="text-xs text-muted-foreground/60">{quiz.questions?.length || 0} questions</span>
                        {done && <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</span>}
                      </div>
                      {quiz.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{quiz.description}</p>}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-1 gap-2">
                    {/* Take Quiz */}
                    <button
                      onClick={() => startQuiz(quiz)}
                      disabled={done}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                        done
                          ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                          : "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/50"
                      )}
                    >
                      <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                        <Maximize2 className="h-4 w-4 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{done ? 'Quiz Completed' : 'Take the Quiz'}</p>
                        <p className="text-xs text-muted-foreground">{done ? 'You already submitted this quiz' : 'Answer all questions · Not retakeable'}</p>
                      </div>
                    </button>

                    {/* AI Reviewer */}
                    {hasAiReviewer && (
                      <button
                        onClick={() => setAiReviewerQuiz(quiz)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50 text-left transition-all"
                      >
                        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                          <Brain className="h-4 w-4 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">AI Reviewer</p>
                          <p className="text-xs text-muted-foreground">Let AI create a study guide from this quiz</p>
                        </div>
                      </button>
                    )}

                    {/* Teacher Reviewer */}
                    {hasTeacherReviewer && (
                      <button
                        onClick={() => setTeacherReviewerQuiz(quiz)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 text-left transition-all"
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Teacher's Reviewer</p>
                          <p className="text-xs text-muted-foreground">Study guide attached by your teacher</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}