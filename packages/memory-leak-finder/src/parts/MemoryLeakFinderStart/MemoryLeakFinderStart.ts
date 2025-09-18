import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as WaitForCrash from '../WaitForCrash/WaitForCrash.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import * as MeasureNodeProcesses from '../MeasureNodeProcesses/MeasureNodeProcesses.ts'

const doStart = async (connectionId: number): Promise<any> => {
  const state = MemoryLeakFinderState.get(connectionId)
  if (!state) {
    throw new Error(`no measure found`)
  }
  const { measure, measureNode } = state
  const result = await measure.start()

  if (measureNode) {
    const browserSession = SessionState.getSession('browser')
    if (browserSession) {
      // Store Node process measurements for later comparison
      const nodeMeasurements = await MeasureNodeProcesses.measureNodeProcesses(
        browserSession.rpc,
        measure.id,
        'before',
        'before'
      )
      result.nodeMeasurements = nodeMeasurements
    }
  }

  return result
}

export const start = async (connectionId: number, electronTargetId: string): Promise<any> => {
  const crashInfo = WaitForCrash.waitForCrash(electronTargetId)
  const resultPromise = doStart(connectionId)
  const intermediateResult = await Promise.race([crashInfo.promise, resultPromise])
  if (intermediateResult && intermediateResult.crashed) {
    throw new Error('target crashed')
  }
  crashInfo.cleanup()
  return intermediateResult
}
