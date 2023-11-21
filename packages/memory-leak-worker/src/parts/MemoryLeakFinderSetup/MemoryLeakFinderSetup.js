import * as GetCombinedMeasure from '../GetCombinedMeasure/GetCombinedMeasure.js'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.js'
import * as ScriptState from '../ScriptState/ScriptState.js'
import { VError } from '../VError/VError.js'
import * as WaitForPage from '../WaitForPage/WaitForPage.js'

const handleScriptParsed = (event) => {
  const { url, scriptId, sourceMapURL } = event.params
  if (!url) {
    return
  }
  const scriptMap = ScriptState.get(event.sessionId)
  scriptMap[scriptId] = {
    url,
    sourceMapUrl: sourceMapURL,
  }
}

export const setup = async (connectionId, instanceId, measureId) => {
  try {
    const page = await WaitForPage.waitForPage({ index: 0 })
    const session = page.rpc
    const sessionId = session.sessionId
    if (!ScriptState.get(sessionId)) {
      ScriptState.set(sessionId, Object.create(null))
    }
    const scriptMap = ScriptState.get(sessionId)
    const measure = await GetCombinedMeasure.getCombinedMeasure(session, scriptMap, measureId)
    // @ts-ignore
    if (measure.requiresDebugger) {
      session.on('Debugger.scriptParsed', handleScriptParsed)
      await session.invoke('Debugger.enable')
    }
    MemoryLeakFinderState.set(instanceId, measure)
  } catch (error) {
    throw new VError(error, `Failed to setup memory leak finder`)
  }
}
