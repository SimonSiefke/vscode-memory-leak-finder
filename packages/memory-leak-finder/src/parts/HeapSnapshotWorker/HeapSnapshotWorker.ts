import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'

const state = {
  /**
   * @type {any}
   */
  rpcPromise: undefined as any,
}

const getOrCreate = async () => {
  if (!state.rpcPromise) {
    state.rpcPromise = launchHeapSnapshotWorker()
  }
  return state.rpcPromise
}

export const invoke = async (method, ...params) => {
  const rpc = await getOrCreate()
  if (!rpc) {
    throw new Error('RPC not available')
  }
  return rpc.invoke(method, ...params)
}
