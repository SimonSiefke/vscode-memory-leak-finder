import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.js'
import * as PageObjectState from '../PageObjectState/PageObjectState.js'
import { VError } from '../VError/VError.js'

const loadMemoryLeakFinder = async () => {
  const MemoryLeakFinder = await import('../../../../memory-leak-finder/src/index.js')
  return MemoryLeakFinder
}

export const setup = async (connectionId, instanceId) => {
  try {
    const firstWindow = PageObjectState.getFirstWindow(connectionId)
    const session = firstWindow.rpc
    const MemoryLeakFinder = await loadMemoryLeakFinder()
    const measure = MemoryLeakFinder.combine(MemoryLeakFinder.Measures.MeasureEventListenerCount.create(session))
    MemoryLeakFinderState.set(instanceId, measure)
  } catch (error) {
    throw new VError(error, `Failed to setup memory leak finder`)
  }
}
