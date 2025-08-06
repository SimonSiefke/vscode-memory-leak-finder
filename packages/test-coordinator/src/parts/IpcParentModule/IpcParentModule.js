import { NodeForkedProcessRpcParent, NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'

export const getModule = (method) => {
  switch (method) {
    case IpcParentType.NodeWorkerThread:
      return NodeWorkerRpcParent.create
    case IpcParentType.NodeForkedProcess:
      return NodeForkedProcessRpcParent.create
    default:
      throw new Error('unexpected ipc type')
  }
}
