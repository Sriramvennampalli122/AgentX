'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/agent/Sidebar';
import { TaskInput } from '@/components/agent/TaskInput';
import { ExecutionPanel } from '@/components/agent/ExecutionPanel';
import { Logo } from '@/components/agent/Logo';
import { sessionStore, type Session, type Message } from '@/lib/session-store';
import { executeAgentTask } from './actions/agent';
import { useToast } from '@/hooks/use-toast';
import { Search, Code, Calculator, FileText, Sparkles, Terminal } from 'lucide-react';
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
        { id: 't2', role: 'system', content: 'Analyzing multi-step execution path...', type: 'thinking', timestamp: Date.now() + 500 }
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
      
      toast({ title: "Agent Task Complete", description: "Synthesis successfully delivered." });
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
      toast({ variant: "destructive", title: "Execution Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const ExampleCard = ({ icon: Icon, title, desc, prompt }: any) => (
    <div 
      onClick={() => runTask(prompt)}
      className="terminal-card group p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="p-2 rounded-lg bg-white/5 text-primary group-hover:scale-110 transition-transform">
          <Icon className="h-5 w-5" />
        </div>
        <h4 className="font-headline font-bold text-base tracking-wide text-white">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="w-[280px] hidden md:block">
        <Sidebar 
          activeSessionId={activeSessionId} 
          onSelectSession={setActiveSessionId}
          onNewTask={() => setActiveSessionId(null)}
        />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="md:hidden p-4 border-b border-border flex justify-between items-center bg-card/50">
          <Logo />
          <button onClick={() => setActiveSessionId(null)} className="p-2 rounded-lg bg-white/5">
            <Sparkles className="h-5 w-5 text-primary" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {(!activeSessionId && messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
              <div className="mb-12 space-y-4">
                <div className="relative inline-block">
                  <Terminal className="h-16 w-16 text-primary mx-auto mb-4" />
                  <div className="absolute -top-2 -right-2 bg-accent rounded-full p-1.5 animate-bounce">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h1 className="font-headline text-5xl font-bold tracking-tight text-white mb-2">
                  Ready to assist, Commander.
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  I am AgentX, your autonomous reasoning partner. Select a task template or type a custom command below to begin execution.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <ExampleCard 
                  icon={Search} 
                  title="Market Research" 
                  desc="Analyze the top 3 AI news stories from today and synthesize their impact." 
                  prompt="Search for today's top AI news and summarize the 3 biggest stories" 
                />
                <ExampleCard 
                  icon={Code} 
                  title="Algorithm Engineering" 
                  desc="Find primes up to 200 using an optimized JavaScript sieve and count them." 
                  prompt="Write JavaScript to find all prime numbers up to 200 and count them" 
                />
                <ExampleCard 
                  icon={Calculator} 
                  title="Financial Planning" 
                  desc="Project growth of a $10k portfolio at 9% for 15 years with detailed logic." 
                  prompt="Calculate: If I invest $10,000 at 9% annual return for 15 years, what's the final amount? Show the formula." 
                />
                <ExampleCard 
                  icon={FileText} 
                  title="Technical Analysis" 
                  desc="Compare LangChain and LlamaIndex specifically for production RAG pipelines." 
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