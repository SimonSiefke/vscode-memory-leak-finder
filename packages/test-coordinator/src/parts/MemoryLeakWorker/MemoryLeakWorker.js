import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as Assert from '../Assert/Assert.js'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.js'
import * as MemoryLeakWorkerUrl from '../MemoryLeakWorkerUrl/MemoryLeakWorkerUrl.js'

const state = {
  /**
   * @type {import('@lvce-editor/rpc').Rpc|undefined}
   */
  rpc: undefined,
}

export const startWorker = async (devtoolsWebsocketUrl) => {
  Assert.string(devtoolsWebsocketUrl)
  const rpc = await NodeWorkerRpcParent.create({
    path: MemoryLeakWorkerUrl.memoryLeakWorkerUrl,
    stdio: 'inherit',
    commandMap: CommandMapRef.commandMapRef,
  })
  state.rpc = rpc
  await rpc.invoke('ConnectDevtools.connectDevtools', devtoolsWebsocketUrl)
}

export const getRpc = () => {
  return state.rpc
}
