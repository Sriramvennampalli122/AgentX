'use server';

import { runCode } from '@/lib/tools/code-runner';

export interface CodeGenerationInput {
  problemDescription: string;
}

export interface CodeExecutionResult {
  output: string;
  success: boolean;
  error?: string;
  executionTime: number;
}

export interface CodeGenerationAndExecutionOutput {
  generatedCode: string;
  executionResult: CodeExecutionResult;
}

export async function generateAndExecuteCode(
  input: CodeGenerationInput
): Promise<CodeGenerationAndExecutionOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in the environment.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert JavaScript programmer. Your task is to write a JavaScript code snippet that solves the given problem.
The code should be self-contained and not rely on external libraries unless explicitly stated in the problem.
If the problem asks for output, use console.log() to produce it.
Return ONLY the JavaScript code inside a \`\`\`javascript block. Do not provide any conversational text.`
        },
        { 
          role: 'user', 
          content: `Problem Description: ${input.problemDescription}` 
        }
      ],
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const rawCode = data.choices?.[0]?.message?.content || '';

  // Extract code from markdown block
  let generatedCode = rawCode;
  const match = rawCode.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
  if (match) {
    generatedCode = match[1].trim();
  } else {
    // Fallback cleanup if model forgot formatting
    generatedCode = rawCode.replace(/```/g, '').trim();
  }

  if (!generatedCode) {
    throw new Error('AI failed to generate code. Please try rephrasing your problem description.');
  }

  const startTime = Date.now();
  const runResult = await runCode(generatedCode);
  const executionTime = Date.now() - startTime;

  return {
    generatedCode,
    executionResult: {
      output: runResult.output,
      success: runResult.success,
      error: runResult.error,
      executionTime,
    }
  };
}
