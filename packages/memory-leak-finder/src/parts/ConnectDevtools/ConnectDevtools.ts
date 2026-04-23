import * as Assert from '../Assert/Assert.ts'
import * as GetCombinedMeasure from '../GetCombinedMeasure/GetCombinedMeasure.ts'
import * as GetMeasureRpc from '../GetMeasureRpc/GetMeasureRpc.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as PendingDevtoolsConnectionState from '../PendingDevtoolsConnectionState/PendingDevtoolsConnectionState.ts'

export const connectDevtools = async (
  devtoolsWebSocketUrl: string,
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
  pid: number,
  externalInspectPort?: number,
  externalInspectRuntime: 'bun' | 'node' = 'node',
  deferConnect = false,
): Promise<void> => {
  Assert.string(devtoolsWebSocketUrl)
  Assert.string(electronWebSocketUrl)
  Assert.number(connectionId)
  Assert.string(measureId)
  Assert.number(attachedToPageTimeout)

  if (deferConnect) {
    PendingDevtoolsConnectionState.set(connectionId, {
      attachedToPageTimeout,
      devtoolsWebSocketUrl,
      electronWebSocketUrl,
      externalInspectPort,
      externalInspectRuntime,
      inspectExtensions,
      inspectExtensionsPort,
      inspectPtyHost,
      inspectPtyHostPort,
      inspectSharedProcess,
      inspectSharedProcessPort,
      measureId,
      measureNode,
      pid,
    })
    return
  }

  const measureRpc = await GetMeasureRpc.getMeasureRpc(
    devtoolsWebSocketUrl,
    electronWebSocketUrl,
    attachedToPageTimeout,
    measureNode,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
    externalInspectPort,
    externalInspectRuntime,
  )

  const measure = await GetCombinedMeasure.getCombinedMeasure(measureRpc, measureId, connectionId, pid)
  PendingDevtoolsConnectionState.remove(connectionId)
  MemoryLeakFinderState.set(connectionId, { measure, pid, rpc: measureRpc })
}
