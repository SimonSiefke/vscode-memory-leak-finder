import * as ExecWorker from '../ExecWorker/ExecWorker.ts'

interface ExecOptions {
  readonly cwd?: string
  readonly reject?: boolean
}

interface ExecResult {
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string
}

export const exec = async (command: string, args: readonly string[], options: ExecOptions = {}): Promise<ExecResult> => {
<<<<<<< HEAD
  const execaOptions: { cwd?: string; reject?: boolean } = {}
  if (options.cwd !== undefined) {
    execaOptions.cwd = options.cwd
  }
  if (options.reject !== undefined) {
    execaOptions.reject = options.reject
  }
  const result = await execa(command, args, execaOptions)
  return {
    exitCode: result.exitCode || 0,
    stderr: result.stderr || '',
    stdout: result.stdout || '',
  }
=======
  await using execWorker = await ExecWorker.launchExecWorker()
  const result = await execWorker.exec(command, args, options)
  return result
>>>>>>> origin/main
}
