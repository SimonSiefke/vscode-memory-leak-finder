import * as Callback from '../Callback/Callback.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as HeapSnapshotWorkerPath from '../HeapSnapshotWorkerPath/HeapSnapshotWorkerPath.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

const state = {
  /**
   * @type {any}
   */
  ipc: undefined,
}

const execute = () => {
  throw new Error('not implemented')
}

const create = async () => {
  const ipc = await IpcParent.create({
    method: IpcParentType.NodeForkedProcess,
    stdio: 'inherit',
    url: HeapSnapshotWorkerPath.heapSnapshotWorkerPath,
    execArgv: ['--max-old-space-size=8192'],
  })
  HandleIpc.handleIpc(ipc, execute, Callback.resolve)
  return ipc
}

const getOrCreate = async () => {
  if (!state.ipc) {
    state.ipc = create()
  }
  return state.ipc
}

export const invoke = async (method, ...params) => {
  const ipc = await getOrCreate()
  return JsonRpc.invoke(ipc, method, ...params)
}
