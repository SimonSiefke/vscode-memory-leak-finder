import { VError } from '@lvce-editor/verror'
import * as LaunchExecWorker from '../LaunchExecWorker/LaunchExecWorker.ts'

interface ExecOptions {
  readonly cwd?: string
  readonly env?: Record<string, string | undefined>
}

interface ExecResult {
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string
}

export const exec = async (command: string, args: string[], options: ExecOptions = {}): Promise<ExecResult> => {
  try {
    await using rpc = await LaunchExecWorker.launchExecWorker()
    const result = (await rpc.invoke('exec.exec', command, args, options)) as ExecResult
    return result
  } catch (error) {
    throw new VError(error, `Failed to execute command: ${command} ${args.join(' ')}`)
  }
}
