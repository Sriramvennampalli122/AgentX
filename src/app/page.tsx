'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/agent/Sidebar';
import { TaskInput } from '@/components/agent/TaskInput';
import { ExecutionPanel } from '@/components/agent/ExecutionPanel';
import { Logo } from '@/components/agent/Logo';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sessionStore, type Session, type Message } from '@/lib/session-store';
import { executeAgentTask, executeCodeTask } from './actions/agent';
import { useToast } from '@/hooks/use-toast';
import { Search, Code, Calculator, FileText, ShieldCheck, Cpu, Globe, Beaker } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export default function AgentXDashboard() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeEngine, setActiveEngine] = useState<'research' | 'code'>('research');
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
      if (session) {
        if (session.status === 'complete') {
          setStats({
            tools: session.toolCallCount || 0,
            iterations: session.iterationCount || 0,
            elapsed: (session.elapsedMs! / 1000).toFixed(1)
          });
        }
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
        { id: 't1', role: 'system', content: `Initializing ${activeEngine} protocol for: ${task}`, type: 'thinking', timestamp: Date.now() },
      ];
      initialMsgs.forEach(m => sessionStore.saveMessage(sessionId, m));
      setMessages(initialMsgs);

      let finalAnswer = '';
      let toolCount = 0;
      let iterations = 0;

      if (activeEngine === 'research') {
        const result = await executeAgentTask(task);
        finalAnswer = result.finalAnswer;
        toolCount = result.toolCallCount;
        iterations = result.iterationCount;
      } else {
        const result = await executeCodeTask(task);
        finalAnswer = `### Outcome\n\`\`\`javascript\n${result.generatedCode}\n\`\`\`\n\n### Execution Results\n${result.executionResult.success ? '**Success**' : '**Failure**'}\n- Time: ${result.executionResult.executionTime}ms\n- Output:\n\`\`\`\n${result.executionResult.output}\n\`\`\``;
        if (result.executionResult.error) {
          finalAnswer += `\n\n### Error\n\`${result.executionResult.error}\``;
        }
        toolCount = 1;
        iterations = 2;
      }
      
      const elapsedMs = Date.now() - startTime;
      const finalMsg: Message = {
        id: 'f1',
        role: 'model',
        content: finalAnswer,
        type: 'final',
        timestamp: Date.now()
      };
      
      sessionStore.saveMessage(sessionId, finalMsg);
      setMessages(prev => [...prev, finalMsg]);
      
      const updatedSession: Session = {
        ...newSession,
        status: 'complete',
        toolCallCount: toolCount,
        iterationCount: iterations,
        finalAnswer: finalAnswer,
        elapsedMs
      };
      
      sessionStore.saveSession(updatedSession);
      setStats({
        tools: toolCount,
        iterations: iterations,
        elapsed: (elapsedMs / 1000).toFixed(1)
      });
      
      toast({ title: "Operation Complete", description: "The reasoning loop has finished successfully." });
    } catch (error: any) {
      const errorMsg: Message = {
        id: 'e1',
        role: 'system',
        content: error.message || 'The reasoning loop encountered an internal error.',
        type: 'error',
        timestamp: Date.now()
      };
      sessionStore.saveMessage(sessionId, errorMsg);
      setMessages(prev => [...prev, errorMsg]);
      
      sessionStore.saveSession({ ...newSession, status: 'error' });
      toast({ variant: "destructive", title: "Protocol Breach", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const PresetCard = ({ icon: Icon, title, desc, prompt, engine }: any) => (
    <div 
      onClick={() => {
        setActiveEngine(engine);
        runTask(prompt);
      }}
      className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="h-16 w-16" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 ring-1",
          engine === 'research' ? "bg-primary/10 text-primary ring-primary/20" : "bg-accent/10 text-accent ring-accent/20"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-headline font-bold text-white text-[10px] tracking-widest uppercase">{title}</h4>
          <p className="text-[11px] text-white/40 mt-1 font-body leading-relaxed line-clamp-2">{desc}</p>
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
        <header className="flex h-16 items-center justify-between px-8 border-b border-white/5 bg-black/40 backdrop-blur-xl z-20">
          <div className="flex items-center gap-12">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="hidden lg:flex items-center gap-8">
              <Tabs value={activeEngine} onValueChange={(v: any) => setActiveEngine(v)} className="bg-white/5 p-1 rounded-xl border border-white/5">
                <TabsList className="bg-transparent h-8 p-0 gap-1">
                  <TabsTrigger value="research" className="rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-full px-4">
                    <Globe className="h-3 w-3 mr-2" />
                    Research Hub
                  </TabsTrigger>
                  <TabsTrigger value="code" className="rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-accent/20 data-[state=active]:text-accent h-full px-4">
                    <Beaker className="h-3 w-3 mr-2" />
                    Logic Lab
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-6 pr-6 border-r border-white/5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-green-500/60" />
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Auth Level 1</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="h-3 w-3 text-primary/60" />
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Flash-1.5 Core</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white"
              onClick={() => setActiveSessionId(null)}
            >
              Reset Workbench
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {(!activeSessionId && messages.length === 0) ? (
            <div className="h-full overflow-y-auto custom-scrollbar">
              <div className="min-h-full flex flex-col items-center justify-center p-12 max-w-6xl mx-auto space-y-16">
                <div className="text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
                  <h1 className="font-headline text-5xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-[1.1]">
                    {activeEngine === 'research' ? (
                      <>Global <span className="text-primary italic font-light">Intelligence</span> & Outcomes</>
                    ) : (
                      <>Algorithmic <span className="text-accent italic font-light">Laboratory</span> & Logic</>
                    )}
                  </h1>
                  <p className="text-sm text-white/30 max-w-xl mx-auto font-body leading-relaxed">
                    {activeEngine === 'research' 
                      ? 'Deploy autonomous agents to crawl, analyze, and deliver high-precision reports.'
                      : 'Generate, audit, and execute JavaScript logic in secure, isolated environments for rapid algorithmic prototyping.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <PresetCard 
                    engine="research"
                    icon={Search} 
                    title="Market Alpha" 
                    desc="Search for top AI news and summarize the 3 biggest stories today." 
                    prompt="Search for today's top AI news and summarize the 3 biggest stories" 
                  />
                  <PresetCard 
                    engine="code"
                    icon={Code} 
                    title="Math Prime" 
                    desc="Write JS to find and count all prime numbers up to 200." 
                    prompt="Write JavaScript to find all prime numbers up to 200 and count them" 
                  />
                  <PresetCard 
                    engine="research"
                    icon={Calculator} 
                    title="Financial Proj" 
                    desc="Calculate returns on $10,000 at 9% for 15 years with detailed formula." 
                    prompt="Calculate: If I invest $10,000 at 9% annual return for 15 years, what's the final amount? Show the formula." 
                  />
                  <PresetCard 
                    engine="research"
                    icon={FileText} 
                    title="Stack Audit" 
                    desc="Compare LangChain vs LlamaIndex for RAG pipelines architectures." 
                    prompt="Search for LangChain vs LlamaIndex comparison and tell me which is better for RAG pipelines" 
                  />
                </div>
              </div>
            </div>
          ) : (
            <ExecutionPanel messages={messages} stats={stats} />
          )}
        </div>

        <div className="pb-8 pt-4 border-t border-white/5 bg-black/20">
          <TaskInput 
            onRun={runTask} 
            isLoading={isLoading} 
            placeholder={activeEngine === 'research' ? "Initiate research protocol..." : "Enter debugging requirement..."}
          />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
