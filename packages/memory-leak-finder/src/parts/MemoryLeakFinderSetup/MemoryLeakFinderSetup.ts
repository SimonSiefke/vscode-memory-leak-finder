import * as GetCombinedMeasure from '../GetCombinedMeasure/GetCombinedMeasure.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import { VError } from '../VError/VError.ts'
import * as WaitForPage from '../WaitForPage/WaitForPage.ts'
import * as RunThresholdState from '../RunThresholdState/RunThresholdState.ts'

export const setup = async (connectionId: string, instanceId: string, measureId: string, runs: number): Promise<any> => {
  try {
    const page = await WaitForPage.waitForPage({ index: 0 })
    const session = page.rpc
    const measure = await GetCombinedMeasure.getCombinedMeasure(session, measureId)
    MemoryLeakFinderState.set(instanceId, measure)
    if (Number.isFinite(runs) && runs > 0) {
      RunThresholdState.set(runs)
    } else {
      RunThresholdState.set(0)
    }
    return {
      targetId: page.targetId,
    }
  } catch (error) {
    throw new VError(error, `Failed to setup memory leak finder`)
  }
}
