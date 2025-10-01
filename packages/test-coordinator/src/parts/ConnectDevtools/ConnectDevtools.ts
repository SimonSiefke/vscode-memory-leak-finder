import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export const connectDevtools = (
  rpc: any,
  connectionId: number,
  devtoolsWebSocketUrl: string,
  electronObjectId: string,
  webSocketUrl: string,
  idleTimeout: number,
  pageObjectPath: string,
  parsedIdeVersion: any,
  timeouts: boolean,
  utilityContext: any,
  attachedToPageTimeout: number,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  Assert.string(devtoolsWebSocketUrl)
  return rpc.invoke(
    TestWorkerCommandType.ConnectDevtools,
    connectionId,
    devtoolsWebSocketUrl,
    electronObjectId,
    webSocketUrl,
    idleTimeout,
    pageObjectPath,
    parsedIdeVersion,
    timeouts,
    utilityContext,
    attachedToPageTimeout,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
  )
}
