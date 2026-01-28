import { NodeForkedProcessRpcParent } from '@lvce-editor/rpc'
import * as GetFunctionTrackerUrl from '../GetFunctionTrackerUrl/GetFunctionTrackerUrl.ts'

export const launchFunctionTrackerWorker = async () => {
  const url = GetFunctionTrackerUrl.getFunctionTrackerUrl()
  const rpc = await NodeForkedProcessRpcParent.create({
    commandMap: {},
    execArgv: ['--max-old-space-size=8192'],
    path: url,
    stdio: 'inherit',
  })
  return {
    invoke(method: string, ...params: unknown[]) {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
