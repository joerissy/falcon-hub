import { useState } from 'react';
import { MessageSquare, ChevronRight, Search, User, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function StudentTable({ students, activities, onViewHistory, classroomName }) {
  const [search, setSearch] = useState('');

  const getSortedStats = () =>
    [...students]
      .sort((a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || ''))
      .map(s => {
        const acts = activities.filter(a => a.student_email === s.email);
        const quizzes = acts.filter(a => a.quiz_score != null);
        const avgQuiz = quizzes.length > 0
          ? Math.round(quizzes.reduce((sum, a) => sum + a.quiz_score, 0) / quizzes.length)
          : null;
        return { name: s.full_name || 'No name', email: s.email, avgQuiz };
      });

  const exportToExcel = () => {
    const rows = getSortedStats();
    const header = ['Name', 'Email', 'Quiz Average (%)'];
    const csvRows = [header, ...rows.map(r => [r.name, r.email, r.avgQuiz != null ? r.avgQuiz : '—'])];
    const csv = csvRows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classroomName || 'class'}_grades.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const rows = getSortedStats();
    const win = window.open('', '_blank');
    const html = `
      <html><head><title>${classroomName || 'Class'} Grades</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { color: #666; font-size: 13px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f0faf0; text-align: left; padding: 10px 12px; font-size: 13px; border-bottom: 2px solid #d1e8d1; }
        td { padding: 9px 12px; font-size: 13px; border-bottom: 1px solid #e8f0e8; }
        tr:nth-child(even) td { background: #f9fdf9; }
        .avg { font-weight: bold; color: #2a7a2a; }
        .no-score { color: #999; }
      </style></head>
      <body>
        <h1>${classroomName || 'Class'} — Student Grade Report</h1>
        <p>Sorted alphabetically · Generated ${new Date().toLocaleDateString()}</p>
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Quiz Average</th></tr></thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${r.name}</td>
                <td>${r.email}</td>
                <td class="${r.avgQuiz != null ? 'avg' : 'no-score'}">${r.avgQuiz != null ? r.avgQuiz + '%' : '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </body></html>`;
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const filtered = students.filter(s =>
    (s.full_name || s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStudentStats = (email) => {
    const acts = activities.filter(a => a.student_email === email);
    const messages = acts.reduce((sum, a) => sum + (a.messages_sent || 0), 0);
    const minutes = acts.reduce((sum, a) => sum + (a.study_minutes || 0), 0);
    const quizzes = acts.filter(a => a.quiz_score != null);
    const avgQuiz = quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, a) => sum + a.quiz_score, 0) / quizzes.length)
      : null;
    return { messages, minutes, avgQuiz, sessions: acts.length };
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
        <h3 className="font-semibold text-foreground flex-1">Students</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={exportToExcel}>
            <Download className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={exportToPDF}>
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students..."
            className="pl-8 h-8 text-xs bg-muted/50 border-border"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No students yet. Share the invite code!</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((student) => {
            const stats = getStudentStats(student.email);
            return (
              <div key={student.id || student.email} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {(student.full_name || student.email || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{student.full_name || 'No name'}</p>
                  <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-center">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{stats.messages}</p>
                    <p className="text-xs text-muted-foreground">Messages</p>
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", stats.avgQuiz != null ? 'text-foreground' : 'text-muted-foreground')}>
                      {stats.avgQuiz != null ? `${stats.avgQuiz}%` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Quiz avg</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs text-primary hover:text-primary/80 shrink-0"
                  onClick={() => onViewHistory(student)}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">History</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}