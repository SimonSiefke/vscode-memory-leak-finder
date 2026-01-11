import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import { VError } from '../VError/VError.ts'

const state = {
  /**
   * @type {any}
   */
  callbacks: [] as any[],
  /**
   * @type {any}
   */
  events: [] as any[],
}

const addEvent = (event) => {
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
      (() => {
        const { promise, reject, resolve } = Promise.withResolvers<void>()
        state.callbacks.push({ frameId, name, reject, resolve })
        return promise
      })(),
      { milliseconds: timeout },
    )
  } catch (error) {
    throw new VError(`Failed to wait for page ${name} event: ${error}`)
  }
}
