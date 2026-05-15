'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/agent/Sidebar';
import { TaskInput } from '@/components/agent/TaskInput';
import { ExecutionPanel } from '@/components/agent/ExecutionPanel';
import { Logo } from '@/components/agent/Logo';
import { Button } from '@/components/ui/button';
import { sessionStore, type Session, type Message } from '@/lib/session-store';
import { executeAgentTask } from './actions/agent';
import { useToast } from '@/hooks/use-toast';
import { Search, Code, Calculator, FileText, Sparkles, Terminal, Activity, Zap, ShieldCheck, Cpu } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

export default function AgentXDashboard() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<{ tools: number; iterations: number; elapsed: string }>();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      const msgs = sessionStore.getMessages(activeSessionId);
      setMessages(msgs);
      const session = sessionStore.getSessions().find(s => s.id === activeSessionId);
      if (session && session.status === 'complete') {
        setStats({
          tools: session.toolCallCount,
          iterations: session.iterationCount,
          elapsed: (session.elapsedMs! / 1000).toFixed(1)
        });
      }
    } else {
      setMessages([]);
      setStats(undefined);
    }
  }, [activeSessionId]);

  const runTask = async (task: string) => {
    setIsLoading(true);
    const sessionId = Math.random().toString(36).substring(7);
    
    const newSession: Session = {
      id: sessionId,
      task,
      status: 'running',
      createdAt: Date.now(),
      toolCallCount: 0,
      iterationCount: 0
    };
    
    sessionStore.saveSession(newSession);
    setActiveSessionId(sessionId);
    
    const startTime = Date.now();

    try {
      const initialMsgs: Message[] = [
        { id: 't1', role: 'system', content: `Executing task: ${task}`, type: 'thinking', timestamp: Date.now() },
        { id: 't2', role: 'system', content: 'Allocating reasoning resources...', type: 'thinking', timestamp: Date.now() + 500 }
      ];
      initialMsgs.forEach(m => sessionStore.saveMessage(sessionId, m));
      setMessages(initialMsgs);

      const result = await executeAgentTask(task);
      
      const elapsedMs = Date.now() - startTime;
      const finalMsg: Message = {
        id: 'f1',
        role: 'model',
        content: result.finalAnswer,
        type: 'final',
        timestamp: Date.now()
      };
      
      sessionStore.saveMessage(sessionId, finalMsg);
      setMessages(prev => [...prev, finalMsg]);
      
      const updatedSession: Session = {
        ...newSession,
        status: 'complete',
        toolCallCount: result.toolCallCount,
        iterationCount: result.iterationCount,
        finalAnswer: result.finalAnswer,
        elapsedMs
      };
      
      sessionStore.saveSession(updatedSession);
      setStats({
        tools: result.toolCallCount,
        iterations: result.iterationCount,
        elapsed: (elapsedMs / 1000).toFixed(1)
      });
      
      toast({ title: "Task Success", description: "Reasoning loop completed successfully." });
    } catch (error: any) {
      const errorMsg: Message = {
        id: 'e1',
        role: 'system',
        content: error.message || 'The reasoning loop encountered an unexpected error.',
        type: 'error',
        timestamp: Date.now()
      };
      sessionStore.saveMessage(sessionId, errorMsg);
      setMessages(prev => [...prev, errorMsg]);
      
      sessionStore.saveSession({ ...newSession, status: 'error' });
      toast({ variant: "destructive", title: "Internal Failure", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const PresetCard = ({ icon: Icon, title, desc, prompt }: any) => (
    <div 
      onClick={() => runTask(prompt)}
      className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="h-12 w-12" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 ring-1 ring-primary/20">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-headline font-bold text-white text-sm tracking-widest uppercase">{title}</h4>
          <p className="text-[11px] text-white/40 mt-1 font-body leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#050506]">
      <div className="w-[280px] hidden lg:block">
        <Sidebar 
          activeSessionId={activeSessionId} 
          onSelectSession={setActiveSessionId}
          onNewTask={() => setActiveSessionId(null)}
        />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Professional Header */}
        <header className="flex h-16 items-center justify-between px-8 border-b border-white/5 bg-black/40 backdrop-blur-xl z-20">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-green-500/80" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Security: Level 5</span>
            </div>
            <div className="flex items-center gap-3">
              <Cpu className="h-4 w-4 text-primary/80" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Neural Engine: v2.5.1</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors"
              onClick={() => setActiveSessionId(null)}
            >
              Reset Workbench
            </Button>
            <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/60">
              AX
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {(!activeSessionId && messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center p-8 max-w-5xl mx-auto">
              <div className="text-center mb-16 space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Autonomous Terminal Active</span>
                </div>
                <h1 className="font-headline text-5xl font-bold tracking-tight text-white max-w-2xl mx-auto">
                  Precision <span className="text-primary italic font-light">Reasoning</span> for Complex Workflows
                </h1>
                <p className="text-sm text-white/40 max-w-xl mx-auto font-body leading-relaxed">
                  Leverage a multi-tool autonomous agent capable of web intelligence, sandboxed code execution, and high-precision calculations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <PresetCard 
                  icon={Search} 
                  title="Market Intel" 
                  desc="Analyze current trends and synthesize global impact reports." 
                  prompt="Search for today's top AI news and summarize the 3 biggest stories" 
                />
                <PresetCard 
                  icon={Code} 
                  title="Logic Sandbox" 
                  desc="Execute complex algorithms in secure environments." 
                  prompt="Write JavaScript to find all prime numbers up to 200 and count them" 
                />
                <PresetCard 
                  icon={Calculator} 
                  title="Compute Engine" 
                  desc="High-precision mathematical formula projections." 
                  prompt="Calculate: If I invest $10,000 at 9% annual return for 15 years, what's the final amount? Show the formula." 
                />
                <PresetCard 
                  icon={FileText} 
                  title="Tech Audit" 
                  desc="Compare architectures and audit stack efficiencies." 
                  prompt="Search for LangChain vs LlamaIndex comparison and tell me which is better for RAG pipelines" 
                />
              </div>
            </div>
          ) : (
            <ExecutionPanel messages={messages} stats={stats} />
          )}
        </div>

        <div className="pb-8 pt-4">
          <TaskInput onRun={runTask} isLoading={isLoading} />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
