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
  inspectPtyHost: boolean,
  inspectPtyHostPort: number,
  inspectSharedProcessPort: number,
  inspectExtensionsPort: number,
  pid: number,
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
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
  )

  const measure = await GetCombinedMeasure.getCombinedMeasure(measureRpc, measureId, connectionId, pid)
  MemoryLeakFinderState.set(connectionId, { measure, rpc: measureRpc, pid })
}
