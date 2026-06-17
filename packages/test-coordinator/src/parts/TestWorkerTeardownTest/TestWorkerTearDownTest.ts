import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const testWorkerTearDownTest = (rpc: { invoke: (method: string, ...args: readonly unknown[]) => Promise<unknown> }, connectionId: number, absolutePath: string): Promise<unknown> => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  return rpc.invoke(TestWorkerCommandType.TearDownTest, connectionId, absolutePath)
}
