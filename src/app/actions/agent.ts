'use server';

import { autonomousAgentExecution, type AutonomousAgentExecutionOutput } from '@/ai/flows/autonomous-agent-execution';

export async function executeAgentTask(task: string): Promise<AutonomousAgentExecutionOutput> {
  try {
    return await autonomousAgentExecution({ task });
  } catch (error: any) {
    console.error('Agent execution failed:', error);
    throw new Error(error.message || 'The agent encountered an error processing your task.');
  }
}