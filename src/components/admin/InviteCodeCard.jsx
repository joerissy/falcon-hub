const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { Copy, Check, RefreshCw, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GRN-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function InviteCodeCard({ classroom, onRefresh }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const inviteLink = `${window.location.origin}/join?code=${classroom?.invite_code}`;

  const copyCode = () => {
    navigator.clipboard.writeText(classroom?.invite_code || '');
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied!');
  };

  const regenerate = async () => {
    if (!classroom) return;
    setRegenerating(true);
    const newCode = generateCode();
    await db.entities.Classroom.update(classroom.id, { invite_code: newCode });
    onRefresh();
    setRegenerating(false);
    toast.success('New invite code generated!');
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-semibold text-foreground mb-1">Class Invite Code</h3>
      <p className="text-xs text-muted-foreground mb-4">Share this code with students to join your class</p>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-muted rounded-xl px-5 py-3 text-center">
          <span className="text-2xl font-mono font-bold tracking-widest text-primary">
            {classroom?.invite_code || '—'}
          </span>
        </div>
        <Button size="icon" variant="outline" onClick={copyCode} className="h-12 w-12 rounded-xl">
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={copyLink}>
          <Link className="h-3.5 w-3.5" /> Copy Invite Link
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={regenerate} disabled={regenerating}>
          <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} /> Regenerate
        </Button>
      </div>
    </div>
  );
}