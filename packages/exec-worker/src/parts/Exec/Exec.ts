import { execa } from 'execa'

interface ExecOptions {
  readonly cwd?: string
  readonly env?: Record<string, string | undefined>
  readonly reject?: boolean
  readonly stdio?: any
}

interface ExecResult {
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string
}

export const exec = async (command: string, args: readonly string[], options: ExecOptions = {}): Promise<ExecResult> => {
  const result = await execa(command, args, { ...options, reject: options.reject })
  return {
    exitCode: result.exitCode || 0,
    stderr: result.stderr || '',
    stdout: result.stdout || '',
  }
}
