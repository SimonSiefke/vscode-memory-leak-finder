import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const stop = async (rpc: any, connectionId: number) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  const result = await rpc.invoke(TestWorkerCommandType.MemoryLeakFinderStop, connectionId)
  if (result && result.connectionClosed) {
    throw new Error('memory leak worker websocket connection closed')
  }
  return result
}
