'use client';

import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Clock } from 'lucide-react';
import { sessionStore, type Session } from '@/lib/session-store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function Sidebar({ 
  activeSessionId, 
  onSelectSession, 
  onNewTask 
}: { 
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewTask: () => void;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSessions(sessionStore.getSessions());
  }, [activeSessionId]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sessionStore.deleteSession(id);
    setSessions(sessionStore.getSessions());
    if (activeSessionId === id) onNewTask();
  };

  if (!mounted) return (
    <div className="flex h-screen w-full flex-col bg-sidebar border-r border-sidebar-border" />
  );

  return (
    <div className="flex h-screen w-full flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <Logo className="mb-8" />
        <Button 
          onClick={onNewTask}
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 glow-primary font-medium"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="px-6 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Recent Sessions
          </span>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="px-3 space-y-1">
            {sessions.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm text-muted-foreground italic">No history yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-sidebar-accent",
                    activeSessionId === session.id ? "bg-sidebar-accent" : "transparent"
                  )}
                >
                  <div className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    session.status === 'complete' ? "bg-green-500" : 
                    session.status === 'error' ? "bg-red-500" : "bg-amber-500 pulse-slow"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-sidebar-foreground">
                      {session.task}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(session.createdAt)} ago
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 mt-auto border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
            AX
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">Operator</p>
            <p className="text-xs text-muted-foreground truncate">System Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}