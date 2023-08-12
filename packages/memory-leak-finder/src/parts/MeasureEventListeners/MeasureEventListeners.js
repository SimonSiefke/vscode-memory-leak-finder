import * as GetEventListeners from '../GetEventListeners/GetEventListeners.js'
import * as GetEventListenerKey from '../GetEventListenerKey/GetEventListenerKey.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as RemoveObjectIds from '../RemoveObjectIds/RemoveObjectIds.js'
import * as RemovePlaywrightListeners from '../RemovePlaywrightListeners/RemovePlaywrightListeners.js'
import { DevtoolsProtocolRuntime } from '@vscode-memory-leak-finder/devtools-protocol'

export const id = MeasureId.EventListeners

/**
 *
 * @param {import('@playwright/test').CDPSession} session
 */

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  const result = await GetEventListeners.getEventListeners(session, objectGroup)
  return RemoveObjectIds.removeObjectIds(RemovePlaywrightListeners.removePlaywrightListeners(result))
}

export const stop = async (session, objectGroup) => {
  const result = await GetEventListeners.getEventListeners(session, objectGroup)
  await DevtoolsProtocolRuntime.releaseObjectGroup(session, {
    objectGroup,
  })
  return RemoveObjectIds.removeObjectIds(RemovePlaywrightListeners.removePlaywrightListeners(result))
}

export const compare = (before, after) => {
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
  return leaked
}
