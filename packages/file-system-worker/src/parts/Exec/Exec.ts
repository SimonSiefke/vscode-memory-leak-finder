import { execa } from 'execa'

interface ExecOptions {
  readonly cwd?: string
  readonly reject?: boolean
}

interface ExecResult {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number
}

export const exec = async (command: string, args: readonly string[], options: ExecOptions = {}): Promise<ExecResult> => {
  const result = await execa(command, args, { ...options, reject: options.reject })
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.exitCode || 0,
  }
}
