import * as LoadMemoryLeakFinder from '../LoadMemoryLeakFinder/LoadMemoryLeakFinder.js'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.js'
import { VError } from '../VError/VError.js'
import * as WaitForPage from '../WaitForPage/WaitForPage.js'

export const setup = async (connectionId, instanceId) => {
  try {
    const page = await WaitForPage.waitForPage({ index: 0 })
    const session = page.rpc
    const MemoryLeakFinder = await LoadMemoryLeakFinder.loadMemoryLeakFinder()
    const measure = MemoryLeakFinder.combine(MemoryLeakFinder.Measures.MeasureEventListenerCount.create(session))
    MemoryLeakFinderState.set(instanceId, measure)
  } catch (error) {
    throw new VError(error, `Failed to setup memory leak finder`)
  }
}
