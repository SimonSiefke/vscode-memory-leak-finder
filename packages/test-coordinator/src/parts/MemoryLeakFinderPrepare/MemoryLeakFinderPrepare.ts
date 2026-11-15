import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const prepare = async (rpc: any, connectionId: number): Promise<boolean> => {
  Assert.object(rpc)
  Assert.number(connectionId)
  const result = await rpc.invoke(TestWorkerCommandType.MemoryLeakFinderPrepare, connectionId)
  if (result && result.connectionClosed) {
    throw new Error('memory leak worker websocket connection closed')
  }
  return result === true
}
