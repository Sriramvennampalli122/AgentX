'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Zap, Loader2, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TaskInput({ 
  onRun, 
  isLoading 
}: { 
  onRun: (task: string) => void; 
  isLoading: boolean;
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
    <div className="relative w-full max-w-5xl mx-auto px-6 pb-10">
      <div className="relative terminal-card p-1 bg-card/40 backdrop-blur-2xl command-glow ring-1 ring-white/10">
        <div className="flex items-center gap-3 px-5 pt-3 text-muted-foreground/40">
          <Command className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Agent Input Terminal</span>
        </div>
        <Textarea
          ref={textareaRef}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Initiate reasoning protocol (e.g., 'Analyze AI market trends')..."
          className="min-h-[120px] bg-transparent border-none focus-visible:ring-0 resize-none text-lg p-5 placeholder:text-muted-foreground/30 font-body text-white/90"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between px-5 pb-4 border-t border-white/5 pt-4 mt-2">
          <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
            <span className={cn(task.length > 450 ? "text-amber-500" : "")}>{task.length} / 500 characters</span>
            <span className="hidden sm:inline-block opacity-60">⌘ + Enter to execute</span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!task.trim() || isLoading}
            className={cn(
              "gap-2 px-8 py-6 bg-primary hover:bg-primary/90 glow-primary transition-all text-sm font-bold tracking-widest uppercase rounded-xl border border-white/10",
              isLoading && "bg-muted text-muted-foreground glow-none cursor-not-allowed"
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