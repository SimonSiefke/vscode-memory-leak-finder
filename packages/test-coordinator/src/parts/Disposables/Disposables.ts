import { DisposableStore } from '../DisposableStore/DisposableStore.ts'

let store = new DisposableStore()

export const add = (fn: () => void | Promise<void>): void => {
  store.add(fn)
}

export const disposeAll = async () => {
  await store.dispose()
  store = new DisposableStore()
}
