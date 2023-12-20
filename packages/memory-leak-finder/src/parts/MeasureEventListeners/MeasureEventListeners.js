import * as CompareEventListeners from '../CompareEventListeners/CompareEventListeners.js'
import * as GetEventListeners from '../GetEventListeners/GetEventListeners.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

export const id = MeasureId.EventListeners

/**
 *
 * @param {any} session
 */

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
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptMap)
  return result
}

export const stop = async (session, objectGroup, scriptMap, handleScriptParsed) => {
  session.off('Debugger.scriptParsed', handleScriptParsed)
  await session.invoke('Debugger.disable')
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptMap)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const compare = CompareEventListeners.compareEventListeners

export const isLeak = (leakedEventListeners) => {
  return leakedEventListeners.length > 0
}
