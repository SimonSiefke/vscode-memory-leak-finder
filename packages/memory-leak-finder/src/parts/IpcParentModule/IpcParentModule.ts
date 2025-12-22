import * as IpcParentType from '../IpcParentType/IpcParentType.ts'

export const getModule = (method) => {
  switch (method) {
    case IpcParentType.NodeForkedProcess:
      return import('../IpcParentWithNodeForkedProcess/IpcParentWithNodeForkedProcess.ts')
    case IpcParentType.NodeWorkerThread:
      return import('../IpcParentWithNodeWorkerThread/IpcParentWithNodeWorkerThread.ts')
    default:
      throw new Error('unexpected ipc type')
  }
}
