
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

const SYSTEM_PROMPT = `You are AgentX, a powerful AI agent with access to tools.
Think carefully before acting. For each task:
1. Analyze what information or computation is needed
2. Use tools to gather data or run calculations
3. Synthesize results into a clear, formatted answer
4. End your response with: FINAL ANSWER: [your complete answer]

Tool selection rules:
- web_search: for facts, news, current data, URLs
- run_code: for algorithms, data processing, sequences, sorting
- calculate: for math expressions and formulas
- summarize: to condense long content before reasoning

Always verify tool results before including in your final answer.
Format final answers with clear headings and bullet points.`;

const MAX_AGENT_ITERATIONS = 15;
const CODE_MAX_OUTPUT_CHARS = 2000;

// --- Tools ---

const webSearchTool = ai.defineTool(
  {
    name: 'web_search',
    description: 'Search the web for current information, news, facts, URLs, and real-world data. Use for anything requiring up-to-date or external knowledge.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const results = await searchWeb(input.query);
      if (results.success) {
        let formattedResults = `WEB SEARCH: ${input.query}\n\n`;
        results.results.forEach((r, i) => {
          formattedResults += `[${i + 1}] ${r.title}\n    ${r.url}\n    ${r.snippet}\n\n`;
        });
        return formattedResults.trim();
      } else {
        return `Search failed: ${results.error}. Try rephrasing.`;
      }
    } catch (error: any) {
      return `Search failed: ${error.message || String(error)}. Try rephrasing.`;
    }
  }
);

const runCodeTool = ai.defineTool(
  {
    name: 'run_code',
    description: 'Execute JavaScript code and return the output. Use for calculations, data processing, algorithms, generating sequences, sorting, string manipulation.',
    inputSchema: z.object({
      code: z.string().describe('JavaScript code to run'),
      description: z.string().describe('What this code does (for context)'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const result = await runCode(input.code, 'javascript');
      if (result.success) {
        const output = String(result.output).substring(0, CODE_MAX_OUTPUT_CHARS);
        return `CODE: ${input.description}\n\n${input.code}\n\nOUTPUT:\n${output}`;
      } else {
        return `CODE ERROR: ${result.error}\nCode was:\n${input.code}`;
      }
    } catch (error: any) {
      return `CODE EXECUTION ERROR: ${error.message || String(error)}\nCode was:\n${input.code}`;
    }
  }
);

const calculateTool = ai.defineTool(
  {
    name: 'calculate',
    description: 'Evaluate mathematical expressions. Use for arithmetic, percentages, compound interest, unit conversion, statistical calculations.',
    inputSchema: z.object({
      expression: z.string().describe('Math expression to evaluate'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      let expression = input.expression.toLowerCase();

      // Replace common patterns for Math functions and constants
      expression = expression.replace(/sqrt\(/g, 'Math.sqrt(');
      expression = expression.replace(/log\(/g, 'Math.log(');
      expression = expression.replace(/pi/g, 'Math.PI');
      expression = expression.replace(/e/g, 'Math.E');
      expression = expression.replace(/sin\(/g, 'Math.sin(');
      expression = expression.replace(/cos\(/g, 'Math.cos(');
      expression = expression.replace(/abs\(/g, 'Math.abs(');
      expression = expression.replace(/round\(/g, 'Math.round(');
      expression = expression.replace(/floor\(/g, 'Math.floor(');
      expression = expression.replace(/ceil\(/g, 'Math.ceil(');
      expression = expression.replace(/pow\(/g, 'Math.pow(');

      // Basic security: Whitelist characters allowed in the expression
      const allowedCharsRegex = /^[0-9+\-*/().%\s\w\[\]]+$/;
      if (!allowedCharsRegex.test(expression)) {
        throw new Error('Expression contains disallowed characters.');
      }

      // Further restrict function calls for safety
      const restrictedKeywords = /(\b(?!Math\.(sqrt|log|sin|cos|abs|round|floor|ceil|pow|PI|E))\w+\b)/g;
      if (restrictedKeywords.test(expression)) {
          throw new Error('Expression contains disallowed keywords or functions.');
      }

      const result = new Function('return ' + expression)();

      if (typeof result !== 'number' && typeof result !== 'bigint') {
        throw new Error('Result is not a number.');
      }

      return `CALCULATION: ${input.expression} = ${result}`;
    } catch (error: any) {
      return `CALCULATION ERROR: ${input.expression} — ${error.message || String(error)}`;
    }
  }
);

const summarizeTool = ai.defineTool(
  {
    name: 'summarize',
    description: 'Summarize long text into key bullet points. Use after web search results to condense before reasoning. Use for any text over 500 characters.',
    inputSchema: z.object({
      text: z.string().describe('Text to summarize'),
      focus: z.string().describe('What aspect to focus on'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    if (input.text.length < 400) {
      return `TEXT (short, no summary needed):\n${input.text}`;
    }

    const promptText = `Summarize in 4 bullet points focusing on ${input.focus}:\n${input.text}`;
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: promptText,
    });
    return `SUMMARY (focus: ${input.focus}):\n${output}`;
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
    let messages: MessagePart[] = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\nTask: ' + input.task }] },
    ];
    let toolCallCount = 0;
    let iterationCount = 0;
    const startTime = Date.now();
    let finalAnswer = 'Agent reached maximum iterations. No final answer was produced.';

    for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
      iterationCount++;

      const { output, stream } = await ai.generateStream({
        model: 'googleai/gemini-1.5-pro',
        contents: messages,
        tools: [webSearchTool, runCodeTool, calculateTool, summarizeTool],
        config: { temperature: 0.1, maxOutputTokens: 2048 },
      });

      let streamedText = '';
      for await (const chunk of stream) {
        if (chunk.text) {
          streamedText += chunk.text;
        }
      }
      await output;

      messages.push({ role: 'model', parts: output.contents });

      const functionCalls: FunctionCallPart[] = [];
      output.contents.forEach(part => {
        if ('functionCall' in part && part.functionCall) {
          functionCalls.push(part.functionCall);
        }
      });

      if (functionCalls.length > 0) {
        toolCallCount += functionCalls.length;
        for (const call of functionCalls) {
          const tool = [webSearchTool, runCodeTool, calculateTool, summarizeTool].find(t => t.name === call.name);
          if (tool) {
            const toolResult = await tool.execute(call.args);
            messages.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: call.name,
                  response: { result: toolResult },
                },
              }],
            });
          } else {
            const errorMsg = `Tool '${call.name}' not found.`;
            messages.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: call.name,
                  response: { error: errorMsg },
                },
              }],
            });
          }
        }
      } else if (streamedText.includes('FINAL ANSWER:')) {
        finalAnswer = streamedText.substring(streamedText.indexOf('FINAL ANSWER:') + 'FINAL ANSWER:'.length).trim();
        break;
      } else if (i === MAX_AGENT_ITERATIONS - 1) {
        finalAnswer = 'Agent reached maximum iterations. Here is what was found so far:\n' + streamedText.trim();
      }
    }

    const elapsedMs = Date.now() - startTime;

    return {
      finalAnswer,
      toolCallCount,
      iterationCount,
      elapsedMs,
    };
  }
);

export async function autonomousAgentExecution(input: AutonomousAgentExecutionInput): Promise<AutonomousAgentExecutionOutput> {
  return autonomousAgentExecutionFlow(input);
}
