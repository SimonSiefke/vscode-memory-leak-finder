import * as IpcParentType from '../IpcParentType/IpcParentType.ts'

export const getModule = (method) => {
  switch (method) {
    case IpcParentType.NodeWorkerThread:
      return import('../IpcParentWithNodeWorkerThread/IpcParentWithNodeWorkerThread.ts')
    case IpcParentType.NodeForkedProcess:
      return import('../IpcParentWithNodeForkedProcess/IpcParentWithNodeForkedProcess.ts')
    default:
      throw new Error('unexpected ipc type')
  }
}
