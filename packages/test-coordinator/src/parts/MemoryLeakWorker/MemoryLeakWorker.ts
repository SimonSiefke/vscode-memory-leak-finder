import { NodeWorkerRpcParent, type Rpc } from '@lvce-editor/rpc'
import * as Assert from '../Assert/Assert.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as MemoryLeakWorkerUrl from '../MemoryLeakWorkerUrl/MemoryLeakWorkerUrl.ts'

interface State {
  rpc: Rpc | undefined
}

const state: State = {
  rpc: undefined,
}

export const startWorker = async (devtoolsWebsocketUrl: string) => {
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
