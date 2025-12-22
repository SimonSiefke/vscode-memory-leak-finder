import * as Assert from '../Assert/Assert.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import { VError } from '../VError/VError.ts'

interface Target {
  readonly browserContextId?: string
  readonly id?: string
  readonly sessionId?: string
  readonly targetId?: string
  readonly title?: string
  readonly type: string
  readonly url?: string
}

interface TargetCallback {
  readonly index: number
  readonly reject: (reason?: unknown) => void
  readonly resolve: (value: Target) => void
  readonly type: string
}

interface DestroyedCallback {
  readonly resolve: () => void
  readonly targetId: string
}

interface State {
  callbacks: TargetCallback[]
  destroyedCallbacks: DestroyedCallback[]
  targets: Record<string, Target>
}

export const state: State = {
  callbacks: [],
  destroyedCallbacks: [],
  targets: Object.create(null),
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

export const waitForTarget = async ({ index, type }: { readonly type: string; readonly index: number }): Promise<Target> => {
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
          index,
          reject,
          resolve,
          type,
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
        resolve: () => resolve(),
        targetId,
      })
    }),
    { milliseconds: TimeoutConstants.Target },
  )
}
