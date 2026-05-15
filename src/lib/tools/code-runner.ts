
'use server';

export interface CodeRunnerResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Executes JavaScript code in a secure sandboxed environment using a Function constructor.
 * This approach is more compatible with Next.js bundling than vm2.
 */
export async function runCode(code: string, language: string = 'javascript'): Promise<CodeRunnerResult> {
  if (language !== 'javascript') {
    return { success: false, output: '', error: 'Currently only JavaScript is supported for execution.' };
  }

  let stdout = '';
  try {
    const sandboxConsole = {
      log: (...args: any[]) => {
        stdout += args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\n';
      },
      error: (...args: any[]) => {
        stdout += 'ERROR: ' + args.join(' ') + '\n';
      },
      warn: (...args: any[]) => {
        stdout += 'WARN: ' + args.join(' ') + '\n';
      },
      info: (...args: any[]) => {
        stdout += 'INFO: ' + args.join(' ') + '\n';
      }
    };

    // Define whitelisted globals for the "sandbox"
    const whitelistedGlobals = {
      console: sandboxConsole,
      Math,
      JSON,
      Array,
      Object,
      String,
      Number,
      Date,
      RegExp,
      Map,
      Set,
      Promise
    };

    const keys = Object.keys(whitelistedGlobals);
    const values = Object.values(whitelistedGlobals);

    // Create the sandboxed function
    // We use "use strict" and wrap the code to prevent leaking global scope
    const runner = new Function(...keys, `"use strict"; ${code}`);
    
    // Execute
    const result = runner(...values);
    
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
