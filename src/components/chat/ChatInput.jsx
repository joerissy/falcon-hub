const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2, Paperclip, X, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ChatInput({ onSend, isLoading }) {
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState(null); // { name, url }
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setAttachedFile({ name: file.name, url: file_url });
    setUploading(false);
    e.target.value = '';
  };

  const handleSend = () => {
    if ((!message.trim() && !attachedFile) || isLoading) return;
    let content = message.trim();
    if (attachedFile) {
      content = content
        ? `${content}\n\n[File: ${attachedFile.name}](${attachedFile.url})`
        : `Please help me with this file: [${attachedFile.name}](${attachedFile.url})`;
    }
    onSend(content, attachedFile ? [attachedFile.url] : undefined);
    setMessage('');
    setAttachedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (message.trim() || attachedFile) && !isLoading && !uploading;

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-3 pb-2 border-t border-border/40 bg-background/80 backdrop-blur-sm">
      {/* Attached file preview */}
      {attachedFile && (
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium max-w-xs">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="ml-1 hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div className={cn(
        "relative flex items-end gap-3 rounded-2xl border-2 border-border bg-card p-3",
        "shadow-md transition-all focus-within:shadow-lg focus-within:border-primary/60"
      )}>
        {/* File upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || isLoading}
          aria-label="Attach a file"
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all border border-border",
            "text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.txt,.docx,.csv,.xlsx"
          onChange={handleFileChange}
        />

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachedFile ? "Add a message about the file..." : "Ask FalconHub anything..."}
          rows={1}
          aria-label="Message input"
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground/70 focus:outline-none max-h-[140px] min-h-[40px]"
        />
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          aria-label="Send message"
          className={cn(
            "h-10 w-10 rounded-xl shrink-0 transition-all",
            canSend
              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-label="Sending..." />
          ) : (
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground/50 mt-2 hidden sm:block">Press Enter to send · Shift+Enter for new line</p>
    </div>
  );
}