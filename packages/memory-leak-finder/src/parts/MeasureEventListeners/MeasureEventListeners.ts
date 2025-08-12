import * as CompareEventListeners from '../CompareEventListeners/CompareEventListeners.ts'
import * as GetEventListeners from '../GetEventListeners/GetEventListeners.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'

export const id = MeasureId.EventListeners

/**
 *
 * @param {any} session
 */

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptHandler.scriptMap)
  return result
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptHandler.scriptMap)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareEventListeners.compareEventListeners

export const isLeak = (leakedEventListeners) => {
  return leakedEventListeners.length > 0
}
