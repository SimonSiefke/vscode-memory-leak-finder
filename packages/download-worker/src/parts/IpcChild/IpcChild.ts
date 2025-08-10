import * as IpcChildType from '../IpcChildType/IpcChildType.ts'

const getModule = (method: string): Promise<any> => {
  switch (method) {
    case IpcChildType.NodeForkedProcess:
      return import('../IpcChildWithNodeForkedProcess/IpcChildWithNodeForkedProcess.ts')
    case IpcChildType.NodeWorkerThread:
      return import('../IpcChildWithNodeWorkerThread/IpcChildWithNodeWorkerThread.ts')
    default:
      throw new Error('unexpected ipc type')
  }
}

export const listen = async ({ method }: { method: string }): Promise<any> => {
  const module = await getModule(method)
  const rawIpc = module.create()
  const ipc = module.wrap(rawIpc)
  return ipc
}
