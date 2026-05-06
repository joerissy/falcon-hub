const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


import { GraduationCap, BookOpen, ChevronRight, Sparkles, Brain, Target, Zap, Users, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { icon: Brain, label: 'Guided Learning', desc: 'Never just answers — always real understanding', color: 'text-violet-600', bg: 'bg-violet-500/10' },
  { icon: Target, label: 'Quiz & Flashcards', desc: 'Test yourself with AI-generated challenges', color: 'text-rose-600', bg: 'bg-rose-500/10' },
  { icon: Zap, label: '5 Learning Modes', desc: 'Chat, Explain, Summarize, Quiz, Flashcard', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  { icon: Users, label: 'Classroom Ready', desc: 'Teachers can track student progress live', color: 'text-primary', bg: 'bg-primary/10' },
];

const stats = [
  { value: '5', label: 'Learning Modes' },
  { value: 'AI', label: 'Powered Tutor' },
  { value: '∞', label: 'Topics Covered' },
];

export default function Landing() {
  const handleLogin = () => db.auth.redirectToLogin(window.location.href);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient background — pure CSS, no JS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/40 bg-card/60 backdrop-blur-md" aria-label="Main navigation">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20" aria-hidden="true">
            <GraduationCap className="h-[18px] w-[18px] text-primary" />
          </div>
          <span className="font-bold text-foreground text-base">FalconHub</span>
          <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">AI Tutor</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/guest"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium px-3 py-2 rounded-lg hover:bg-muted min-h-[44px] flex items-center"
            aria-label="Try FalconHub as a guest"
          >
            Try as Guest
          </Link>
          <button
            onClick={handleLogin}
            aria-label="Sign in to FalconHub"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all min-h-[44px]"
          >
            Sign in →
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center px-4">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto pt-10 sm:pt-14 pb-10 sm:pb-14 animate-[fadeInUp_0.5s_ease_both]">
          {/* Falcon Mascot */}
          <div className="flex justify-center mb-5">
            <img
              src="https://media.db.com/images/public/69ef66fe4f340c1dcd4f7578/1f99ebf78_684434411_1447343886627885_3205513454921292553_n.png"
              alt="FalconHub AI tutor mascot"
              width="120"
              height="120"
              fetchpriority="high"
              decoding="async"
              className="h-28 w-28 sm:h-36 sm:w-36 object-contain drop-shadow-lg"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold mb-6 shadow-sm" aria-label="AI-Powered Student Tutor, Free to Use">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>AI-Powered Student Tutor · Free to Use</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-5">
            The smarter way
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 mt-1">
              to actually learn
            </span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
            Your personal AI tutor that guides you to discover answers yourself — building real understanding, not just memorization.
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 mb-8" aria-label="Platform statistics">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <button
              onClick={handleLogin}
              aria-label="Get started for free with FalconHub"
              className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 min-h-[48px]"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </button>
            <Link
              to="/guest"
              aria-label="Try FalconHub without signing up"
              className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-card border-2 border-border text-foreground font-semibold text-sm hover:border-primary/40 hover:bg-accent active:scale-[0.98] transition-all min-h-[48px]"
            >
              <Play className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Try Without Signing Up
            </Link>
          </div>
        </div>

        {/* Role Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-3xl mb-12 sm:mb-16" aria-labelledby="role-section-heading">
          <h2 id="role-section-heading" className="sr-only">Choose your role</h2>
          {/* Student */}
          <button
            onClick={handleLogin}
            aria-label="Sign in as a student"
            className="group relative bg-card border border-border rounded-2xl p-5 sm:p-6 text-left hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98] transition-all duration-300 overflow-hidden min-h-[160px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            <div className="relative">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors" aria-hidden="true">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1 text-sm sm:text-base">I'm a Student</h3>
              <p className="text-xs text-muted-foreground leading-snug mb-3">Chat with AI, take quizzes, and create flashcards.</p>
              <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                Start Learning <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </div>
          </button>

          {/* Teacher */}
          <button
            onClick={handleLogin}
            aria-label="Sign in as a teacher"
            className="group relative bg-card border border-border rounded-2xl p-5 sm:p-6 text-left hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98] transition-all duration-300 overflow-hidden min-h-[160px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            <div className="relative">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors" aria-hidden="true">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1 text-sm sm:text-base">I'm a Teacher</h3>
              <p className="text-xs text-muted-foreground leading-snug mb-3">Create classrooms and track student progress live.</p>
              <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                Open Dashboard <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </div>
          </button>

          {/* Guest */}
          <Link
            to="/guest"
            aria-label="Try FalconHub as a guest without signing up"
            className="group relative bg-gradient-to-br from-amber-500/10 to-card border border-amber-500/20 rounded-2xl p-5 sm:p-6 text-left hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.98] transition-all duration-300 overflow-hidden min-h-[160px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            <div className="relative">
              <div className="h-11 w-11 rounded-xl bg-amber-500/15 flex items-center justify-center mb-4 group-hover:bg-amber-500/25 transition-colors" aria-hidden="true">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-foreground mb-1 text-sm sm:text-base">Just Exploring</h3>
              <p className="text-xs text-muted-foreground leading-snug mb-3">Try the AI tutor right now — no sign-up required.</p>
              <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                Try as Guest <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </div>
          </Link>
        </section>

        {/* Features */}
        <section className="w-full max-w-3xl mb-12 sm:mb-16" aria-labelledby="features-heading">
          <p id="features-heading" className="text-xs text-muted-foreground text-center mb-5 uppercase tracking-widest font-semibold">Everything you need to learn better</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {features.map(({ icon: Icon, label, desc, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-4 sm:p-5 text-center hover:border-primary/30 hover:shadow-md transition-all">
                <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-3`} aria-hidden="true">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="text-xs font-bold text-foreground mb-1">{label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-5 border-t border-border/40 bg-card/20 backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="text-primary font-semibold">FalconHub</span> · AI Student Tutor Platform
        </p>
      </footer>
    </div>
  );
}