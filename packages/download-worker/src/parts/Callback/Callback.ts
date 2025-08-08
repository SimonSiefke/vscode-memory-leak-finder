import * as Id from '../Id/Id.js'

export const state: {
  callbacks: Record<string, (value: any) => void>
} = {
  callbacks: Object.create(null),
}

export const registerPromise = (): {
  id: string
  promise: Promise<any>
} => {
  const id = Id.create()
  const promise = new Promise<any>((resolve) => {
    state.callbacks[id] = resolve
  })
  return {
    id,
    promise,
  }
}

export const resolve = (id: string, value: any): void => {
  const callback = state.callbacks[id]
  delete state.callbacks[id]
  callback(value)
}

