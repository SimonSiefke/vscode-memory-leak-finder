import * as Assert from '../Assert/Assert.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const create = (rpc, connectionId, isFirstConnection, headlessMode, timeouts, parsedIdeVersion, pageObjectPath) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  Assert.boolean(isFirstConnection)
  Assert.boolean(headlessMode)
  Assert.boolean(timeouts)
  Assert.object(parsedIdeVersion)
  Assert.string(pageObjectPath)
  return rpc.invoke(
    TestWorkerCommandType.PageObjectCreate,
    connectionId,
    isFirstConnection,
    headlessMode,
    timeouts,
    parsedIdeVersion,
    pageObjectPath,
  )
}
