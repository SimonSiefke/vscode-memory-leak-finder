import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getProxyWorkerUrl } from '../GetProxyWorkerUrl/GetProxyWorkerUrl.ts'

export const launchProxyWorker = async (): Promise<{
  invoke: (method: string, ...params: unknown[]) => Promise<unknown>
  dispose: () => Promise<void>
}> => {
  const url = getProxyWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    execArgv: [],
    commandMap: {},
  })
  return rpc
}
