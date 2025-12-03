import { NodeWorkerRpcParent, type Rpc } from '@lvce-editor/rpc'
import { getOriginalNameWorkerPath } from '../OriginalNameWorkerPath/OriginalNameWorkerPath.ts'

let rpcPromise: Promise<Rpc> | undefined

const create = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    path: getOriginalNameWorkerPath(),
    commandMap: {},
  })
  return rpc
}

const getOrCreateRpc = () => {
  if (!rpcPromise) {
    rpcPromise = create()
  }
  return rpcPromise
}

export const invoke = async (method: string, ...params: readonly any[]) => {
  const rpc = await getOrCreateRpc()
  return rpc.invoke(method, ...params)
}

export const dispose = async () => {
  if (rpcPromise) {
    const promise = rpcPromise
    rpcPromise = undefined
    const rpc = await promise
    rpc.dispose()
  }
}
