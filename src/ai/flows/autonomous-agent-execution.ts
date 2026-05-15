'use server';
/**
 * @fileOverview An autonomous AI agent that plans and executes tasks using a suite of tools.
 *
 * - autonomousAgentExecution - A function that orchestrates the agent's reasoning process.
 * - AutonomousAgentExecutionInput - The input type for the autonomousAgentExecution function.
 * - AutonomousAgentExecutionOutput - The return type for the autonomousAgentExecution function.
 */

import { ai } from '@/ai/genkit';
import { z, MessagePart, FunctionCallPart } from 'genkit';
import { searchWeb } from '@/lib/tools/web-search';
import { runCode } from '@/lib/tools/code-runner';

// --- Schemas and Types ---

const AutonomousAgentExecutionInputSchema = z.object({
  task: z.string().describe('The high-level task for the agent to complete.'),
});
export type AutonomousAgentExecutionInput = z.infer<typeof AutonomousAgentExecutionInputSchema>;

const AutonomousAgentExecutionOutputSchema = z.object({
  finalAnswer: z.string().describe('The complete, synthesized answer from the agent.'),
  toolCallCount: z.number().describe('The number of times the agent invoked a tool.'),
  iterationCount: z.number().describe('The number of reasoning steps taken by the agent.'),
  elapsedMs: z.number().describe('The time taken by the agent to complete the task in milliseconds.'),
});
export type AutonomousAgentExecutionOutput = z.infer<typeof AutonomousAgentExecutionOutputSchema>;

// --- Constants ---

const SYSTEM_PROMPT = `You are AgentX, a sophisticated autonomous reasoning engine. 
Your goal is to complete the user's task with high precision.

Operational Guidelines:
1. **Plan First**: Break the task into logical steps.
2. **Execute with Tools**: Use tools whenever you need external data or complex processing.
3. **Verify**: Always check tool outputs for errors or inconsistencies.
4. **Synthesize**: Combine all findings into a professional, well-formatted report.
5. **Finality**: Once the task is complete, prefix your conclusion with "FINAL ANSWER:".

Tool Usage:
- web_search: Use for real-world facts, current news, and general knowledge.
- run_code: Use for algorithmic logic, sequence generation, or data manipulation.
- calculate: Use for specific mathematical expressions and formulas.
- summarize: Use to condense large amounts of text from search results before reasoning.

Always strive for clarity and depth in your final response.`;

const MAX_AGENT_ITERATIONS = 12;
const CODE_MAX_OUTPUT_CHARS = 2500;

// --- Tools ---

const webSearchTool = ai.defineTool(
  {
    name: 'web_search',
    description: 'Search the web for up-to-the-minute information, facts, and URLs.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const results = await searchWeb(input.query);
      if (results.success) {
        let formattedResults = `SEARCH RESULTS for "${input.query}":\n\n`;
        results.results.slice(0, 5).forEach((r, i) => {
          formattedResults += `[${i + 1}] ${r.title}\n    Source: ${r.url}\n    Snippet: ${r.snippet}\n\n`;
        });
        return formattedResults.trim();
      }
      return `Search failed: ${results.error || 'No results found.'}`;
    } catch (error: any) {
      return `Search error: ${error.message}`;
    }
  }
);

const runCodeTool = ai.defineTool(
  {
    name: 'run_code',
    description: 'Execute JavaScript code for complex logic, algorithms, or data processing.',
    inputSchema: z.object({
      code: z.string().describe('Self-contained JavaScript code'),
      description: z.string().describe('What this code is intended to solve'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const result = await runCode(input.code);
      if (result.success) {
        return `CODE EXECUTION (${input.description}):\n\nOUTPUT:\n${result.output.substring(0, CODE_MAX_OUTPUT_CHARS)}`;
      }
      return `CODE ERROR: ${result.error}\nCode: ${input.code}`;
    } catch (error: any) {
      return `EXECUTION FAILED: ${error.message}`;
    }
  }
);

const calculateTool = ai.defineTool(
  {
    name: 'calculate',
    description: 'Evaluate mathematical expressions accurately.',
    inputSchema: z.object({
      expression: z.string().describe('Math expression (e.g., "1000 * (1 + 0.05)^10")'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      // Basic sanitization
      const cleanExpr = input.expression.replace(/[^-0-9+*/().%^ \t]/g, '');
      // Handle power operator
      const finalExpr = cleanExpr.replace(/\^/g, '**');
      
      const result = new Function(`return (${finalExpr})`)();
      return `CALCULATION: ${input.expression} = ${result}`;
    } catch (error: any) {
      return `MATH ERROR: ${error.message}`;
    }
  }
);

const summarizeTool = ai.defineTool(
  {
    name: 'summarize',
    description: 'Condense long text into bullet points.',
    inputSchema: z.object({
      text: z.string().describe('Content to summarize'),
      focus: z.string().optional().describe('Specific theme to focus on'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Summarize the following text, focusing on ${input.focus || 'the key takeaways'}:\n\n${input.text}`,
      config: { temperature: 0.3 }
    });
    return `SUMMARY:\n${output}`;
  }
);

// --- Agent Flow ---

const autonomousAgentExecutionFlow = ai.defineFlow(
  {
    name: 'autonomousAgentExecutionFlow',
    inputSchema: AutonomousAgentExecutionInputSchema,
    outputSchema: AutonomousAgentExecutionOutputSchema,
  },
  async (input) => {
    const startTime = Date.now();
    let messages: MessagePart[] = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\nTASK: ' + input.task }] },
    ];
    let toolCallCount = 0;
    let iterationCount = 0;
    let finalAnswer = 'Agent failed to reach a conclusion within the iteration limit.';

    const tools = [webSearchTool, runCodeTool, calculateTool, summarizeTool];

    for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
      iterationCount++;

      const response = await ai.generate({
        model: 'googleai/gemini-1.5-pro',
        contents: messages,
        tools,
        config: { temperature: 0.2 },
      });

      const contents = response.contents;
      messages.push({ role: 'model', parts: contents });

      const functionCalls: FunctionCallPart[] = [];
      contents.forEach(part => {
        if ('functionCall' in part && part.functionCall) {
          functionCalls.push(part.functionCall);
        }
      });

      if (functionCalls.length > 0) {
        toolCallCount += functionCalls.length;
        for (const call of functionCalls) {
          const tool = tools.find(t => t.name === call.name);
          if (tool) {
            const result = await tool.execute(call.args);
            messages.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: call.name,
                  response: { result },
                },
              }],
            });
          }
        }
      } else {
        const textOutput = response.text;
        if (textOutput.includes('FINAL ANSWER:')) {
          finalAnswer = textOutput.split('FINAL ANSWER:')[1].trim();
          break;
        } else if (i === MAX_AGENT_ITERATIONS - 1) {
          finalAnswer = textOutput.trim();
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
);

export async function autonomousAgentExecution(input: AutonomousAgentExecutionInput): Promise<AutonomousAgentExecutionOutput> {
  return autonomousAgentExecutionFlow(input);
}
