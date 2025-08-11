import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.js'

const state = {
  /**
   * @type {any}
   */
  rpcPromise: undefined,
}

const getOrCreate = async () => {
  if (!state.rpcPromise) {
    state.rpcPromise = launchHeapSnapshotWorker()
  }
  return state.rpcPromise
}

export const invoke = async (method, ...params) => {
  const rpc = await getOrCreate()
  return rpc.invoke(method, ...params)
}
