import * as CompareDisposablesWithLocation from '../CompareDisposablesWithLocation/CompareDisposablesWithLocation.js'
import * as GetDisposablesWithLocation from '../GetDisposablesWithLocation/GetDisposablesWithLocation.js'
import * as IsLeakDisposables from '../IsLeakDisposables/IsLeakDisposables.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

// TODO
// 1. query all objects
// 2. check for each object if it has a dispose method to find all disposables
// 3. for each disposable, if object has a constructor, return constructor
//  location else location of disposable function
// 4. group disposables by function location (constructor location / disposable function location)
// 5. sort grouped disposables by count

export const id = MeasureId.Disposables

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

export const compare = CompareDisposablesWithLocation.compareDisposablesWithLocation

export const isLeak = IsLeakDisposables.isLeakDisposables
