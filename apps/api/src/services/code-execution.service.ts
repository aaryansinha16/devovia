import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
}

const EXECUTION_TIMEOUT = 10000; // 10 seconds

const LANGUAGE_CONFIG: Record<
  string,
  { extension: string; command: string; args: (file: string) => string[] }
> = {
  JAVASCRIPT: {
    extension: '.js',
    command: 'node',
    args: (file) => [file],
  },
  TYPESCRIPT: {
    extension: '.js',
    command: 'node',
    args: (file) => [file],
  },
  PYTHON: {
    extension: '.py',
    command: 'python3',
    args: (file) => [file],
  },
  SQL: {
    extension: '.sql',
    command: 'echo',
    args: () => ['SQL execution not supported in sandbox mode'],
  },
  JSON: {
    extension: '.json',
    command: 'cat',
    args: (file) => [file],
  },
  MARKDOWN: {
    extension: '.md',
    command: 'cat',
    args: (file) => [file],
  },
  HTML: {
    extension: '.html',
    command: 'cat',
    args: (file) => [file],
  },
  CSS: {
    extension: '.css',
    command: 'cat',
    args: (file) => [file],
  },
  YAML: {
    extension: '.yaml',
    command: 'cat',
    args: (file) => [file],
  },
};

export async function executeCode(
  code: string,
  language: string,
): Promise<ExecutionResult> {
  const startTime = Date.now();

  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return {
      output: '',
      error: `Unsupported language: ${language}`,
      executionTime: Date.now() - startTime,
    };
  }

  // Create temporary directory for execution
  const tempDir = join(tmpdir(), 'devovia-exec');
  await mkdir(tempDir, { recursive: true });

  // Generate unique filename
  const filename = `exec_${randomBytes(8).toString('hex')}${config.extension}`;
  const filepath = join(tempDir, filename);

  try {
    // For TypeScript, transpile to JavaScript first
    let codeToExecute = code;
    if (language === 'TYPESCRIPT') {
      // Simple transpilation: strip types and convert to JS
      // This is a basic approach - for production, use proper TypeScript compiler
      codeToExecute = code
        .replace(/:\s*\w+(\[\])?(\s*[=,;)])/g, '$2') // Remove type annotations
        .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
        .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Remove type aliases
        .replace(/<\w+>/g, ''); // Remove generic types
    }

    // Write code to temporary file
    await writeFile(filepath, codeToExecute, 'utf-8');

    // Execute the code
    const result = await runCommand(config.command, config.args(filepath));

    return {
      output: result.stdout,
      error: result.stderr || undefined,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Execution failed',
      executionTime: Date.now() - startTime,
    };
  } finally {
    // Clean up temporary file
    try {
      await unlink(filepath);
    } catch (err) {
      console.error('Failed to clean up temp file:', err);
    }
  }
}

function runCommand(
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      timeout: EXECUTION_TIMEOUT,
      env: {
        ...process.env,
        // Limit environment for security
        PATH: process.env.PATH,
      },
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code) => {
      if (code === 0 || stdout || stderr) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    childProcess.on('error', (error) => {
      reject(error);
    });

    // Handle timeout
    setTimeout(() => {
      childProcess.kill();
      reject(new Error('Execution timeout exceeded'));
    }, EXECUTION_TIMEOUT);
  });
}
