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

export const startWorker = async (devtoolsWebsocketUrl: string, connectionId: number, measureId: string, attachedToPageTimeout: number) => {
  Assert.string(devtoolsWebsocketUrl)
  const rpc = await NodeWorkerRpcParent.create({
    path: MemoryLeakWorkerUrl.memoryLeakWorkerUrl,
    stdio: 'inherit',
    commandMap: CommandMapRef.commandMapRef,
  })
  state.rpc = rpc
  await rpc.invoke('ConnectDevtools.connectDevtools', devtoolsWebsocketUrl, connectionId, measureId, attachedToPageTimeout)
}

export const getRpc = () => {
  return state.rpc
}
