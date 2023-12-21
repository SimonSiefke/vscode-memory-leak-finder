import * as CompareDisposablesWithLocationDifference from '../CompareDisposablesWithLocationDifference/CompareDisposablesWithLocationDifference.js'
import * as GetDisposablesWithLocation from '../GetDisposablesWithLocation/GetDisposablesWithLocation.js'
import * as IsLeakDisposables from '../IsLeakDisposables/IsLeakDisposables.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.DisposableDifference

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

export const start = async (session, objectGroup, scriptMap) => {
  await session.invoke('Debugger.enable')
  return GetDisposablesWithLocation.getDisposablesWithLocation(session, objectGroup, scriptMap)
}

export const stop = async (session, objectGroup, scriptMap, handleScriptParsed) => {
  session.off('Debugger.scriptParsed', handleScriptParsed)
  await session.invoke('Debugger.disable')
  const result = await GetDisposablesWithLocation.getDisposablesWithLocation(session, objectGroup, scriptMap)
  return {
    result,
    scriptMap,
  }
}

export const compare = CompareDisposablesWithLocationDifference.compareDisposablesWithLocationDifference

export const isLeak = IsLeakDisposables.isLeakDisposables
