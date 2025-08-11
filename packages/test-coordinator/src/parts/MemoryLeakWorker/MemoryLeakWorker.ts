import { NodeWorkerRpcParent, Rpc } from '@lvce-editor/rpc'
import * as Assert from '../Assert/Assert.js'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.js'
import * as MemoryLeakWorkerUrl from '../MemoryLeakWorkerUrl/MemoryLeakWorkerUrl.js'

interface State {
  rpc: Rpc | undefined
}

const state: State = {
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
