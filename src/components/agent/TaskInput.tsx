'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Zap, Loader2, Command, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TaskInput({ 
  onRun, 
  isLoading,
  placeholder = "Initiate reasoning protocol..."
}: { 
  onRun: (task: string) => void; 
  isLoading: boolean;
  placeholder?: string;
}) {
  const [task, setTask] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (task.trim() && !isLoading) {
      onRun(task);
      setTask('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto px-8">
      <div className="relative terminal-card p-1 bg-black/60 backdrop-blur-3xl ring-1 ring-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-4">
          <div className="flex items-center gap-3 text-white/20">
            <Command className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Command Input</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
            <Cpu className="h-3 w-3 text-primary/40" />
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Ready</span>
          </div>
        </div>
        <Textarea
          ref={textareaRef}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[100px] bg-transparent border-none focus-visible:ring-0 resize-none text-lg p-6 placeholder:text-white/10 font-body text-white/80 leading-relaxed"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between px-6 pb-6 border-t border-white/5 pt-5 mt-2">
          <div className="flex items-center gap-8 text-[10px] font-bold text-white/10 uppercase tracking-[0.2em]">
            <span className={cn(task.length > 450 ? "text-amber-500" : "")}>{task.length} / 500 CHARS</span>
            <span className="hidden sm:inline-block opacity-40 italic">⌘ + ENTER TO EXECUTE</span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!task.trim() || isLoading}
            className={cn(
              "gap-3 px-10 py-7 bg-primary hover:bg-primary/90 text-sm font-bold tracking-[0.3em] uppercase rounded-2xl border border-white/10 transition-all active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.1)]",
              isLoading && "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Run Protocol
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
