import * as Id from '../Id/Id.js'

export const state = {
  callbacks: Object.create(null),
}

export const registerPromise = () => {
  const id = Id.create()
  const promise = new Promise((resolve) => {
    state.callbacks[id] = resolve
  })
  return {
    id,
    promise,
  }
}

export const resolve = (id, value) => {
  const callback = state.callbacks[id]
  delete state.callbacks[id]
  callback(value)
}
