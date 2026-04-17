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
  measureNodeSubprocess: boolean,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
  inspectPtyHostPort: number,
  inspectSharedProcessPort: number,
  inspectExtensionsPort: number,
  pid: number,
  externalInspectPort: number,
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
    measureNode || measureNodeSubprocess,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
    pid,
    externalInspectPort || undefined,
  )
  return rpc
}
