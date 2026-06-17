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
): Promise<void> => {
  Assert.string(devtoolsWebSocketUrl)
  Assert.string(electronWebSocketUrl)
  Assert.number(connectionId)
  Assert.string(measureId)
  Assert.number(attachedToPageTimeout)

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
  )

  const measure = await GetCombinedMeasure.getCombinedMeasure(measureRpc, measureId, connectionId, pid)
  MemoryLeakFinderState.set(connectionId, { measure, pid, rpc: measureRpc })
}
