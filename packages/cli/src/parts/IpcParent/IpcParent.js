import * as IpcParentModule from '../IpcParentModule/IpcParentModule.js'

export const create = async ({ method, ...options }) => {
  const module = IpcParentModule.getModule(method)
  // @ts-ignore
  const rpc = await module.create(options)
  return rpc
}
