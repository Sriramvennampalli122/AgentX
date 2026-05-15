'use server';

import { autonomousAgentExecution, type AutonomousAgentExecutionOutput } from '@/ai/flows/autonomous-agent-execution';
import { generateAndExecuteCode, type CodeGenerationAndExecutionOutput } from '@/ai/flows/ai-code-generation-and-execution';

export async function executeAgentTask(task: string): Promise<AutonomousAgentExecutionOutput> {
  try {
    return await autonomousAgentExecution({ task });
  } catch (error: any) {
    console.error('Agent execution failed:', error);
    throw new Error(error.message || 'The agent encountered an error processing your task.');
  }
}

export async function executeCodeTask(description: string): Promise<CodeGenerationAndExecutionOutput> {
  try {
    return await generateAndExecuteCode({ problemDescription: description });
  } catch (error: any) {
    console.error('Code task execution failed:', error);
    throw new Error(error.message || 'Failed to generate or execute code.');
  }
}
