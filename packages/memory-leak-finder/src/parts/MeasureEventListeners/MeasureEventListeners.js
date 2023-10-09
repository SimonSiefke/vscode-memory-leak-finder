import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetEventListenerKey from '../GetEventListenerKey/GetEventListenerKey.js'
import * as GetEventListeners from '../GetEventListeners/GetEventListeners.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.EventListeners

/**
 *
 * @param {any} session
 */

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  const result = await GetEventListeners.getEventListeners(session, objectGroup)
  return result
}

export const stop = async (session, objectGroup) => {
  const result = await GetEventListeners.getEventListeners(session, objectGroup)
  await DevtoolsProtocolRuntime.releaseObjectGroup(session, {
    objectGroup,
  })
  return result
}

export const compare = (before, after) => {
  const beforeArray = Object.values(before).flat(1)
  const afterArray = Object.values(after).flat(1)
  const map = Object.create(null)
  for (const listener of beforeArray) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    map[key] ||= 0
    map[key]++
  }
  const leaked = []
  for (const listener of afterArray) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    if (!map[key]) {
      leaked.push(listener)
    } else {
      map[key]--
    }
  }
  return leaked
}
