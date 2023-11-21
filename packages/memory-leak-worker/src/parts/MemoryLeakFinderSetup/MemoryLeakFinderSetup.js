import * as GetCombinedMeasure from '../GetCombinedMeasure/GetCombinedMeasure.js'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.js'
import { VError } from '../VError/VError.js'
import * as WaitForPage from '../WaitForPage/WaitForPage.js'

export const setup = async (connectionId, instanceId, measureId) => {
  try {
    const page = await WaitForPage.waitForPage({ index: 0 })
    const session = page.rpc
    const scriptMap = Object.create(null)
    const measure = await GetCombinedMeasure.getCombinedMeasure(session, scriptMap, measureId)
    // @ts-ignore
    if (measure.requiresDebugger) {
      const handleScriptParsed = (event) => {
        const { url, scriptId, sourceMapURL } = event.params
        if (!url) {
          return
        }
        scriptMap[scriptId] = {
          url,
          sourceMapUrl: sourceMapURL,
        }
      }
      session.on('Debugger.scriptParsed', handleScriptParsed)
      await session.invoke('Debugger.enable')
    }
    MemoryLeakFinderState.set(instanceId, measure)
  } catch (error) {
    throw new VError(error, `Failed to setup memory leak finder`)
  }
}
