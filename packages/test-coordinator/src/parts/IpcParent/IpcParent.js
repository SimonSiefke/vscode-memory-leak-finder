import * as IpcParentModule from '../IpcParentModule/IpcParentModule.js'

export const create = async ({ method, ...options }) => {
  const fn = IpcParentModule.getModule(method)
  // @ts-ignore
  const rpc = await fn(options)
  return rpc
}
