import * as IpcParentType from '../IpcParentType/IpcParentType.js'

export const getModule = (method) => {
  switch (method) {
    case IpcParentType.NodeWorkerThread:
      return import('../IpcParentWithNodeWorkerThread/IpcParentWithNodeWorkerThread.js')
    default:
      throw new Error('unexpected ipc type')
  }
}
