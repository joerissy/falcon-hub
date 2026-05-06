const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';

import { GraduationCap, KeyRound, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function JoinClass() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
    // Pre-fill from URL param ?code=XXX
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) setCode(urlCode.toUpperCase());
  }, []);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const classrooms = await db.entities.Classroom.filter({ invite_code: code.trim().toUpperCase() });
    if (classrooms.length === 0) {
      toast.error('Invalid invite code. Please check and try again.');
      setLoading(false);
      return;
    }
    const classroom = classrooms[0];
    const emails = classroom.student_emails || [];
    if (!emails.includes(user?.email)) {
      await db.entities.Classroom.update(classroom.id, {
        student_emails: [...emails, user.email]
      });
    }
    // Update user role to student
    await db.auth.updateMe({ role: 'user', classroom_id: classroom.id });
    setJoined(true);
    setLoading(false);
    setTimeout(() => { window.location.href = '/'; }, 1500);
  };

  if (joined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">You're in!</h2>
          <p className="text-muted-foreground text-sm">Redirecting to your learning dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Join Your Class</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Enter the invite code your teacher shared with you
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="e.g. GRN-4821"
                className="pl-10 text-center text-lg font-mono tracking-widest uppercase bg-muted/50 border-border focus:border-primary"
                maxLength={10}
              />
            </div>

            <Button
              onClick={handleJoin}
              disabled={!code.trim() || loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Joining...</>
              ) : (
                <><ArrowRight className="h-4 w-4 mr-2" /> Join Class</>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don't have a code? Ask your teacher for the class invite code.
          </p>
        </div>

        {/* Decoration */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Powered by <span className="text-primary font-medium">Oppa Joeris</span> AI Tutor
        </p>
      </div>
    </div>
  );
}