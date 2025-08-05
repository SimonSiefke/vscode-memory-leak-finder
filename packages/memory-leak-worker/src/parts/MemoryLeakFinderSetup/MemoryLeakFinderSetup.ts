import * as GetCombinedMeasure from '../GetCombinedMeasure/GetCombinedMeasure.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import { VError } from '../VError/VError.ts'
import * as WaitForPage from '../WaitForPage/WaitForPage.ts'

export const setup = async (connectionId: string, instanceId: string, measureId: string): Promise<any> => {
  try {
    const page = await WaitForPage.waitForPage({ index: 0 })
    const session = page.rpc
    const measure = await GetCombinedMeasure.getCombinedMeasure(session, measureId)
    MemoryLeakFinderState.set(instanceId, measure)
    return {
      targetId: page.targetId,
    }
  } catch (error) {
    throw new VError(error, `Failed to setup memory leak finder`)
  }
}
