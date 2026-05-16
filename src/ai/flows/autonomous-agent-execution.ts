'use server';

import { searchWeb } from '@/lib/tools/web-search';
import { runCode } from '@/lib/tools/code-runner';
import { summarize } from './ai-summarized-web-search';

export interface AutonomousAgentExecutionInput {
  task: string;
}

export interface AutonomousAgentExecutionOutput {
  finalAnswer: string;
  toolCallCount: number;
  iterationCount: number;
  elapsedMs: number;
}

const SYSTEM_PROMPT = `You are AgentX, a sophisticated autonomous reasoning engine. 
Your goal is to complete the user's task with high precision.

Operational Guidelines:
1. **Plan First**: Break the task into logical steps.
2. **Execute with Tools**: Use tools whenever you need external data or complex processing.
3. **Verify**: Always check tool outputs for errors or inconsistencies.
4. **Report**: Compile all findings into a professional, well-formatted report.
5. **Finality**: Once the task is complete, prefix your conclusion with "FINAL ANSWER:".

CRITICAL TOOL CALLING RULES:
- You must output tool calls EXACTLY as standard JSON objects with 'name' and 'arguments'.
- NEVER put the JSON arguments inside the tool name string. The tool name must be exactly "web_search", "run_code", "calculate", or "summarize".
- Do not make up tool names.

Always strive for clarity and depth in your final response.`;

const MAX_AGENT_ITERATIONS = 12;
const CODE_MAX_OUTPUT_CHARS = 2500;

const groqTools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for up-to-the-minute information, facts, and URLs.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_code",
      description: "Execute JavaScript code for complex logic, algorithms, or data processing.",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Self-contained JavaScript code" },
          description: { type: "string", description: "What this code is intended to solve" }
        },
        required: ["code", "description"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Evaluate mathematical expressions accurately.",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "Math expression (e.g., '1000 * (1 + 0.05)^10')" }
        },
        required: ["expression"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "summarize",
      description: "Condense long text into bullet points.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Content to summarize" },
          focus: { type: "string", description: "Specific theme to focus on" }
        },
        required: ["text"]
      }
    }
  }
];

export async function autonomousAgentExecution(input: AutonomousAgentExecutionInput): Promise<AutonomousAgentExecutionOutput> {
  const startTime = Date.now();
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in the environment.');
  }

  let messages: any[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `TASK: ${input.task}` }
  ];

  let toolCallCount = 0;
  let iterationCount = 0;
  let finalAnswer = 'Agent failed to reach a conclusion within the iteration limit.';

  for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
    iterationCount++;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        tools: groqTools,
        tool_choice: 'auto',
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Agent reasoning failed at step ${iterationCount}: Groq API error ${response.status} - ${err}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    
    if (!message) {
      throw new Error(`Agent reasoning failed: No message returned from Groq`);
    }

    messages.push(message);

    if (message.tool_calls && message.tool_calls.length > 0) {
      toolCallCount += message.tool_calls.length;

      for (const toolCall of message.tool_calls) {
        let toolResult = "";
        try {
          const args = JSON.parse(toolCall.function.arguments);
          
          if (toolCall.function.name === 'web_search') {
            const results = await searchWeb(args.query);
            if (results.success && results.results.length > 0) {
              toolResult = `SEARCH RESULTS for "${args.query}":\n\n`;
              results.results.slice(0, 5).forEach((r, idx) => {
                toolResult += `[${idx + 1}] ${r.title}\n    Source: ${r.url}\n    Snippet: ${r.snippet}\n\n`;
              });
              toolResult = toolResult.trim();
            } else {
              toolResult = `Search failed: ${results.error || 'No results found.'}`;
            }
          } 
          else if (toolCall.function.name === 'run_code') {
            const result = await runCode(args.code);
            if (result.success) {
              toolResult = `CODE EXECUTION (${args.description}):\n\nOUTPUT:\n${result.output.substring(0, CODE_MAX_OUTPUT_CHARS)}`;
            } else {
              toolResult = `CODE ERROR: ${result.error}\nCode: ${args.code}`;
            }
          }
          else if (toolCall.function.name === 'calculate') {
            const cleanExpr = args.expression.replace(/[^-0-9+*/().%^ \t]/g, '');
            const finalExpr = cleanExpr.replace(/\^/g, '**');
            const result = new Function(`return (${finalExpr})`)();
            toolResult = `CALCULATION: ${args.expression} = ${result}`;
          }
          else if (toolCall.function.name === 'summarize') {
            toolResult = await summarize({ text: args.text, focus: args.focus || 'key takeaways' });
          }
          else {
            toolResult = `Error: Tool ${toolCall.function.name} not found.`;
          }
        } catch (err: any) {
          toolResult = `Error executing tool ${toolCall.function.name}: ${err.message}`;
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: toolResult
        });
      }
    } else {
      const textOutput = message.content || "";
      if (textOutput.includes('FINAL ANSWER:')) {
        finalAnswer = textOutput.split('FINAL ANSWER:')[1].trim();
        break;
      } else if (i === MAX_AGENT_ITERATIONS - 1) {
        finalAnswer = textOutput.trim();
      } else if (textOutput.length > 0 && i > MAX_AGENT_ITERATIONS / 2) {
        finalAnswer = textOutput.trim();
        break;
      }
    }
  }

  return {
    finalAnswer,
    toolCallCount,
    iterationCount,
    elapsedMs: Date.now() - startTime,
  };
}
