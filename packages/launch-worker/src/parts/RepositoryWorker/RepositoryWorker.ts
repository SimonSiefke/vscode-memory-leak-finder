import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getRepositoryWorkerUrl } from '../GetRepositoryWorkerUrl/GetRepositoryWorkerUrl.ts'

export const launch = async () => {
  const url = getRepositoryWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path: url,
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
