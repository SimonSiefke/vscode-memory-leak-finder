import * as Assert from '../Assert/Assert.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as MemoryLeakWorkerUrl from '../MemoryLeakWorkerUrl/MemoryLeakWorkerUrl.js'

export const state = {
  /**
   * @type {import('@lvce-editor/rpc').Rpc|undefined}
   */
  rpc: undefined,
}

export const startWorker = async (devtoolsWebsocketUrl) => {
  Assert.string(devtoolsWebsocketUrl)
  const rpc = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    url: MemoryLeakWorkerUrl.memoryLeakWorkerUrl,
    stdio: 'inherit',
  })
  state.rpc = rpc
  await rpc.invoke('ConnectDevtools.connectDevtools', devtoolsWebsocketUrl)
}

export const getRpc = () => {
  return state.rpc
}
