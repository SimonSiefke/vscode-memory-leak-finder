import * as AddStackTracesToEventListeners from '../AddStackTracesToEventListeners/AddStackTracesToEventListeners.js'
import * as DeduplicateEventListeners from '../DeduplicateEventListeners/DeduplicateEventListeners.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetEventListenerKey from '../GetEventListenerKey/GetEventListenerKey.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'
import * as GetEventListeners from '../GetEventListeners/GetEventListeners.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as StartTrackEventListenerStackTraces from '../StartTrackEventListenerStackTraces/StartTrackEventListenerStackTraces.js'
import * as StopTrackingEventListenerStackTraces from '../StopTrackingEventListenerStackTraces/StopTrackingEventListenerStackTraces.js'

export const id = MeasureId.EventListenersWithStackTrace

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
  await StartTrackEventListenerStackTraces.startTrackingEventListenerStackTraces(session, objectGroup)
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptMap)
  return result
}

export const stop = async (session, objectGroup, scriptMap) => {
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptMap)
  const resultWithStackTraces = await AddStackTracesToEventListeners.addStackTracesToEventListeners(session, result)
  await StopTrackingEventListenerStackTraces.stopTrackingEventListenerStackTraces(session, objectGroup)
  await DevtoolsProtocolRuntime.releaseObjectGroup(session, {
    objectGroup,
  })
  return resultWithStackTraces
}

export const compare = async (before, after) => {
  const map = Object.create(null)
  for (const listener of before) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    map[key] ||= 0
    map[key]++
  }
  const leaked = []
  for (const listener of after) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    if (!map[key]) {
      leaked.push(listener)
    } else {
      map[key]--
    }
  }
  const deduplicatedEventListeners = DeduplicateEventListeners.deduplicateEventListeners(leaked)
  const classNames = false
  const cleanLeakedEventListeners = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(
    deduplicatedEventListeners,
    classNames,
  )
  return cleanLeakedEventListeners
}

export const isLeak = (leakedEventListeners) => {
  return leakedEventListeners.length > 0
}
