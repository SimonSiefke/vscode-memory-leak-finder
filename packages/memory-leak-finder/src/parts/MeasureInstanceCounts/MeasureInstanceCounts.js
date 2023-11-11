import * as GetInstanceCounts from '../GetInstanceCounts/GetInstanceCounts.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as CompareInstanceCounts from '../CompareInstanceCounts/CompareInstanceCounts.js'

export const id = MeasureId.InstanceCounts

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
  return GetInstanceCounts.getInstanceCounts(session, objectGroup, scriptMap)
}

export const stop = async (session, objectGroup, scriptMap, handleScriptParsed) => {
  session.off('Debugger.scriptParsed', handleScriptParsed)
  await session.invoke('Debugger.disable')
  return GetInstanceCounts.getInstanceCounts(session, objectGroup, scriptMap)
}

export const compare = CompareInstanceCounts.compareInstanceCounts
