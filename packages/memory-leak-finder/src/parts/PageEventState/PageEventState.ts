import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import { VError } from '../VError/VError.ts'

interface PageEvent {
  readonly frameId: string
  readonly name: string
}

interface EventCallback {
  readonly frameId: string
  readonly name: string
  readonly resolve: () => void
  readonly reject: (reason?: unknown) => void
}

interface State {
  events: PageEvent[]
  callbacks: EventCallback[]
}

export const state: State = {
  events: [],
  callbacks: [],
}

export const addEvent = (event: PageEvent): void => {
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

export const waitForEvent = async ({ frameId, name }: { readonly frameId: string; readonly name: string }): Promise<void> => {
  try {
    for (const event of state.events) {
      if (event.frameId === frameId && event.name === name) {
        return
      }
    }
    const { resolve, reject, promise } = Promise.withResolvers()
    const eventCallback: EventCallback = { frameId, name, resolve: () => resolve(undefined), reject }
    state.callbacks.push(eventCallback)
    return await PTimeout.pTimeout(promise, { milliseconds: TimeoutConstants.PageEvent })
  } catch (error) {
    throw new VError(`Failed to wait for page ${name} event: ${error}`)
  }
}
