'use client';

import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Clock, Command, Terminal, Activity, Eraser } from 'lucide-react';
import { sessionStore, type Session } from '@/lib/session-store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const handleClearAll = () => {
    sessionStore.clearAll();
    setSessions([]);
    onNewTask();
  };

  if (!mounted) return (
    <div className="flex h-screen w-full flex-col bg-[#070708] border-r border-white/5" />
  );

  return (
    <div className="flex h-screen w-full flex-col bg-[#070708] border-r border-white/5 relative z-30">
      <div className="p-6">
        <Logo className="mb-8" />
        <Button 
          onClick={onNewTask}
          className="w-full justify-start gap-3 bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(99,102,241,0.2)] font-bold text-[11px] uppercase tracking-[0.2em] py-6 rounded-xl border border-white/10"
        >
          <Plus className="h-4 w-4" />
          Start Session
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 mb-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
            Internal Logs
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-white/20 hover:text-red-400 transition-colors" title="Clear all history">
                <Eraser className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-headline font-bold">Wipe Terminal History?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60 font-body">
                  This will permanently delete all stored reasoning logs and session data from your local storage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-red-500 hover:bg-red-600 text-white">Confirm Wipe</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="px-4 space-y-2">
            {sessions.length === 0 ? (
              <div className="px-4 py-16 text-center space-y-3">
                <div className="h-10 w-10 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto border border-white/5">
                  <Command className="h-5 w-5 text-white/10" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">Standby Mode</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-4 rounded-xl px-4 py-4 transition-all border border-transparent",
                    activeSessionId === session.id 
                      ? "bg-white/[0.04] border-white/5" 
                      : "hover:bg-white/[0.02] hover:border-white/[0.04]"
                  )}
                >
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    session.status === 'complete' ? "bg-green-500/80" : 
                    session.status === 'error' ? "bg-red-500/80" : "bg-amber-500/80 animate-pulse"
                  )} />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className={cn(
                      "text-xs font-medium truncate transition-colors",
                      activeSessionId === session.id ? "text-white" : "text-white/50"
                    )}>
                      {session.task}
                    </p>
                    <div className="flex items-center gap-2 text-[9px] text-white/20 font-bold uppercase tracking-widest">
                      {formatDistanceToNow(session.createdAt)} ago
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-6 mt-auto border-t border-white/5 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">
            ID
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-white tracking-widest uppercase">Verified Operator</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-1 w-1 rounded-full bg-green-500" />
              <p className="text-[9px] text-white/30 font-bold tracking-widest uppercase">Encryption Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
