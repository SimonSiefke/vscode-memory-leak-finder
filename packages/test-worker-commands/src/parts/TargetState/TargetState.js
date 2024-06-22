import * as Assert from '../Assert/Assert.js'
import * as MatchesCallback from '../MatchesCallback/MatchesCallback.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'
import { VError } from '../VError/VError.js'

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
      if (MatchesCallback.matchesCallback(target, callback, currentIndex)) {
        callback.resolve(target) // TODO remove callbac
      } else {
        currentIndex++
      }
    }
  }
}

export const changeTarget = (targetId, target) => {
  Assert.string(targetId)
  Assert.object(target)
  const existing = state.targets[targetId]
  state.targets[targetId] = { ...existing, ...target }
  for (const callback of state.callbacks) {
    let currentIndex = 0
    for (const target of Object.values(state.targets)) {
      if (target.type === callback.type) {
        if (currentIndex === callback.index) {
          if (target.url === '') {
            return
          }
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

export const waitForTarget = async ({ type, index = -1, url = new RegExp('') }) => {
  try {
    let currentIndex = 0
    for (const target of Object.values(state.targets)) {
      if (target.type === type) {
        if (currentIndex === index) {
          if (target.url === '') {
            break
          }
          return target
        }
        currentIndex++
      }
    }
    return await PTimeout.pTimeout(
      new Promise((resolve, reject) => {
        state.callbacks.push({
          type,
          url,
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
