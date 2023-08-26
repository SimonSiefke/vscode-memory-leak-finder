import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const testWorkerRunTest = (ipc, connectionId, absolutePath, root, color) => {
  Assert.object(ipc)
  Assert.string(absolutePath)
  Assert.string(root)
  Assert.boolean(color)
  return JsonRpc.invoke(ipc, TestWorkerCommandType.RunTest, connectionId, absolutePath, root, color)
}
