import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as IpcParentWithNodeWorkerThread from '../IpcParentWithNodeWorkerThread/IpcParentWithNodeWorkerThread.js'
import * as IpcParentWithNodeForkedProcess from '../IpcParentWithNodeForkedProcess/IpcParentWithNodeForkedProcess.js'

export const getModule = (method) => {
  switch (method) {
    case IpcParentType.NodeWorkerThread:
      return IpcParentWithNodeWorkerThread
    case IpcParentType.NodeForkedProcess:
      return IpcParentWithNodeForkedProcess
    default:
      throw new Error('unexpected ipc type')
  }
}
