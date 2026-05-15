
'use server';

import { VM } from 'vm2';

export interface CodeRunnerResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Executes JavaScript code in a secure sandboxed environment using VM2.
 */
export async function runCode(code: string, language: string = 'javascript'): Promise<CodeRunnerResult> {
  if (language !== 'javascript') {
    return { success: false, output: '', error: 'Currently only JavaScript is supported for execution.' };
  }

  let stdout = '';
  try {
    const vm = new VM({
      timeout: 5000,
      sandbox: {
        console: {
          log: (...args: any[]) => {
            stdout += args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ') + '\n';
          },
          error: (...args: any[]) => {
            stdout += 'ERROR: ' + args.join(' ') + '\n';
          }
        },
        Math,
        JSON,
        Array,
        Object,
        String,
        Number,
        Date
      }
    });

    const result = vm.run(code);
    
    // If there was no console.log output but the code returned a value, include it
    if (!stdout && result !== undefined) {
      stdout = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
    }

    return {
      success: true,
      output: stdout || 'Code executed successfully with no output.'
    };
  } catch (error: any) {
    return {
      success: false,
      output: stdout,
      error: error.message || 'Unknown execution error'
    };
  }
}
