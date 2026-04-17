import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as PendingDevtoolsConnectionState from '../PendingDevtoolsConnectionState/PendingDevtoolsConnectionState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'

const doStart = async (connectionId: number): Promise<any> => {
  let state = MemoryLeakFinderState.get(connectionId)
  if (!state) {
    const pending = PendingDevtoolsConnectionState.get(connectionId)
    if (pending) {
      await ConnectDevtools.connectDevtools(
        pending.devtoolsWebSocketUrl,
        pending.electronWebSocketUrl,
        connectionId,
        pending.measureId,
        pending.attachedToPageTimeout,
        pending.measureNode,
        pending.inspectSharedProcess,
        pending.inspectExtensions,
        pending.inspectPtyHost,
        pending.inspectPtyHostPort,
        pending.inspectSharedProcessPort,
        pending.inspectExtensionsPort,
        pending.pid,
        pending.externalInspectPort,
      )
      state = MemoryLeakFinderState.get(connectionId)
    }
  }
  if (!state) {
    throw new Error(`no measure found`)
  }
  const { measure, rpc } = state
  if (rpc && typeof rpc.connectionClosed === 'function' && rpc.connectionClosed()) {
    return { connectionClosed: true }
  }
  const result = await measure.start()
  return result
}

export const start = async (connectionId: number, electronTargetId: string): Promise<any> => {
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStart(connectionId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (intermediateResult && intermediateResult.crashed) {
    throw new Error('target crashed')
  }
  crashInfo.dispose()
  if (intermediateResult && intermediateResult.connectionClosed) {
    return { connectionClosed: true }
  }
  MemoryLeakFinderState.update(connectionId, { before: intermediateResult })
  return intermediateResult
}
