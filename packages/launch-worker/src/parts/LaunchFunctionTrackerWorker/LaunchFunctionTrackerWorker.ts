import { NodeForkedProcessRpcParent } from '@lvce-editor/rpc'
import { getFunctionTrackerUrl } from '../GetFunctionTrackerUrl/GetFunctionTrackerUrl.ts'

export const launchFunctionTrackerWorker = async () => {
  const rpc = await NodeForkedProcessRpcParent.create({
    commandMap: {},
    execArgv: ['--max-old-space-size=8192'],
    path: getFunctionTrackerUrl(),
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
