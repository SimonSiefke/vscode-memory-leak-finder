import { VError } from '../VError/VError.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'

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
