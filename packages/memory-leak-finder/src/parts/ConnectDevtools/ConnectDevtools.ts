import * as PendingDevtoolsConnectionState from '../PendingDevtoolsConnectionState/PendingDevtoolsConnectionState.ts'
import * as Assert from '../Assert/Assert.ts'
import * as GetCombinedMeasure from '../GetCombinedMeasure/GetCombinedMeasure.ts'
import * as GetMeasureRpc from '../GetMeasureRpc/GetMeasureRpc.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'

export const connectDevtools = async (
  devtoolsWebSocketUrl: string,
  electronWebSocketUrl: string,
  connectionId: number,
  measureId: string,
  attachedToPageTimeout: number,
  measureNode: boolean,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectIntegratedBrowser: boolean,
  inspectPtyHost: boolean,
  inspectPtyHostPort: number,
  inspectSharedProcessPort: number,
  inspectExtensionsPort: number,
  pid: number,
  excludedTargetIds: readonly string[] = [],
  inspectExternalRuntime = false,
  externalRuntimeInspectPort = 0,
  externalRuntimeName = '',
  deferConnect = false,
): Promise<void> => {
  Assert.string(devtoolsWebSocketUrl)
  Assert.string(electronWebSocketUrl)
  Assert.number(connectionId)
  Assert.string(measureId)
  Assert.number(attachedToPageTimeout)

  if (deferConnect) {
    PendingDevtoolsConnectionState.set(connectionId, {
      devtoolsWebSocketUrl,
      electronWebSocketUrl,
      measureId,
      attachedToPageTimeout,
      measureNode,
      inspectSharedProcess,
      inspectExtensions,
      inspectIntegratedBrowser,
      inspectPtyHost,
      inspectPtyHostPort,
      inspectSharedProcessPort,
      inspectExtensionsPort,
      pid,
      excludedTargetIds,
      inspectExternalRuntime,
      externalRuntimeInspectPort,
      externalRuntimeName,
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
    inspectIntegratedBrowser,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
    excludedTargetIds,
    inspectExternalRuntime,
    externalRuntimeInspectPort,
    externalRuntimeName,
  )

  const measure = await GetCombinedMeasure.getCombinedMeasure(measureRpc, measureId, connectionId, pid, electronWebSocketUrl)
  PendingDevtoolsConnectionState.remove(connectionId)
  MemoryLeakFinderState.set(connectionId, { measure, pid, rpc: measureRpc })
}
