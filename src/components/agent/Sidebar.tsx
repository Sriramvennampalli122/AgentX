'use client';

import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Clock, Command, Terminal, Activity } from 'lucide-react';
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
    <div className="flex h-screen w-full flex-col bg-sidebar border-r border-white/5 relative z-30">
      <div className="p-8">
        <Logo className="mb-10" />
        <Button 
          onClick={onNewTask}
          className="w-full justify-start gap-3 bg-primary hover:bg-primary/90 glow-primary font-bold text-xs uppercase tracking-widest py-6 rounded-xl border border-white/10"
        >
          <Plus className="h-4 w-4" />
          New Protocol
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-8 mb-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
            Log History
          </span>
          <Terminal className="h-3 w-3 text-muted-foreground/20" />
        </div>
        <ScrollArea className="flex-1">
          <div className="px-4 space-y-2">
            {sessions.length === 0 ? (
              <div className="px-4 py-12 text-center space-y-3 opacity-30">
                <Command className="h-8 w-8 mx-auto stroke-[1]" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Archive empty</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-4 rounded-xl px-4 py-4 transition-all border border-transparent",
                    activeSessionId === session.id 
                      ? "bg-white/[0.05] border-white/5 shadow-xl" 
                      : "hover:bg-white/[0.02] hover:border-white/5"
                  )}
                >
                  <div className={cn(
                    "h-2 w-2 rounded-full shrink-0 shadow-sm",
                    session.status === 'complete' ? "bg-green-500" : 
                    session.status === 'error' ? "bg-red-500" : "bg-amber-500 pulse-slow"
                  )} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={cn(
                      "text-sm font-bold truncate tracking-tight transition-colors",
                      activeSessionId === session.id ? "text-white" : "text-sidebar-foreground"
                    )}>
                      {session.task}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 font-medium">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(session.createdAt)} ago
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-6 mt-auto border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-4 px-2">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-white/10 to-white/5 flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
              OP
            </div>
            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#0a0a0b] flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white tracking-wide uppercase">Operator 01</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Activity className="h-3 w-3 text-primary animate-pulse" />
              <p className="text-[10px] text-muted-foreground/60 font-medium tracking-wider uppercase">System Stable</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}