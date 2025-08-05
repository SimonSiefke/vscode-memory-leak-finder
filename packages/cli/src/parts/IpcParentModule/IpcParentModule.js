import { NodeForkedProcessRpcParent, NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'

export const getModule = (method) => {
  switch (method) {
    case IpcParentType.NodeWorkerThread:
      return NodeWorkerRpcParent
    case IpcParentType.NodeForkedProcess:
      return NodeForkedProcessRpcParent
    default:
      throw new Error('unexpected ipc type')
  }
}
