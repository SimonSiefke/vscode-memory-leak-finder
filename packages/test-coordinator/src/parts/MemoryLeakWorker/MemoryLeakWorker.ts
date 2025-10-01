import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as Assert from '../Assert/Assert.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as MemoryLeakWorkerUrl from '../MemoryLeakWorkerUrl/MemoryLeakWorkerUrl.ts'
import * as LogMemoryUsage from '../LogMemoryUsage/LogMemoryUsage.ts'

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
) => {
  Assert.string(devtoolsWebsocketUrl)
  LogMemoryUsage.logMemoryUsage(`launching memory-leak-finder worker for connection ${connectionId}`)
  const rpc = await NodeWorkerRpcParent.create({
    path: MemoryLeakWorkerUrl.memoryLeakWorkerUrl,
    stdio: 'inherit',
    commandMap: CommandMapRef.commandMapRef,
  })
  LogMemoryUsage.logMemoryUsage(`memory-leak-finder worker created for connection ${connectionId}`)
  
  // Add disposal logging
  const originalDispose = rpc.dispose.bind(rpc)
  rpc.dispose = async () => {
    LogMemoryUsage.logMemoryUsage(`disposing memory-leak-finder worker for connection ${connectionId}`)
    await originalDispose()
    LogMemoryUsage.logMemoryUsage(`memory-leak-finder worker disposed for connection ${connectionId}`)
  }
  
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
  )
  LogMemoryUsage.logMemoryUsage(`memory-leak-finder worker connected for connection ${connectionId}`)
  return rpc
}
