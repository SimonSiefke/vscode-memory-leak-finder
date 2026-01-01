import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as GetExecWorkerUrl from '../GetExecWorkerUrl/GetExecWorkerUrl.ts'

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

export const launchExecWorker = async () => {
  const url = GetExecWorkerUrl.getExecWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path: url,
    stdio: 'inherit',
  })
  return {
    async exec(command: string, args: readonly string[], options: ExecOptions = {}): Promise<ExecResult> {
      const result = (await rpc.invoke('exec.exec', command, args, options)) as ExecResult
      return result
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
