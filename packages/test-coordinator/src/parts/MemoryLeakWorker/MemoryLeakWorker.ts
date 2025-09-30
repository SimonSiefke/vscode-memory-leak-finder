import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as Assert from '../Assert/Assert.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as MemoryLeakWorkerUrl from '../MemoryLeakWorkerUrl/MemoryLeakWorkerUrl.ts'

export const startWorker = async (
  devtoolsWebsocketUrl: string,
  electronWebSocketUrl: string,
  connectionId: number,
  measureId: string,
  attachedToPageTimeout: number,
) => {
  Assert.string(devtoolsWebsocketUrl)
  const rpc = await NodeWorkerRpcParent.create({
    path: MemoryLeakWorkerUrl.memoryLeakWorkerUrl,
    stdio: 'inherit',
    commandMap: CommandMapRef.commandMapRef,
  })
  await rpc.invoke(
    'ConnectDevtools.connectDevtools',
    devtoolsWebsocketUrl,
    electronWebSocketUrl,
    connectionId,
    measureId,
    attachedToPageTimeout,
  )
  return rpc
}
