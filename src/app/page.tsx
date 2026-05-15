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
import { Search, Code, Calculator, FileText, Sparkles, Terminal, Activity, Zap } from 'lucide-react';
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

  // Load session messages when active session changes
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
        { id: 't1', role: 'system', content: `Task received: ${task}`, type: 'thinking', timestamp: Date.now() },
        { id: 't2', role: 'system', content: 'Initializing multi-step execution protocol...', type: 'thinking', timestamp: Date.now() + 500 }
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
      
      toast({ title: "Task Synthesis Complete", description: "Protocol results delivered to terminal." });
    } catch (error: any) {
      const errorMsg: Message = {
        id: 'e1',
        role: 'system',
        content: error.message || 'The agent failed to complete the task.',
        type: 'error',
        timestamp: Date.now()
      };
      sessionStore.saveMessage(sessionId, errorMsg);
      setMessages(prev => [...prev, errorMsg]);
      
      sessionStore.saveSession({ ...newSession, status: 'error' });
      toast({ variant: "destructive", title: "Execution Failure", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const ExampleCard = ({ icon: Icon, title, desc, prompt }: any) => (
    <div 
      onClick={() => runTask(prompt)}
      className="terminal-card group p-8 cursor-pointer hover:border-primary/50 hover:bg-white/[0.04] transition-all border-white/5"
    >
      <div className="flex items-center gap-5 mb-5">
        <div className="p-3 rounded-xl bg-white/5 text-primary group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300 ring-1 ring-white/10 group-hover:ring-primary/30">
          <Icon className="h-6 w-6" />
        </div>
        <h4 className="font-headline font-bold text-lg tracking-wide text-white group-hover:text-primary transition-colors uppercase">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground/80 leading-relaxed font-body italic">"{desc}"</p>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      <div className="w-[300px] hidden md:block">
        <Sidebar 
          activeSessionId={activeSessionId} 
          onSelectSession={setActiveSessionId}
          onNewTask={() => setActiveSessionId(null)}
        />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="flex h-16 items-center justify-between px-8 border-b border-white/5 bg-card/10 backdrop-blur-md relative z-20">
          <div className="md:hidden">
            <Logo />
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">System Online</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">v2.5 Reasoning</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-[10px] font-bold tracking-widest uppercase hover:bg-white/5" onClick={() => setActiveSessionId(null)}>
              Reset Terminal
            </Button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent glow-primary flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
              AX
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {(!activeSessionId && messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center max-w-6xl mx-auto">
              <div className="mb-16 space-y-6 animate-in fade-in zoom-in duration-700">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                  <Terminal className="h-20 w-20 text-primary mx-auto mb-6 relative z-10 drop-shadow-2xl" />
                  <div className="absolute -top-3 -right-3 bg-accent rounded-full p-2 glow-accent animate-bounce">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h1 className="font-headline text-6xl font-black tracking-tight text-white mb-2 text-gradient">
                    PROTOCOL INITIATED
                  </h1>
                  <p className="text-xl text-muted-foreground/60 max-w-2xl mx-auto font-body tracking-wide">
                    Autonomous reasoning terminal active. Assign a task or select an operational preset to begin multi-agent orchestration.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full animate-in slide-in-from-bottom-8 duration-1000">
                <ExampleCard 
                  icon={Search} 
                  title="Market Intel" 
                  desc="Analyze today's top 3 AI news stories and synthesize their global impact." 
                  prompt="Search for today's top AI news and summarize the 3 biggest stories" 
                />
                <ExampleCard 
                  icon={Code} 
                  title="Binary Sieve" 
                  desc="Engineers primes up to 200 using optimized algorithms and counts them." 
                  prompt="Write JavaScript to find all prime numbers up to 200 and count them" 
                />
                <ExampleCard 
                  icon={Calculator} 
                  title="Fiscal Projection" 
                  desc="Projects $10k portfolio growth at 9% for 15 years with detailed formulaic logic." 
                  prompt="Calculate: If I invest $10,000 at 9% annual return for 15 years, what's the final amount? Show the formula." 
                />
                <ExampleCard 
                  icon={FileText} 
                  title="Stack Audit" 
                  desc="Audits LangChain vs LlamaIndex for production RAG pipeline efficiency." 
                  prompt="Search for LangChain vs LlamaIndex comparison and tell me which is better for RAG pipelines" 
                />
              </div>
            </div>
          ) : (
            <ExecutionPanel messages={messages} stats={stats} />
          )}
        </div>

        <TaskInput onRun={runTask} isLoading={isLoading} />
      </main>
      <Toaster />
    </div>
  );
}
