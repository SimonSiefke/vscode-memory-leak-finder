import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const create = (ipc, connectionId, isFirstConnection, headlessMode) => {
  Assert.object(ipc)
  Assert.number(connectionId)
  Assert.boolean(isFirstConnection)
  Assert.boolean(headlessMode)
  return JsonRpc.invoke(ipc, TestWorkerCommandType.PageObjectCreate, connectionId, isFirstConnection, headlessMode)
}
