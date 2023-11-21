import * as GetMutationObserverCount from '../GetMutationObserverCount/GetMutationObserverCount.js'
import * as GetMutationObserversWithStackTraces from '../GetMutationObserversWithStackTraces/GetMutationObserversWithStackTraces.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as StartTrackingMutationObserverStackTraces from '../StartTrackingMutationObserverStackTraces/StartTrackingMutationObserverStackTraces.js'
import * as StopTrackingMutationObserverStackTraces from '../StopTrackingMutationObserverStackTraces/StopTrackingMutationObserverStackTraces.js'
import * as PrettifyConstructorStackTracesWithSourceMap from '../PrettifyConstructorStackTracesWithSourceMap/PrettifyConstructorStackTracesWithSourceMap.js'

export const id = MeasureId.MutationObserversWithStackTracesWithSourceMaps

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptMap = Object.create(null)
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
  return [session, objectGroup, scriptMap, handleScriptParsed]
}

export const start = async (session, objectGroup) => {
  await session.invoke('Debugger.enable')
  await StartTrackingMutationObserverStackTraces.startTrackingMutationObserverStackTraces(session, objectGroup)
  return GetMutationObserverCount.getMutationObserverCount(session)
}

export const stop = async (session, objectGroup, scriptMap, handleScriptParsed) => {
  session.off('Debugger.scriptParsed', handleScriptParsed)
  await session.invoke('Debugger.disable')
  const added = await GetMutationObserversWithStackTraces.getMutationObserversWithStackTraces(session, objectGroup)
  await StopTrackingMutationObserverStackTraces.stopTrackingMutationObserverStackTraces(session, objectGroup)
  const pretty = await PrettifyConstructorStackTracesWithSourceMap.prettifyConstructorStackTracesWithSourceMap(added, scriptMap)
  // console.log({ scriptMap, added })
  return pretty
}

export const compare = (before, after) => {
  return after
}

export const isLeak = (leaked) => {
  return leaked.length > 0
}
