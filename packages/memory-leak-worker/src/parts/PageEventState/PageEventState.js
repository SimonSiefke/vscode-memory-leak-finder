import * as PTimeout from '../PTimeout/PTimeout.js'
import * as Promises from '../Promises/Promises.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'
import { VError } from '../VError/VError.js'

export const state = {
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

export const waitForEvent = async ({ frameId, name }) => {
  try {
    for (const event of state.events) {
      if (event.frameId === frameId && event.name === name) {
        return
      }
    }
    const { resolve, reject, promise } = Promises.withResolvers()
    state.callbacks.push({ frameId, name, resolve, reject })
    return await PTimeout.pTimeout(promise, { milliseconds: TimeoutConstants.PageEvent })
  } catch (error) {
    throw new VError(`Failed to wait for page ${name} event: ${error}`)
  }
}
