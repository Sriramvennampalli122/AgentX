'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Wrench, 
  CheckCircle, 
  Search, 
  Code, 
  Calculator, 
  FileText, 
  Copy, 
  Activity,
  ChevronRight,
  Terminal,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { type Message } from '@/lib/session-store';
import { cn } from '@/lib/utils';

export function ExecutionPanel({ 
  messages, 
  stats 
}: { 
  messages: Message[];
  stats?: { tools: number; iterations: number; elapsed: string };
}) {
  const [activeTab, setActiveTab] = useState('answer');

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.type === 'final') setActiveTab('answer');
      else if (lastMsg.type === 'tool_call' || lastMsg.type === 'tool_result') setActiveTab('tools');
      else if (lastMsg.type === 'thinking') setActiveTab('thinking');
    }
  }, [messages]);

  const toolCalls = messages.filter(m => m.type === 'tool_call' || m.type === 'tool_result');
  const thinkingSteps = messages.filter(m => m.type === 'thinking');
  const finalAnswer = messages.find(m => m.type === 'final');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex h-full flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-8 bg-black/20 border-b border-white/5">
          <TabsList className="bg-transparent h-auto gap-8 p-0">
            <TabsTrigger 
              value="thinking" 
              className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all data-[state=active]:border-amber-500/50 data-[state=active]:text-amber-500"
            >
              <Brain className="mr-2 h-3.5 w-3.5" />
              Reasoning
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all data-[state=active]:border-primary/50 data-[state=active]:text-primary"
            >
              <Wrench className="mr-2 h-3.5 w-3.5" />
              Operations
              {toolCalls.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/5 text-[9px] text-white/40 ring-1 ring-white/10">
                  {Math.ceil(toolCalls.length / 2)}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="answer" 
              className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all data-[state=active]:border-white/50 data-[state=active]:text-white"
            >
              <CheckCircle className="mr-2 h-3.5 w-3.5" />
              Outcome
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="thinking" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-8 space-y-4 max-w-4xl">
                {thinkingSteps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] gap-4 opacity-20">
                    <Layers className="h-12 w-12" />
                    <p className="text-[10px] font-bold tracking-widest uppercase">Observation queue idle</p>
                  </div>
                ) : (
                  thinkingSteps.map((step, i) => (
                    <div key={step.id} className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 group hover:bg-white/[0.02] transition-colors">
                      <div className="flex gap-4">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-500/10 text-[9px] font-bold text-amber-500 border border-amber-500/20">
                          {i + 1}
                        </div>
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">System Logic Cycle</span>
                          <p className="font-code text-sm leading-relaxed text-white/80">
                            {step.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tools" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-8 grid gap-6 max-w-4xl">
                {toolCalls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] gap-4 opacity-20">
                    <Terminal className="h-12 w-12" />
                    <p className="text-[10px] font-bold tracking-widest uppercase">Registry standby</p>
                  </div>
                ) : (
                  Array.from({ length: Math.ceil(toolCalls.length / 2) }).map((_, i) => {
                    const call = toolCalls[i * 2];
                    const result = toolCalls[i * 2 + 1];
                    const toolName = call?.toolName || 'system_tool';
                    
                    const getToolConfig = (name: string) => {
                      if (name.includes('web')) return { icon: Search, color: 'text-blue-400', label: 'Web Intelligence' };
                      if (name.includes('code')) return { icon: Code, color: 'text-purple-400', label: 'Logic Sandbox' };
                      if (name.includes('calc')) return { icon: Calculator, color: 'text-orange-400', label: 'Compute Engine' };
                      return { icon: FileText, color: 'text-green-400', label: 'Synthesis Tool' };
                    };

                    const config = getToolConfig(toolName);

                    return (
                      <div key={call.id} className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
                          <div className="flex items-center gap-3">
                            <config.icon className={cn("h-4 w-4", config.color)} />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-white/60">{config.label}</span>
                          </div>
                          <span className="text-[9px] font-code text-white/20 tracking-widest">
                            {new Date(call.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="p-6 space-y-6">
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Input Parameters</span>
                            <pre className="font-code text-xs bg-black/40 p-4 rounded-xl border border-white/5 overflow-x-auto text-white/60 leading-relaxed">
                              {call.content}
                            </pre>
                          </div>
                          {result && (
                            <div className="space-y-2">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Output Stream</span>
                              <div className="font-code text-xs p-4 rounded-xl border border-white/5 bg-white/[0.01] text-white/40 leading-relaxed italic">
                                {result.content}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="answer" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-12 max-w-4xl mx-auto space-y-12 pb-32">
                {!finalAnswer ? (
                  <div className="flex flex-col items-center justify-center h-[400px] gap-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 animate-pulse" />
                      <Activity className="h-16 w-16 text-primary relative z-10 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-white animate-pulse">Neural Convergence in Progress</p>
                      <p className="text-xs text-white/30 tracking-widest">Collecting multi-source evidence...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between pb-8 border-b border-white/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary">
                          <Zap className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Executive Summary</span>
                        </div>
                        <h2 className="font-headline text-4xl font-bold text-white tracking-tight">Outcome Report</h2>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(finalAnswer.content)} className="h-10 bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-bold tracking-widest px-6 rounded-xl">
                        <Copy className="h-3.5 w-3.5 mr-2" />
                        COPY REPORT
                      </Button>
                    </div>
                    
                    <div className="prose prose-invert prose-p:leading-relaxed max-w-none text-white/70 leading-relaxed font-body text-lg space-y-8">
                      {finalAnswer.content.split('\n').map((line, i) => {
                        if (line.startsWith('###')) return <h3 key={i} className="text-xl font-bold pt-6 text-white tracking-tight">{line.replace('###', '').trim()}</h3>;
                        if (line.startsWith('##')) return <h2 key={i} className="text-2xl font-bold pt-10 text-white tracking-tight border-b border-white/5 pb-2">{line.replace('##', '').trim()}</h2>;
                        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                          return (
                            <div key={i} className="flex gap-4 group">
                              <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-1.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                              <li className="list-none text-white/80">{line.replace(/^[-•]/, '').trim()}</li>
                            </div>
                          );
                        }
                        if (line.trim() === '') return <div key={i} className="h-4" />;
                        
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p key={i}>
                            {parts.map((part, pi) => (
                              part.startsWith('**') && part.endsWith('**') 
                                ? <strong key={pi} className="text-white font-bold bg-white/5 px-1 rounded mx-0.5">{part.slice(2, -2)}</strong> 
                                : part
                            ))}
                          </p>
                        );
                      })}
                    </div>

                    {stats && (
                      <div className="grid grid-cols-3 gap-8 pt-16 border-t border-white/5">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Ops Executed</span>
                          <p className="text-xl font-bold text-white tracking-tight">{stats.tools}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Neural Cycles</span>
                          <p className="text-xl font-bold text-white tracking-tight">{stats.iterations}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Latency</span>
                          <p className="text-xl font-bold text-white tracking-tight">{stats.elapsed}s</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
