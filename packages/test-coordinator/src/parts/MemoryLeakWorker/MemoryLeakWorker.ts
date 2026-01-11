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
  measureNode: boolean,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
  inspectPtyHostPort: number,
  inspectSharedProcessPort: number,
  inspectExtensionsPort: number,
) => {
  Assert.string(devtoolsWebsocketUrl)
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: CommandMapRef.commandMapRef,
    path: MemoryLeakWorkerUrl.memoryLeakWorkerUrl,
    stdio: 'inherit',
  })
  await rpc.invoke(
    'ConnectDevtools.connectDevtools',
    devtoolsWebsocketUrl,
    electronWebSocketUrl,
    connectionId,
    measureId,
    attachedToPageTimeout,
    measureNode,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
  )
  return rpc
}
