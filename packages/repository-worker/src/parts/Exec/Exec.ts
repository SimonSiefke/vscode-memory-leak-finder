import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'

interface ExecOptions {
  cwd?: string
  reject?: boolean
  env?: Record<string, string | undefined>
  stdio?: string
}

interface ExecResult {
  exitCode: number
  stderr: string
  stdout: string
}

/**
 * Executes a command with arguments and returns stdout and stderr
 */
export const exec = async (command: string, args: string[], options: ExecOptions = {}): Promise<ExecResult> => {
  const result = await FileSystemWorker.exec(command, args, options)
  return {
    exitCode: result.exitCode || 0,
    stderr: result.stderr || '',
    stdout: result.stdout || '',
  }
}
