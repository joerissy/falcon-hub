const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';

import { Users, MessageSquare, Target, GraduationCap, Plus, X, HelpCircle, Pencil, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import StatsCard from '../components/admin/StatsCard';
import InviteCodeCard from '../components/admin/InviteCodeCard';
import StudentTable from '../components/admin/StudentTable';
import StudentHistoryModal from '../components/admin/StudentHistoryModal';
import TeacherProfileMenu from '../components/admin/TeacherProfileMenu';
import AnnouncementsPanel from '../components/admin/AnnouncementsPanel';
import QuizBuilder from '../components/admin/QuizBuilder';
import QuizResultsModal from '../components/admin/QuizResultsModal';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GRN-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [activeClassroomId, setActiveClassroomId] = useState(null);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showNewClassForm, setShowNewClassForm] = useState(false);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingData(true);
      const clsArray = await db.entities.Classroom.filter({ teacher_email: user.email });
      setClassrooms(clsArray);
      if (clsArray.length > 0 && !activeClassroomId) {
        setActiveClassroomId(clsArray[0].id);
      }
      setLoadingData(false);
    };
    load();
  }, [user]);

  const activeClassroom = classrooms.find(c => c.id === activeClassroomId) || null;

  useEffect(() => {
    if (!activeClassroom) { setStudents([]); setActivities([]); return; }
    const load = async () => {
      const emails = activeClassroom.student_emails || [];
      if (emails.length > 0) {
        const allUsers = await db.entities.User.list();
        setStudents(allUsers.filter(u => emails.includes(u.email)));
      } else {
        setStudents([]);
      }
      const acts = await db.entities.StudentActivity.filter({ classroom_id: activeClassroom.id }, '-created_date', 500);
      setActivities(acts);
    };
    load();
  }, [activeClassroomId, classrooms]);

  const createClassroom = async () => {
    if (!newClassName.trim()) return;
    setCreating(true);
    const code = generateCode();
    const cls = await db.entities.Classroom.create({
      name: newClassName.trim(),
      teacher_email: user.email,
      invite_code: code,
      student_emails: [],
    });
    setClassrooms(prev => [...prev, cls]);
    setActiveClassroomId(cls.id);
    setNewClassName('');
    setShowNewClassForm(false);
    setCreating(false);
    toast.success(`Class "${cls.name}" created!`);
  };

  const refreshClassrooms = async () => {
    const clsArray = await db.entities.Classroom.filter({ teacher_email: user.email });
    setClassrooms(clsArray);
  };

  const handleRename = async (cls) => {
    if (!renameValue.trim() || renameValue.trim() === cls.name) { setRenamingId(null); return; }
    await db.entities.Classroom.update(cls.id, { name: renameValue.trim() });
    toast.success('Class renamed!');
    setRenamingId(null);
    refreshClassrooms();
  };

  const handleDelete = async (cls) => {
    if (deletingId !== cls.id) { setDeletingId(cls.id); return; }
    await db.entities.Classroom.delete(cls.id);
    toast.success(`"${cls.name}" deleted.`);
    setDeletingId(null);
    const remaining = classrooms.filter(c => c.id !== cls.id);
    setClassrooms(remaining);
    setActiveClassroomId(remaining[0]?.id || null);
  };

  const totalMessages = activities.reduce((s, a) => s + (a.messages_sent || 0), 0);
  const totalMinutes = activities.reduce((s, a) => s + (a.study_minutes || 0), 0);
  const quizActs = activities.filter(a => a.quiz_score != null);
  const avgQuiz = quizActs.length > 0
    ? Math.round(quizActs.reduce((s, a) => s + a.quiz_score, 0) / quizActs.length)
    : null;

  if (loadingData && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-sm text-foreground">FalconHub</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium ml-1">Teacher</span>
          </div>
          <TeacherProfileMenu user={user} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* No classrooms yet */}
        {classrooms.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Create Your First Class</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Set up a classroom to invite students and track their progress.
            </p>
            <div className="flex gap-2">
              <Input
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createClassroom()}
                placeholder="e.g. Grade 10 Science"
                className="bg-muted/50"
              />
              <Button onClick={createClassroom} disabled={creating || !newClassName.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Create
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Classroom tabs + create button */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {classrooms.map(cls => {
                  const isActive = activeClassroomId === cls.id;
                  const isRenaming = renamingId === cls.id;
                  const isConfirmingDelete = deletingId === cls.id;
                  return (
                    <div key={cls.id} className={`flex items-center gap-1 rounded-xl border text-sm font-medium transition-all ${
                      isActive ? 'bg-primary/10 border-primary/40' : 'bg-card border-border'
                    }`}>
                      {isRenaming ? (
                        <div className="flex items-center gap-1 px-2 py-1">
                          <Input
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRename(cls); if (e.key === 'Escape') setRenamingId(null); }}
                            className="h-7 text-sm w-32"
                            autoFocus
                          />
                          <button onClick={() => handleRename(cls)} className="text-primary hover:text-primary/80 p-1"><Check className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setRenamingId(null)} className="text-muted-foreground hover:text-foreground p-1"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setActiveClassroomId(cls.id)}
                            className={`px-3 py-2 rounded-l-xl transition-colors ${isActive ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                          >
                            {cls.name}
                          </button>
                          <button
                            onClick={() => { setRenamingId(cls.id); setRenameValue(cls.name); setDeletingId(null); }}
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                            title="Rename"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(cls)}
                            className={`p-1.5 transition-colors rounded-r-xl pr-2 ${isConfirmingDelete ? 'text-destructive font-semibold' : 'text-muted-foreground hover:text-destructive'}`}
                            title={isConfirmingDelete ? 'Click again to confirm delete' : 'Delete class'}
                          >
                            {isConfirmingDelete ? <span className="text-xs">Confirm?</span> : <Trash2 className="h-3 w-3" />}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {showNewClassForm ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') createClassroom(); if (e.key === 'Escape') setShowNewClassForm(false); }}
                    placeholder="Class name..."
                    className="h-9 text-sm w-44"
                    autoFocus
                  />
                  <Button size="sm" onClick={createClassroom} disabled={creating || !newClassName.trim()}>
                    Create
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => { setShowNewClassForm(false); setNewClassName(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowNewClassForm(true)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> New Class
                </Button>
              )}
            </div>

            {activeClassroom && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{activeClassroom.name}</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Teacher Dashboard</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => setShowQuizResults(true)} variant="outline" className="gap-2 text-sm">
                      <Target className="h-4 w-4 text-rose-600" /> <span className="hidden sm:inline">Quiz </span>Results
                    </Button>
                    <Button onClick={() => setShowQuizBuilder(true)} variant="outline" className="gap-2 text-sm">
                      <HelpCircle className="h-4 w-4 text-rose-600" /> <span className="hidden sm:inline">Create </span>Quiz
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatsCard title="Total Students" value={students.length} subtitle="Enrolled" icon={Users} color="primary" />
                  <StatsCard title="Total Messages" value={totalMessages} subtitle="Across all students" icon={MessageSquare} color="emerald" />
                  <StatsCard title="Quiz Accuracy" value={avgQuiz != null ? `${avgQuiz}%` : '—'} subtitle="Average score" icon={Target} color="rose" />
                </div>

                {/* Invite + Announcements + Students */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <InviteCodeCard classroom={activeClassroom} onRefresh={refreshClassrooms} />
                    <AnnouncementsPanel classroom={activeClassroom} user={user} />
                  </div>
                  <div className="lg:col-span-2">
                    <StudentTable
                      students={students}
                      activities={activities}
                      onViewHistory={setSelectedStudent}
                      classroomName={activeClassroom?.name}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {selectedStudent && (
        <StudentHistoryModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
      {showQuizResults && activeClassroom && (
        <QuizResultsModal
          classroom={activeClassroom}
          students={students}
          onClose={() => setShowQuizResults(false)}
        />
      )}
      {showQuizBuilder && activeClassroom && (
        <QuizBuilder
          classroom={activeClassroom}
          user={user}
          onClose={() => setShowQuizBuilder(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
}