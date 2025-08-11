import * as IpcParentModule from '../IpcParentModule/IpcParentModule.js'

export const create = async ({ method, ...options }) => {
  const module = await IpcParentModule.getModule(method)
  // @ts-ignore
  const rawIpc = await module.create(options)
  const ipc = module.wrap(rawIpc)
  return ipc
}
