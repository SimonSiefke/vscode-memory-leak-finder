import * as CompareEventListeners from '../CompareEventListeners/CompareEventListeners.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetEventListeners from '../GetEventListeners/GetEventListeners.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.EventListeners

export const requiresDebugger = true

/**
 *
 * @param {any} session
 */

export const create = (session, scriptMap) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup, scriptMap]
}

export const start = async (session, objectGroup, scriptMap) => {
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptMap)
  return result
}

export const stop = async (session, objectGroup, scriptMap) => {
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptMap)
  await DevtoolsProtocolRuntime.releaseObjectGroup(session, {
    objectGroup,
  })
  return result
}

export const compare = CompareEventListeners.compareEventListeners

export const isLeak = (leakedEventListeners) => {
  return leakedEventListeners.length > 0
}
