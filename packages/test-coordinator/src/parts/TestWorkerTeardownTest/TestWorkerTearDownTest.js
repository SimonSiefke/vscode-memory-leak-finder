import * as Assert from '../Assert/Assert.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const testWorkerTearDownTest = (rpc, connectionId, absolutePath) => {
  Assert.object(rpc)
  Assert.string(absolutePath)
  return rpc.invoke(TestWorkerCommandType.TearDownTest, connectionId, absolutePath)
}
