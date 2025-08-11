import { VError } from '../VError/VError.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'

const state = {
  /**
   * @type {any}
   */
  events: [],
  /**
   * @type {any}
   */
  callbacks: [],
}

export const addEvent = (event) => {
  state.events.push(event)
  for (const callback of state.callbacks) {
    for (const event of state.events) {
      if (event.frameId === callback.frameId && event.name === callback.name) {
        callback.resolve()
        // TODO remove callback
      }
    }
  }
}

export const waitForEvent = async ({ frameId, name, timeout = TimeoutConstants.PageEvent }) => {
  try {
    for (const event of state.events) {
      if (event.frameId === frameId && event.name === name) {
        return
      }
    }
    return await PTimeout.pTimeout(
      new Promise((resolve, reject) => {
        state.callbacks.push({ frameId, name, resolve, reject })
      }),
      { milliseconds: timeout },
    )
  } catch (error) {
    throw new VError(`Failed to wait for page ${name} event: ${error}`)
  }
}
