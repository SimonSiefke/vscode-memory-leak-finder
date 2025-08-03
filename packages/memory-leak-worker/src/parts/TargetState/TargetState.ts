import { VError } from '../VError/VError.js'
import * as Assert from '../Assert/Assert.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'

interface Target {
  readonly type: string
  readonly id?: string
  readonly targetId?: string
  readonly url?: string
  readonly sessionId?: string
  readonly title?: string
  readonly browserContextId?: string
}

interface TargetCallback {
  readonly type: string
  readonly index: number
  readonly resolve: (value: Target) => void
  readonly reject: (reason?: unknown) => void
}

interface DestroyedCallback {
  readonly targetId: string
  readonly resolve: () => void
}

interface State {
  targets: Record<string, Target>
  callbacks: TargetCallback[]
  destroyedCallbacks: DestroyedCallback[]
}

export const state: State = {
  targets: Object.create(null),
  callbacks: [],
  destroyedCallbacks: [],
}

export const reset = () => {
  state.targets = Object.create(null)
  state.callbacks = []
}

export const addTarget = (targetId: string, target: Target): void => {
  Assert.string(targetId)
  Assert.object(target)
  state.targets[targetId] = target
  for (const callback of state.callbacks) {
    let currentIndex = 0
    for (const target of Object.values(state.targets)) {
      if (target.type === callback.type) {
        if (currentIndex === callback.index) {
          callback.resolve(target) // TODO remove callback
        }
        currentIndex++
      }
    }
  }
}

export const removeTarget = (targetId: string): void => {
  Assert.string(targetId)
  delete state.targets[targetId]
  const toRemove: DestroyedCallback[] = []
  for (const callback of state.destroyedCallbacks) {
    if (callback.targetId === targetId) {
      callback.resolve()
      toRemove.push(callback)
    }
  }
  const newCallbacks: DestroyedCallback[] = []
  for (const callback of state.destroyedCallbacks) {
    if (!toRemove.includes(callback)) {
      newCallbacks.push(callback)
    }
  }
  state.destroyedCallbacks = newCallbacks
}

export const waitForTarget = async ({ type, index }: { readonly type: string; readonly index: number }): Promise<Target> => {
  try {
    let currentIndex = 0
    for (const target of Object.values(state.targets)) {
      if (target.type === type) {
        if (currentIndex === index) {
          return target
        }
        currentIndex++
      }
    }
    return await PTimeout.pTimeout(
      new Promise<Target>((resolve, reject) => {
        state.callbacks.push({
          type,
          index,
          resolve,
          reject,
        })
      }),
      { milliseconds: TimeoutConstants.Target },
    )
  } catch {
    throw new VError(`Target was not created ${type}`)
  }
}

export const waitForTargetToBeClosed = async (targetId: string): Promise<void> => {
  Assert.string(targetId)
  if (!(targetId in state.targets)) {
    return
  }
  return await PTimeout.pTimeout(
    new Promise<void>((resolve, reject) => {
      state.destroyedCallbacks.push({
        targetId,
        resolve: () => resolve(),
      })
    }),
    { milliseconds: TimeoutConstants.Target },
  )
}
