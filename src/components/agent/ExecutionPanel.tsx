'use client';

import { useState, useEffect, useRef } from 'react';
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
  Zap,
  Box,
  Braces
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
        <div className="px-8 bg-black/40 border-b border-white/5">
          <TabsList className="bg-transparent h-auto gap-12 p-0">
            <TabsTrigger 
              value="thinking" 
              className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all data-[state=active]:border-amber-500/50 data-[state=active]:text-amber-500"
            >
              <Brain className="mr-2.5 h-3.5 w-3.5" />
              Reasoning
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all data-[state=active]:border-primary/50 data-[state=active]:text-primary"
            >
              <Braces className="mr-2.5 h-3.5 w-3.5" />
              Operations
              {toolCalls.length > 0 && (
                <span className="ml-2.5 px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-white/40 border border-white/10 font-code">
                  {Math.ceil(toolCalls.length / 2)}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="answer" 
              className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all data-[state=active]:border-white/50 data-[state=active]:text-white"
            >
              <Box className="mr-2.5 h-3.5 w-3.5" />
              Synthesis
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <TabsContent value="thinking" className="h-full m-0">
            <ScrollArea className="h-full" viewportRef={scrollRef}>
              <div className="p-8 space-y-4 max-w-4xl mx-auto">
                {thinkingSteps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] gap-4 opacity-20">
                    <Layers className="h-12 w-12 stroke-[1px]" />
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase">Observation queue idle</p>
                  </div>
                ) : (
                  thinkingSteps.map((step, i) => (
                    <div key={step.id} className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 group hover:bg-white/[0.02] transition-colors">
                      <div className="flex gap-6">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-[10px] font-bold text-amber-500 border border-amber-500/20 font-code">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="space-y-3">
                          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">Neural Logic Cycle</span>
                          <p className="font-code text-sm leading-relaxed text-white/70">
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
              <div className="p-8 grid gap-6 max-w-4xl mx-auto">
                {toolCalls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] gap-4 opacity-20">
                    <Terminal className="h-12 w-12 stroke-[1px]" />
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase">Tool registry standby</p>
                  </div>
                ) : (
                  Array.from({ length: Math.ceil(toolCalls.length / 2) }).map((_, i) => {
                    const call = toolCalls[i * 2];
                    const result = toolCalls[i * 2 + 1];
                    const toolName = call?.toolName || 'system_call';
                    
                    const getToolConfig = (name: string) => {
                      const lower = name.toLowerCase();
                      if (lower.includes('web')) return { icon: Search, color: 'text-blue-400', label: 'Web Intelligence' };
                      if (lower.includes('code')) return { icon: Braces, color: 'text-purple-400', label: 'Logic Sandbox' };
                      if (lower.includes('calc')) return { icon: Calculator, color: 'text-orange-400', label: 'Precision Compute' };
                      return { icon: FileText, color: 'text-green-400', label: 'Synthesis Utility' };
                    };

                    const config = getToolConfig(toolName);

                    return (
                      <div key={call.id} className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <config.icon className={cn("h-3.5 w-3.5", config.color)} />
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">{config.label}</span>
                          </div>
                          <span className="text-[9px] font-code text-white/10 tracking-[0.2em]">
                            OP_ID: {call.id.slice(0, 6)}
                          </span>
                        </div>
                        <div className="p-8 space-y-8">
                          <div className="space-y-3">
                            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">Input Parameters</span>
                            <pre className="font-code text-xs bg-black/40 p-5 rounded-2xl border border-white/5 overflow-x-auto text-white/60 leading-relaxed custom-scrollbar">
                              {call.content}
                            </pre>
                          </div>
                          {result && (
                            <div className="space-y-3">
                              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">Output Stream</span>
                              <div className="font-code text-xs p-5 rounded-2xl border border-white/5 bg-white/[0.01] text-white/40 leading-relaxed italic border-l-2 border-l-primary/30">
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
                  <div className="flex flex-col items-center justify-center h-[400px] gap-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full scale-150 animate-pulse" />
                      <Activity className="h-16 w-16 text-primary/40 relative z-10 animate-pulse stroke-[1px]" />
                    </div>
                    <div className="text-center space-y-3">
                      <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/40 animate-pulse">Converging Logic Points</p>
                      <p className="text-[11px] text-white/20 tracking-widest font-body">Synthesizing multi-source verification...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between pb-10 border-b border-white/5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary/60">
                          <Zap className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Synthesis Outcome</span>
                        </div>
                        <h2 className="font-headline text-4xl font-bold text-white tracking-tight leading-tight">Protocol Report</h2>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(finalAnswer.content)} className="h-11 bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-bold tracking-[0.2em] px-8 rounded-xl transition-all">
                        <Copy className="h-3.5 w-3.5 mr-2.5" />
                        COPY REPORT
                      </Button>
                    </div>
                    
                    <div className="prose prose-invert prose-p:leading-relaxed max-w-none text-white/70 leading-relaxed font-body text-[17px] space-y-10">
                      {finalAnswer.content.split('\n').map((line, i) => {
                        if (line.startsWith('###')) return <h3 key={i} className="text-xl font-bold pt-8 text-white/90 tracking-tight flex items-center gap-3"><ChevronRight className="h-4 w-4 text-primary/50" /> {line.replace('###', '').trim()}</h3>;
                        if (line.startsWith('##')) return <h2 key={i} className="text-2xl font-bold pt-12 text-white tracking-tight border-b border-white/5 pb-4 mb-6">{line.replace('##', '').trim()}</h2>;
                        if (line.startsWith('```')) {
                          // Very basic code block handling for preview
                          return null; 
                        }
                        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                          return (
                            <div key={i} className="flex gap-5 group py-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary/30 shrink-0 mt-[11px] group-hover:bg-primary transition-colors" />
                              <li className="list-none text-white/80 leading-relaxed">{line.replace(/^[-•]/, '').trim()}</li>
                            </div>
                          );
                        }
                        if (line.trim() === '') return <div key={i} className="h-4" />;
                        
                        // Handle bold text
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p key={i}>
                            {parts.map((part, pi) => (
                              part.startsWith('**') && part.endsWith('**') 
                                ? <strong key={pi} className="text-white font-bold bg-white/5 px-2 py-0.5 rounded mx-0.5 border border-white/5">{part.slice(2, -2)}</strong> 
                                : part
                            ))}
                          </p>
                        );
                      }).filter(Boolean)}
                    </div>

                    {stats && (
                      <div className="grid grid-cols-3 gap-12 pt-16 border-t border-white/5">
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold text-white/10 uppercase tracking-[0.3em]">Ops Executed</span>
                          <p className="text-2xl font-bold text-white tracking-tight font-code">{stats.tools}</p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold text-white/10 uppercase tracking-[0.3em]">Neural Cycles</span>
                          <p className="text-2xl font-bold text-white tracking-tight font-code">{stats.iterations}</p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold text-white/10 uppercase tracking-[0.3em]">Latency</span>
                          <p className="text-2xl font-bold text-white tracking-tight font-code">{stats.elapsed}<span className="text-xs text-white/30 ml-1">s</span></p>
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
