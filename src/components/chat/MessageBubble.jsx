const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock, Zap, GraduationCap } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import FlashcardView from './FlashcardView';
import QuizView, { isQuizContent as checkQuiz } from './QuizView';

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Function';
  const status = toolCall?.status || 'pending';
  const results = toolCall?.results;

  const parsedResults = (() => {
    if (!results) return null;
    try { return typeof results === 'string' ? JSON.parse(results) : results; } catch { return results; }
  })();

  const isError = results && (
    (typeof results === 'string' && /error|failed/i.test(results)) ||
    (parsedResults?.success === false)
  );

  const statusConfig = {
    pending: { icon: Clock, color: 'text-muted-foreground', text: 'Pending' },
    running: { icon: Loader2, color: 'text-primary', text: 'Running...', spin: true },
    in_progress: { icon: Loader2, color: 'text-primary', text: 'Running...', spin: true },
    completed: isError
      ? { icon: AlertCircle, color: 'text-destructive', text: 'Failed' }
      : { icon: CheckCircle2, color: 'text-green-500', text: 'Done' },
    success: { icon: CheckCircle2, color: 'text-green-500', text: 'Done' },
    failed: { icon: AlertCircle, color: 'text-destructive', text: 'Failed' },
    error: { icon: AlertCircle, color: 'text-destructive', text: 'Failed' }
  }[status] || { icon: Zap, color: 'text-muted-foreground', text: '' };

  const Icon = statusConfig.icon;

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
          "hover:bg-muted/50",
          expanded ? "bg-muted/50 border-border" : "bg-card border-border"
        )}
      >
        <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
        <span className="text-foreground/80">{name}</span>
        {statusConfig.text && <span className="text-muted-foreground">• {statusConfig.text}</span>}
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform ml-auto", expanded && "rotate-90")} />
        )}
      </button>
      {expanded && !statusConfig.spin && (
        <div className="mt-1.5 ml-3 pl-3 border-l-2 border-border space-y-2">
          {toolCall.arguments_string && (
            <pre className="bg-muted rounded-md p-2 text-xs text-muted-foreground whitespace-pre-wrap">
              {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}
            </pre>
          )}
          {parsedResults && (
            <pre className="bg-muted rounded-md p-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-48 overflow-auto">
              {typeof parsedResults === 'object' ? JSON.stringify(parsedResults, null, 2) : parsedResults}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

function isFlashcardContent(content) {
  if (!content) return false;
  return (
    /(?:Front|Term)[:\s].+[\n\r]+\s*(?:Back|Definition)[:\s]/i.test(content)
  );
}

function isQuizContent(content) {
  return checkQuiz(content);
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Copied to clipboard');
  };

  const isFlashcard = !isUser && isFlashcardContent(message.content);
  const isQuiz = !isUser && isQuizContent(message.content);

  // Flashcard and Quiz get full-width treatment, outside the bubble
  if (isFlashcard || isQuiz) {
    return (
      <div className="flex gap-3 group justify-start w-full">
        <img
          src="https://media.db.com/images/public/69ef66fe4f340c1dcd4f7578/1f99ebf78_684434411_1447343886627885_3205513454921292553_n.png"
          alt="Falcon"
          className="h-7 w-7 object-contain mt-1 shrink-0"
          loading="lazy"
          width="28"
          height="28"
        />
        <div className="flex-1 min-w-0">
          {isFlashcard ? (
            <FlashcardView content={message.content} />
          ) : (
            <QuizView content={message.content} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <img
          src="https://media.db.com/images/public/69ef66fe4f340c1dcd4f7578/1f99ebf78_684434411_1447343886627885_3205513454921292553_n.png"
          alt="Falcon"
          className="h-7 w-7 object-contain mt-1 shrink-0"
          loading="lazy"
          width="28"
          height="28"
        />
      )}
      <div className={cn("max-w-[88%] sm:max-w-[80%] relative", isUser && "flex flex-col items-end")}>
        {message.content && (
          <div className={cn(
            "rounded-2xl px-4 py-3 relative",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-card border border-border/70 rounded-bl-sm shadow-sm"
          )}>
            {isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            ) : (<ReactMarkdown
                className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  code: ({ inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative group/code my-3">
                        <div className="flex items-center justify-between bg-secondary/80 rounded-t-lg px-4 py-1.5 text-xs text-muted-foreground">
                          <span>{match[1]}</span>
                          <Button size="icon" variant="ghost" className="h-5 w-5"
                            onClick={() => { navigator.clipboard.writeText(String(children).replace(/\n$/, '')); toast.success('Code copied'); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <pre className="bg-secondary rounded-b-lg p-4 overflow-x-auto">
                          <code className={className} {...props}>{children}</code>
                        </pre>
                      </div>
                    ) : (
                      <code className="px-1.5 py-0.5 rounded-md bg-secondary text-accent-foreground text-xs font-mono">{children}</code>
                    );
                  },
                  a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                  p: ({ children }) => <p className="my-1.5 leading-relaxed text-foreground">{children}</p>,
                  ul: ({ children }) => <ul className="my-1.5 ml-4 list-disc text-foreground">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1.5 ml-4 list-decimal text-foreground">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-semibold my-3 text-foreground">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold my-2 text-foreground">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold my-2 text-foreground">{children}</h3>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}

        {!isUser && message.content && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {message.tool_calls?.length > 0 && (
          <div className="space-y-1 mt-1">
            {message.tool_calls.map((toolCall, idx) => (
              <FunctionDisplay key={idx} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}