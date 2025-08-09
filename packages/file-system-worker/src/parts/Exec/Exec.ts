import { execa } from 'execa'

interface ExecOptions {
  cwd?: string
}

interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
}

export const exec = async (command: string, args: string[], options: ExecOptions = {}): Promise<ExecResult> => {
  const result = await execa(command, args, options)
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.exitCode || 0,
  }
}
