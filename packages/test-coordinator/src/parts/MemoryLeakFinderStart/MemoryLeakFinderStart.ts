import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const start = async (rpc: any, connectionId: number) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  const result = await rpc.invoke(TestWorkerCommandType.MemoryLeakFinderStart, connectionId)
  if (result && result.connectionClosed) {
    throw new Error('memory leak worker websocket connection closed')
  }
  return result
}
