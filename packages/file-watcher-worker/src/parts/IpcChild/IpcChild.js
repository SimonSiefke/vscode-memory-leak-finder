import * as IpcChildType from '../IpcChildType/IpcChildType.js'

const getModule = (method) => {
  switch (method) {
    case IpcChildType.NodeForkedProcess:
      return import('../IpcChildWithNodeForkedProcess/IpcChildWithNodeForkedProcess.js')
    case IpcChildType.NodeWorkerThread:
      return import('../IpcChildWithNodeWorkerThread/IpcChildWithNodeWorkerThread.js')
    default:
      throw new Error('unexpected ipc type')
  }
}

export const listen = async ({ method }) => {
  const module = await getModule(method)
  const rawIpc = module.create()
  const ipc = module.wrap(rawIpc)
  return ipc
}
