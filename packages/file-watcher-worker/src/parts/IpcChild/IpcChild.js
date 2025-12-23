import * as IpcChildType from '../IpcChildType/IpcChildType.js'

/**
 * @param {string | number} method
 */
const getModule = (method) => {
  if (method === IpcChildType.NodeForkedProcess || method === String(IpcChildType.NodeForkedProcess)) {
    return import('../IpcChildWithNodeForkedProcess/IpcChildWithNodeForkedProcess.js')
  }
  if (method === IpcChildType.NodeWorkerThread || method === String(IpcChildType.NodeWorkerThread)) {
    return import('../IpcChildWithNodeWorkerThread/IpcChildWithNodeWorkerThread.js')
  }
  throw new Error('unexpected ipc type')
}

/**
 * @param {{ method: string }} options
 */
export const listen = async ({ method }) => {
  const module = await getModule(method)
  const rawIpc = module.create()
  const ipc = module.wrap(rawIpc)
  return ipc
}
