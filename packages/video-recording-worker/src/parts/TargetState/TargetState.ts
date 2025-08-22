import * as Assert from '../Assert/Assert.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import { VError } from '../VError/VError.ts'

interface State {
  targets: Record<any, any>
  callbacks: any[]
  destroyedCallbacks: any[]
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

export const addTarget = (targetId: string, target: any) => {
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

export const removeTarget = (targetId: string) => {
  Assert.string(targetId)
  delete state.targets[targetId]
  const toRemove: any[] = []
  for (const callback of state.destroyedCallbacks) {
    if (callback.targetId === targetId) {
      callback.resolve()
      toRemove.push(callback)
    }
  }
  const newCallbacks: any[] = []
  for (const callback of state.destroyedCallbacks) {
    if (!toRemove.includes(callback)) {
      newCallbacks.push(callback)
    }
  }
  state.destroyedCallbacks = newCallbacks
}

export const waitForTarget = async ({ type, index }: { type: number; index: number }) => {
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
    const { resolve, reject, promise } = Promise.withResolvers()
    state.callbacks.push({
      type,
      index,
      resolve,
      reject,
    })
    return await PTimeout.pTimeout(promise, { milliseconds: TimeoutConstants.Target })
  } catch {
    throw new VError(`Target was not created ${type}`)
  }
}

export const waitForTargetToBeClosed = async (targetId: string) => {
  Assert.string(targetId)
  if (!(targetId in state.targets)) {
    return
  }
  const { resolve, promise } = Promise.withResolvers()
  state.destroyedCallbacks.push({
    targetId,
    resolve,
  })
  return await PTimeout.pTimeout(promise, { milliseconds: TimeoutConstants.Target })
}
