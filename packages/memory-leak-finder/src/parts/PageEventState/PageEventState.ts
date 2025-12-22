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
  readonly reject: (reason?: unknown) => void
  readonly resolve: () => void
}

interface State {
  callbacks: EventCallback[]
  events: PageEvent[]
}

export const state: State = {
  callbacks: [],
  events: [],
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
    const { promise, reject, resolve } = Promise.withResolvers()
    const eventCallback: EventCallback = { frameId, name, reject, resolve: () => resolve(undefined) }
    state.callbacks.push(eventCallback)
    return await PTimeout.pTimeout(promise, { milliseconds: TimeoutConstants.PageEvent })
  } catch (error) {
    throw new VError(`Failed to wait for page ${name} event: ${error}`)
  }
}
