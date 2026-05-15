'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Zap, Loader2 } from 'lucide-react';
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
    <div className="relative w-full max-w-4xl mx-auto px-4 pb-8">
      <div className="relative terminal-card p-2 bg-card/50 backdrop-blur-md">
        <Textarea
          ref={textareaRef}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AgentX to research, code, or calculate anything..."
          className="min-h-[100px] bg-transparent border-none focus-visible:ring-0 resize-none text-base p-4"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{task.length} / 500</span>
            <span className="hidden sm:inline-block">Press Enter to run, Shift+Enter for new line</span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!task.trim() || isLoading}
            className={cn(
              "gap-2 px-6 bg-primary hover:bg-primary/90 glow-primary transition-all",
              isLoading && "bg-muted text-muted-foreground glow-none"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Run Agent
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}