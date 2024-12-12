import * as GetCombinedMeasure from '../GetCombinedMeasure/GetCombinedMeasure.js'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.js'
import { VError } from '../VError/VError.js'
import * as WaitForPage from '../WaitForPage/WaitForPage.js'

export const setup = async (connectionId, instanceId, measureId) => {
  try {
    const page = await WaitForPage.waitForPage({ index: 0 })
    const session = page.rpc
    console.log({ page })
    const measure = await GetCombinedMeasure.getCombinedMeasure(session, measureId)
    MemoryLeakFinderState.set(instanceId, measure)
  } catch (error) {
    throw new VError(error, `Failed to setup memory leak finder`)
  }
}
