'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Wrench, CheckCircle, Search, Code, Calculator, FileText, Copy, ExternalLink, Activity } from 'lucide-react';
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
    // Automatically switch tabs based on flow
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

  return (
    <div className="flex h-full flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card/30 px-6 pt-2">
          <TabsList className="bg-transparent h-auto gap-8 p-0">
            <TabsTrigger 
              value="thinking" 
              className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 text-sm font-medium data-[state=active]:border-amber-500 data-[state=active]:text-amber-500"
            >
              <Brain className="mr-2 h-4 w-4" />
              Thinking
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 text-sm font-medium data-[state=active]:border-accent data-[state=active]:text-accent"
            >
              <Wrench className="mr-2 h-4 w-4" />
              Tools
              {toolCalls.length > 0 && (
                <span className="ml-2 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">
                  {Math.ceil(toolCalls.length / 2)}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="answer" 
              className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Answer
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="thinking" className="h-full m-0 p-6">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {thinkingSteps.length === 0 ? (
                  <div className="flex items-center gap-3 text-muted-foreground italic">
                    <Activity className="h-4 w-4 animate-pulse" />
                    Waiting for reasoning steps...
                  </div>
                ) : (
                  thinkingSteps.map((step, i) => (
                    <div key={step.id} className="thinking-step rounded-r-lg">
                      <div className="flex-1 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Step {i + 1}</span>
                        <p className="font-code text-sm leading-relaxed text-foreground">
                          {step.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tools" className="h-full m-0 p-6">
            <ScrollArea className="h-full pr-4">
              <div className="grid gap-6">
                {toolCalls.length === 0 ? (
                  <div className="flex items-center gap-3 text-muted-foreground italic">
                    <Activity className="h-4 w-4 animate-pulse" />
                    Waiting for tool triggers...
                  </div>
                ) : (
                  Array.from({ length: Math.ceil(toolCalls.length / 2) }).map((_, i) => {
                    const call = toolCalls[i * 2];
                    const result = toolCalls[i * 2 + 1];
                    const toolName = call?.toolName || 'Unknown Tool';
                    
                    const getToolConfig = (name: string) => {
                      if (name.includes('web')) return { icon: Search, color: 'border-blue-500', bg: 'bg-blue-500/5', label: 'Web Search' };
                      if (name.includes('code')) return { icon: Code, color: 'border-purple-500', bg: 'bg-purple-500/5', label: 'Code Execution' };
                      if (name.includes('calc')) return { icon: Calculator, color: 'border-orange-500', bg: 'bg-orange-500/5', label: 'Calculation' };
                      return { icon: FileText, color: 'border-green-500', bg: 'bg-green-500/5', label: 'Summarize' };
                    };

                    const config = getToolConfig(toolName);

                    return (
                      <div key={call.id} className={cn("terminal-card border-l-4", config.color, config.bg)}>
                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <config.icon className={cn("h-4 w-4", config.color.replace('border-', 'text-'))} />
                            <span className="font-headline font-bold text-sm tracking-wide">{config.label}</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {new Date(call.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Input</span>
                            <pre className="font-code text-xs bg-black/40 p-3 rounded-md overflow-x-auto border border-white/5">
                              {call.content}
                            </pre>
                          </div>
                          {result && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Output</span>
                              <div className="font-code text-xs bg-black/20 p-3 rounded-md border border-white/5 text-muted-foreground line-clamp-6">
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

          <TabsContent value="answer" className="h-full m-0 p-6">
            <ScrollArea className="h-full pr-4">
              <div className="max-w-3xl mx-auto space-y-8 pb-12">
                {!finalAnswer ? (
                  <div className="flex flex-col items-center justify-center h-[300px] gap-4 text-muted-foreground">
                    <Activity className="h-12 w-12 animate-pulse text-primary/30" />
                    <p className="font-headline font-medium tracking-wide">Synthesizing final answer...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <h2 className="font-headline text-2xl font-bold">Final Synthesis</h2>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(finalAnswer.content)} className="h-8 gap-2 border-white/10 hover:bg-white/5">
                          <Copy className="h-3 w-3" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    
                    <div className="prose prose-invert prose-p:leading-relaxed prose-li:my-1 max-w-none text-foreground/90 leading-relaxed font-body text-lg">
                      {finalAnswer.content.split('\n').map((line, i) => {
                        if (line.startsWith('###')) return <h3 key={i} className="text-xl font-bold mt-6 mb-3 text-white">{line.replace('###', '')}</h3>;
                        if (line.startsWith('##')) return <h2 key={i} className="text-2xl font-bold mt-8 mb-4 text-white">{line.replace('##', '')}</h2>;
                        if (line.trim().startsWith('-') || line.trim().startsWith('•')) return <li key={i} className="ml-4">{line.replace(/^[-•]/, '').trim()}</li>;
                        if (line.trim() === '') return <br key={i} />;
                        return <p key={i} className="mb-4">{line}</p>;
                      })}
                    </div>

                    {stats && (
                      <div className="flex flex-wrap gap-4 pt-8 border-t border-border">
                        <div className="px-4 py-2 bg-card rounded-lg border border-border flex items-center gap-3">
                          <Wrench className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium">{stats.tools} Tool Calls</span>
                        </div>
                        <div className="px-4 py-2 bg-card rounded-lg border border-border flex items-center gap-3">
                          <Activity className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium">{stats.iterations} Iterations</span>
                        </div>
                        <div className="px-4 py-2 bg-card rounded-lg border border-border flex items-center gap-3">
                          <Activity className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{stats.elapsed}s Elapsed</span>
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