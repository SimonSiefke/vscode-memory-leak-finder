import VError from 'verror'
import * as Assert from '../Assert/Assert.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'

export const state = {
  targets: Object.create(null),
  /**
   * @type {any[]}
   */
  callbacks: [],
  /**
   * @type {any[]}
   */
  destroyedCallbacks: [],
}

export const reset = () => {
  state.targets = Object.create(null)
  state.callbacks = []
}

export const addTarget = (targetId, target) => {
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

export const removeTarget = (targetId) => {
  Assert.string(targetId)
  delete state.targets[targetId]
  const toRemove = []
  for (const callback of state.destroyedCallbacks) {
    if (callback.targetId === targetId) {
      callback.resolve()
      toRemove.push(callback)
    }
  }
  const newCallbacks = []
  for (const callback of state.destroyedCallbacks) {
    if (!toRemove.includes(callback)) {
      newCallbacks.push(callback)
    }
  }
  state.destroyedCallbacks = newCallbacks
}

export const waitForTarget = async ({ type, index }) => {
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
      new Promise((resolve, reject) => {
        state.callbacks.push({
          type,
          index,
          resolve,
          reject,
        })
      }),
      { milliseconds: TimeoutConstants.Target },
    )
  } catch (error) {
    throw new VError(`Target was not created ${type}`)
  }
}

export const waitForTargetToBeClosed = async (targetId) => {
  Assert.string(targetId)
  if (!(targetId in state.targets)) {
    return
  }
  return await PTimeout.pTimeout(
    new Promise((resolve, reject) => {
      state.destroyedCallbacks.push({
        targetId,
        resolve,
      })
    }),
    { milliseconds: TimeoutConstants.Target },
  )
}
