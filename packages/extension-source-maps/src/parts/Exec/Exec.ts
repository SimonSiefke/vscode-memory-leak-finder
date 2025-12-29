import { execa } from 'execa'
import { VError } from '@lvce-editor/verror'

interface ExecOptions {
  cwd?: string
  env?: Record<string, string | undefined>
}

interface ExecResult {
  exitCode: number
  stderr: string
  stdout: string
}

export const exec = async (command: string, args: string[], options: ExecOptions = {}): Promise<ExecResult> => {
  try {
    const result = await execa(command, args, {
      cwd: options.cwd,
      env: options.env,
      reject: false,
    })
    return {
      exitCode: result.exitCode || 0,
      stderr: result.stderr || '',
      stdout: result.stdout || '',
    }
  } catch (error) {
    throw new VError(error, `Failed to execute command: ${command} ${args.join(' ')}`)
  }
}
