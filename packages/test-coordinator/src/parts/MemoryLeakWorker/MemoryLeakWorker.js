import * as Assert from '../Assert/Assert.js'
import * as VideoRecordingWorker from '../VideoRecordingWorker/VideoRecordingWorker.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as Command from '../Command/Command.js'
import * as Callback from '../Callback/Callback.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as MemoryLeakWorkerUrl from '../MemoryLeakWorkerUrl/MemoryLeakWorkerUrl.js'

export const state = {
  /**
   * @type {any}
   */
  ipc: undefined,
}

export const startWorker = async (devtoolsWebsocketUrl) => {
  Assert.string(devtoolsWebsocketUrl)
  const ipc = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    url: MemoryLeakWorkerUrl.memoryLeakWorkerUrl,
    stdio: 'inherit',
  })
  state.ipc = ipc
  HandleIpc.handleIpc(ipc, Command.execute, Callback.resolve)
  await JsonRpc.invoke(ipc, 'ConnectDevtools.connectDevtools', devtoolsWebsocketUrl)
}

export const getIpc = () => {
  return state.ipc
}
