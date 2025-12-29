import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getInitializationWorkerUrl } from '../GetInitializationWorkerUrl/GetInitializationWorkerUrl.ts'

export const launchInitializationWorker = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: getInitializationWorkerUrl(),
    stdio: 'inherit',
  })
  return {
    invoke(method: string, ...params: unknown[]) {
      return rpc.invoke(method, ...params)
    },
    invokeAndTransfer(method: string, ...params: unknown[]) {
      return rpc.invokeAndTransfer(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
