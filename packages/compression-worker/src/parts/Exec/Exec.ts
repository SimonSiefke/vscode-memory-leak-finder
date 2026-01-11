import * as ExecWorker from '../ExecWorker/ExecWorker.ts'

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
  await using execWorker = await ExecWorker.launchExecWorker()
  const result = await execWorker.exec(command, args, options)
  return result
}
