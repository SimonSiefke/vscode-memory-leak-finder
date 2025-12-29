import { VError } from '@lvce-editor/verror'
import * as LaunchExecWorker from '../LaunchExecWorker/LaunchExecWorker.ts'

interface ExecOptions {
  cwd?: string
  env?: Record<string, string | undefined>
}

interface ExecResult {
  exitCode: number
  stderr: string
  stdout: string
}

let execWorkerRpc: Awaited<ReturnType<typeof LaunchExecWorker.launchExecWorker>> | undefined

const getExecWorker = async () => {
  if (!execWorkerRpc) {
    execWorkerRpc = await LaunchExecWorker.launchExecWorker()
  }
  return execWorkerRpc
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
