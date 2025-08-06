import { NodeForkedProcessRpcClient, NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as IpcChildType from '../IpcChildType/IpcChildType.js'

const getModule = (method) => {
  switch (method) {
    case IpcChildType.NodeForkedProcess:
      return NodeForkedProcessRpcClient.create
    case IpcChildType.NodeWorkerThread:
      return NodeWorkerRpcClient.create
    default:
      throw new Error('unexpected ipc type')
  }
}

export const listen = async ({ method, ...options }) => {
  const fn = getModule(method)
  // @ts-ignore
  const rpc = fn(options)
  return rpc
}
