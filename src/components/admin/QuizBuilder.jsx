const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { HelpCircle, Plus, Trash2, Sparkles, Loader2, FileUp, X, ChevronDown, ChevronUp, Send, Brain, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function QuizBuilder({ classroom, user, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiFile, setAiFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedQ, setExpandedQ] = useState({});
  const [allowAiReviewer, setAllowAiReviewer] = useState(true);
  const [teacherReviewer, setTeacherReviewer] = useState('');
  const [reviewerFile, setReviewerFile] = useState(null);
  const [uploadingReviewer, setUploadingReviewer] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setAiFile({ name: file.name, url: file_url });
    setUploading(false);
    toast.success('File uploaded!');
    e.target.value = '';
  };

  const generateWithAI = async () => {
    if (!aiTopic.trim() && !aiFile) return;
    setGenerating(true);
    const prompt = `Generate ${aiCount} multiple-choice quiz questions about: "${aiTopic || 'the uploaded material'}".
Each question must have exactly 4 options (A, B, C, D) and one correct answer.
${aiFile ? `Use the uploaded file as the primary material source.` : ''}
Return ONLY a JSON object matching this schema exactly.`;

    const result = await db.integrations.Core.InvokeLLM({
      prompt,
      file_urls: aiFile ? [aiFile.url] : undefined,
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
                explanation: { type: 'string' }
              }
            }
          }
        }
      }
    });

    if (result?.questions?.length) {
      setQuestions(result.questions);
      toast.success(`Generated ${result.questions.length} questions!`);
    } else {
      toast.error('Could not generate questions. Try again.');
    }
    setGenerating(false);
  };

  const updateQuestion = (i, field, value) => {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi, oi, value) => {
    setQuestions(prev => prev.map((q, idx) => idx === qi
      ? { ...q, options: q.options.map((o, oidx) => oidx === oi ? value : o) }
      : q
    ));
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' }]);
  };

  const removeQuestion = (i) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async (status) => {
    if (!title.trim() || questions.length === 0) {
      toast.error('Add a title and at least one question.');
      return;
    }
    setSaving(true);
    try {
      await db.entities.Quiz.create({
        classroom_id: classroom.id,
        classroom_name: classroom.name,
        teacher_email: user.email,
        title: title.trim(),
        description: description.trim(),
        questions,
        status,
        allow_ai_reviewer: allowAiReviewer,
        teacher_reviewer: teacherReviewer.trim(),
        reviewer_file_url: reviewerFile?.url || '',
        reviewer_file_name: reviewerFile?.name || '',
      });
      toast.success(status === 'published' ? 'Quiz published to students!' : 'Quiz saved as draft.');
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error('Failed to save quiz. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-4 pb-4 px-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <HelpCircle className="h-4.5 w-4.5 text-rose-600" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Create Quiz</h2>
            <p className="text-xs text-muted-foreground">{classroom.name}</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {/* Quiz info */}
          <div className="space-y-3">
            <Input placeholder="Quiz title..." value={title} onChange={e => setTitle(e.target.value)} className="text-sm" />
            <Textarea placeholder="Description (optional)..." value={description} onChange={e => setDescription(e.target.value)} rows={2} className="text-sm resize-none" />
          </div>

          {/* AI Generator */}
          <div className="border border-dashed border-primary/40 rounded-xl p-4 bg-primary/3 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Generate with AI</p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Topic or paste content..."
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                className="text-sm flex-1"
              />
              <select
                value={aiCount}
                onChange={e => setAiCount(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {[3, 5, 8, 10, 15].map(n => <option key={n} value={n}>{n} Qs</option>)}
              </select>
            </div>

            {/* File upload */}
            <div className="flex items-center gap-2">
              <label className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium cursor-pointer hover:bg-muted transition-colors",
                uploading && "opacity-50 cursor-not-allowed"
              )}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
                {uploading ? 'Uploading...' : 'Upload Material'}
                <input type="file" className="hidden" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" onChange={handleFileUpload} disabled={uploading} />
              </label>
              {aiFile && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-xs text-primary font-medium max-w-xs">
                  <span className="truncate">{aiFile.name}</span>
                  <button onClick={() => setAiFile(null)}><X className="h-3 w-3" /></button>
                </div>
              )}
            </div>

            <Button
              size="sm"
              onClick={generateWithAI}
              disabled={generating || uploading || (!aiTopic.trim() && !aiFile)}
              className="gap-1.5 w-full"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generating ? 'Generating...' : 'Generate Questions'}
            </Button>
          </div>

          {/* Questions */}
          {questions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{questions.length} Question{questions.length !== 1 ? 's' : ''}</p>
                <Button size="sm" variant="outline" onClick={addQuestion} className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {questions.map((q, qi) => (
                <div key={qi} className="border border-border rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 text-left transition-colors"
                    onClick={() => setExpandedQ(prev => ({ ...prev, [qi]: !prev[qi] }))}
                  >
                    <span className="text-xs font-bold text-primary bg-primary/10 rounded-full h-6 w-6 flex items-center justify-center shrink-0">{qi + 1}</span>
                    <span className="text-sm text-foreground flex-1 truncate">{q.question || 'Untitled question'}</span>
                    {expandedQ[qi] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    <button onClick={e => { e.stopPropagation(); removeQuestion(qi); }} className="text-muted-foreground hover:text-destructive ml-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </button>
                  {expandedQ[qi] && (
                    <div className="p-4 space-y-3">
                      <Textarea
                        value={q.question}
                        onChange={e => updateQuestion(qi, 'question', e.target.value)}
                        placeholder="Question text..."
                        rows={2}
                        className="text-sm resize-none"
                      />
                      <div className="grid grid-cols-1 gap-2">
                        {(q.options || ['', '', '', '']).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuestion(qi, 'correct_index', oi)}
                              className={cn(
                                "h-6 w-6 rounded-full border-2 shrink-0 transition-colors",
                                q.correct_index === oi ? "border-primary bg-primary" : "border-border"
                              )}
                            />
                            <Input
                              value={opt}
                              onChange={e => updateOption(qi, oi, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + oi)}...`}
                              className="text-sm h-8"
                            />
                          </div>
                        ))}
                      </div>
                      <Input
                        value={q.explanation || ''}
                        onChange={e => updateQuestion(qi, 'explanation', e.target.value)}
                        placeholder="Explanation (shown after answering)..."
                        className="text-xs h-8"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {questions.length === 0 && (
            <button onClick={addQuestion} className="w-full border-2 border-dashed border-border rounded-xl py-6 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Add question manually
            </button>
          )}

          {/* Reviewer Settings */}
          <div className="border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-violet-600" />
              <p className="text-sm font-semibold text-foreground">Reviewer Options</p>
            </div>

            {/* AI Reviewer Toggle */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40">
              <div>
                <p className="text-sm text-foreground font-medium">Allow AI Reviewer</p>
                <p className="text-xs text-muted-foreground">Students can generate an AI study guide from this quiz</p>
              </div>
              <button
                onClick={() => setAllowAiReviewer(v => !v)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                  allowAiReviewer ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  allowAiReviewer ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>

            {/* Teacher Reviewer */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attach Your Own Reviewer (optional)</p>
              </div>
              <Textarea
                placeholder="Paste or type your reviewer/study guide here. Students will be able to read this before or instead of taking the quiz..."
                value={teacherReviewer}
                onChange={e => setTeacherReviewer(e.target.value)}
                rows={3}
                className="text-sm resize-none mb-2"
              />
              {/* Reviewer file upload */}
              <div className="flex items-center gap-2">
                <label className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium cursor-pointer hover:bg-muted transition-colors",
                  uploadingReviewer && "opacity-50 cursor-not-allowed"
                )}>
                  {uploadingReviewer ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
                  {uploadingReviewer ? 'Uploading...' : 'Attach File'}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.pptx"
                    disabled={uploadingReviewer}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingReviewer(true);
                      const { file_url } = await db.integrations.Core.UploadFile({ file });
                      setReviewerFile({ name: file.name, url: file_url });
                      setUploadingReviewer(false);
                      toast.success('Reviewer file attached!');
                      e.target.value = '';
                    }}
                  />
                </label>
                {reviewerFile && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-xs text-primary font-medium max-w-xs">
                    <span className="truncate">{reviewerFile.name}</span>
                    <button onClick={() => setReviewerFile(null)}><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => handleSave('draft')} disabled={saving}>
              Save Draft
            </Button>
            <Button className="flex-1 gap-1.5" onClick={() => handleSave('published')} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Publish to Students
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}