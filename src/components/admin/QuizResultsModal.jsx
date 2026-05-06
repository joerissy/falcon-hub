const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';

import { X, HelpCircle, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function QuizResultsModal({ classroom, students, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState({});
  const [expandedAttempt, setExpandedAttempt] = useState({});

  useEffect(() => {
    const load = async () => {
      const actList = await db.entities.StudentActivity.filter({ classroom_id: classroom.id }, '-created_date', 500);
      setActivities(actList.filter(a => a.quiz_score != null && a.mode_used === 'quiz'));
      setLoading(false);
    };
    load();
  }, [classroom.id]);

  const getStudentName = (email) => {
    const s = students.find(s => s.email === email);
    return s?.full_name || email;
  };

  const studentResults = activities
    .map(a => ({
      id: a.id,
      student_email: a.student_email,
      student_name: a.student_name || getStudentName(a.student_email),
      score: a.quiz_score,
      date: a.session_date,
      quiz_title: a.quiz_title || 'Quiz',
      quiz_answers: a.quiz_answers || [],
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group by student
  const byStudent = {};
  studentResults.forEach(r => {
    if (!byStudent[r.student_email]) byStudent[r.student_email] = [];
    byStudent[r.student_email].push(r);
  });

  const toggleStudent = (email) =>
    setExpandedStudent(prev => ({ ...prev, [email]: !prev[email] }));

  const toggleAttempt = (id) =>
    setExpandedAttempt(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-6 px-4 pb-6 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
          <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
            <HelpCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Quiz Results</h2>
            <p className="text-xs text-muted-foreground">{classroom.name}</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : studentResults.length === 0 ? (
            <div className="text-center py-16">
              <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No quiz results yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Results will appear here once students complete quizzes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-muted/40 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{Object.keys(byStudent).length}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{studentResults.length}</p>
                  <p className="text-xs text-muted-foreground">Attempts</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-primary">
                    {Math.round(studentResults.reduce((s, r) => s + r.score, 0) / studentResults.length)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Class avg</p>
                </div>
              </div>

              {/* Per-student */}
              {Object.entries(byStudent).map(([email, results]) => {
                const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
                const isStudentExpanded = expandedStudent[email];
                return (
                  <div key={email} className="border border-border rounded-xl overflow-hidden">
                    {/* Student row */}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 bg-muted/20 hover:bg-muted/40 text-left transition-colors"
                      onClick={() => toggleStudent(email)}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {(results[0].student_name || email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{results[0].student_name}</p>
                        <p className="text-xs text-muted-foreground">{results.length} attempt{results.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className={cn(
                        "text-sm font-bold px-3 py-1 rounded-full",
                        avg >= 90 ? "bg-primary/10 text-primary" :
                        avg >= 70 ? "bg-emerald-500/10 text-emerald-600" :
                        avg >= 50 ? "bg-amber-500/10 text-amber-600" :
                        "bg-rose-500/10 text-rose-600"
                      )}>
                        {avg}% avg
                      </div>
                      {isStudentExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>

                    {/* Attempts list */}
                    {isStudentExpanded && (
                      <div className="divide-y divide-border">
                        {results.map((r) => {
                          const isAttemptExpanded = expandedAttempt[r.id];
                          const hasAnswers = r.quiz_answers && r.quiz_answers.length > 0;
                          return (
                            <div key={r.id}>
                              {/* Attempt row */}
                              <button
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
                                onClick={() => toggleAttempt(r.id)}
                              >
                                <div className={cn(
                                  "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                                  r.score >= 70 ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-600"
                                )}>
                                  {r.score}%
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-foreground">{r.quiz_title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {r.date ? format(new Date(r.date), 'MMM d, yyyy') : 'Unknown date'}
                                  </p>
                                </div>
                                {r.score >= 70
                                  ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                  : <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                }
                                {isAttemptExpanded
                                  ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                }
                              </button>

                              {/* Per-question breakdown */}
                              {isAttemptExpanded && (
                                <div className="px-4 pb-3 space-y-2 bg-muted/10">
                                  {!hasAnswers && (
                                    <p className="text-xs text-muted-foreground text-center py-3 italic">
                                      Detailed answer breakdown is only available for quizzes taken after this feature was enabled.
                                    </p>
                                  )}
                                  {r.quiz_answers.map((qa, qi) => {
                                    const isCorrect = qa.chosen_index === qa.correct_index;
                                    const skipped = qa.chosen_index === -1;
                                    return (
                                      <div
                                        key={qi}
                                        className={cn(
                                          "rounded-xl border p-3",
                                          isCorrect
                                            ? "border-primary/20 bg-primary/5"
                                            : "border-rose-500/20 bg-rose-500/5"
                                        )}
                                      >
                                        <div className="flex items-start gap-2 mb-2">
                                          {isCorrect
                                            ? <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                            : <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                          }
                                          <p className="text-xs font-medium text-foreground leading-snug">{qa.question}</p>
                                        </div>

                                        {qa.options && qa.options.length > 0 && (
                                          <div className="ml-5 space-y-1">
                                            {qa.options.map((opt, oi) => {
                                              const isChosen = oi === qa.chosen_index;
                                              const isCorrectOpt = oi === qa.correct_index;
                                              return (
                                                <div
                                                  key={oi}
                                                  className={cn(
                                                    "flex items-center gap-2 px-2 py-1 rounded-lg text-xs",
                                                    isCorrectOpt && "bg-primary/10 text-primary font-semibold",
                                                    isChosen && !isCorrectOpt && "bg-rose-500/10 text-rose-600 font-semibold",
                                                    !isChosen && !isCorrectOpt && "text-muted-foreground"
                                                  )}
                                                >
                                                  {isCorrectOpt && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                                                  {isChosen && !isCorrectOpt && <XCircle className="h-3 w-3 text-rose-500 shrink-0" />}
                                                  {!isChosen && !isCorrectOpt && <span className="h-3 w-3 shrink-0" />}
                                                  <span>{opt}</span>
                                                  {isChosen && !isCorrectOpt && <span className="ml-auto text-rose-500 text-[10px]">student's answer</span>}
                                                  {isCorrectOpt && <span className="ml-auto text-primary text-[10px]">correct</span>}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {skipped && (
                                          <p className="ml-5 text-xs text-muted-foreground italic mt-1">Not answered</p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}