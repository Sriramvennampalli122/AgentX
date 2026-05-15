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
  Sparkles
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
    <div className="flex h-full flex-col bg-background/50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-white/5 bg-card/20 px-8 pt-4">
          <TabsList className="bg-transparent h-auto gap-10 p-0 border-none">
            <TabsTrigger 
              value="thinking" 
              className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-4 pt-2 text-sm font-semibold tracking-wider uppercase transition-all data-[state=active]:border-amber-500 data-[state=active]:text-amber-500 data-[state=active]:bg-transparent"
            >
              <Brain className="mr-2.5 h-4 w-4" />
              Reasoning
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-4 pt-2 text-sm font-semibold tracking-wider uppercase transition-all data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent"
            >
              <Wrench className="mr-2.5 h-4 w-4" />
              Toolbox
              {toolCalls.length > 0 && (
                <span className="ml-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[10px] text-accent ring-1 ring-accent/30">
                  {Math.ceil(toolCalls.length / 2)}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="answer" 
              className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-4 pt-2 text-sm font-semibold tracking-wider uppercase transition-all data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
            >
              <CheckCircle className="mr-2.5 h-4 w-4" />
              Synthesis
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="thinking" className="h-full m-0 p-8">
            <ScrollArea className="h-full pr-6">
              <div className="space-y-4 max-w-4xl">
                {thinkingSteps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] gap-6 text-muted-foreground/30">
                    <Layers className="h-16 w-16 stroke-[1]" />
                    <p className="text-sm font-headline tracking-[0.2em] uppercase">Observation queue empty</p>
                  </div>
                ) : (
                  thinkingSteps.map((step, i) => (
                    <div key={step.id} className="thinking-step rounded-xl group transition-all hover:bg-amber-500/[0.05]">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-500 ring-1 ring-amber-500/20">
                            {i + 1}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500/60">Logic Cycle</span>
                        </div>
                        <p className="font-code text-sm leading-relaxed text-foreground/90 pl-1">
                          {step.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tools" className="h-full m-0 p-8">
            <ScrollArea className="h-full pr-6">
              <div className="grid gap-6 max-w-4xl">
                {toolCalls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] gap-6 text-muted-foreground/30">
                    <Terminal className="h-16 w-16 stroke-[1]" />
                    <p className="text-sm font-headline tracking-[0.2em] uppercase">Tool registry idle</p>
                  </div>
                ) : (
                  Array.from({ length: Math.ceil(toolCalls.length / 2) }).map((_, i) => {
                    const call = toolCalls[i * 2];
                    const result = toolCalls[i * 2 + 1];
                    const toolName = call?.toolName || 'system_tool';
                    
                    const getToolConfig = (name: string) => {
                      if (name.includes('web')) return { icon: Search, color: 'border-blue-500', bg: 'bg-blue-500/[0.03]', label: 'Web Intelligence', text: 'text-blue-400' };
                      if (name.includes('code')) return { icon: Code, color: 'border-purple-500', bg: 'bg-purple-500/[0.03]', label: 'Binary Sandbox', text: 'text-purple-400' };
                      if (name.includes('calc')) return { icon: Calculator, color: 'border-orange-500', bg: 'bg-orange-500/[0.03]', label: 'Compute Engine', text: 'text-orange-400' };
                      return { icon: FileText, color: 'border-green-500', bg: 'bg-green-500/[0.03]', label: 'Neural Summary', text: 'text-green-400' };
                    };

                    const config = getToolConfig(toolName);

                    return (
                      <div key={call.id} className={cn("terminal-card border-l-4 group", config.color, config.bg)}>
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-1.5 rounded-lg bg-white/5", config.text)}>
                              <config.icon className="h-4 w-4" />
                            </div>
                            <span className="font-headline font-bold text-sm tracking-wide uppercase text-white/80">{config.label}</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground/50 tracking-widest">
                            {new Date(call.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="p-6 space-y-5">
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Request Payload</span>
                            <pre className="font-code text-xs bg-black/60 p-4 rounded-xl overflow-x-auto border border-white/5 whitespace-pre-wrap leading-relaxed text-foreground/80">
                              {call.content}
                            </pre>
                          </div>
                          {result && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Execution Response</span>
                              <div className="font-code text-xs bg-white/[0.02] p-4 rounded-xl border border-white/5 text-muted-foreground/90 leading-relaxed italic">
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

          <TabsContent value="answer" className="h-full m-0 p-8">
            <ScrollArea className="h-full pr-6">
              <div className="max-w-4xl mx-auto space-y-10 pb-20">
                {!finalAnswer ? (
                  <div className="flex flex-col items-center justify-center h-[400px] gap-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                      <Activity className="h-16 w-16 animate-pulse text-primary relative z-10" />
                    </div>
                    <div className="text-center space-y-2 relative z-10">
                      <p className="font-headline font-bold tracking-[0.3em] uppercase text-white animate-pulse">Neural Synthesis Active</p>
                      <p className="text-sm text-muted-foreground/60 tracking-wider">Aggregating multi-source observations...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-white/10 pb-8">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Verified Output</span>
                        </div>
                        <h2 className="font-headline text-4xl font-bold text-white tracking-tight text-gradient">Executive Brief</h2>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(finalAnswer.content)} className="h-10 gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-xs font-semibold tracking-wide px-5">
                        <Copy className="h-3.5 w-3.5" />
                        COPY PROTOCOL
                      </Button>
                    </div>
                    
                    <div className="prose prose-invert prose-p:leading-relaxed prose-li:my-2 max-w-none text-foreground/85 leading-relaxed font-body text-xl space-y-8">
                      {finalAnswer.content.split('\n').map((line, i) => {
                        if (line.startsWith('###')) return <h3 key={i} className="text-2xl font-bold pt-6 text-white tracking-tight">{line.replace('###', '').trim()}</h3>;
                        if (line.startsWith('##')) return <h2 key={i} className="text-3xl font-bold pt-10 text-white tracking-tight border-b border-white/5 pb-3">{line.replace('##', '').trim()}</h2>;
                        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                          return (
                            <div key={i} className="flex gap-4 group">
                              <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-1 transition-transform group-hover:translate-x-1" />
                              <li className="list-none text-foreground/90">{line.replace(/^[-•]/, '').trim()}</li>
                            </div>
                          );
                        }
                        if (line.trim() === '') return <div key={i} className="h-4" />;
                        
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p key={i}>
                            {parts.map((part, pi) => (
                              part.startsWith('**') && part.endsWith('**') 
                                ? <strong key={pi} className="text-white font-bold bg-white/5 px-1 rounded">{part.slice(2, -2)}</strong> 
                                : part
                            ))}
                          </p>
                        );
                      })}
                    </div>

                    {stats && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 border-t border-white/10 mt-12">
                        <div className="px-6 py-5 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center gap-5 group transition-colors hover:bg-white/[0.04]">
                          <div className="p-2.5 rounded-xl bg-accent/10 text-accent transition-transform group-hover:rotate-12">
                            <Wrench className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">Tool Chain</span>
                            <span className="text-lg font-bold text-white">{stats.tools} Ops</span>
                          </div>
                        </div>
                        <div className="px-6 py-5 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center gap-5 group transition-colors hover:bg-white/[0.04]">
                          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 transition-transform group-hover:scale-110">
                            <Brain className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">Neural Cycles</span>
                            <span className="text-lg font-bold text-white">{stats.iterations} Cycles</span>
                          </div>
                        </div>
                        <div className="px-6 py-5 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center gap-5 group transition-colors hover:bg-white/[0.04]">
                          <div className="p-2.5 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                            <Activity className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">Latency</span>
                            <span className="text-lg font-bold text-white">{stats.elapsed}s</span>
                          </div>
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