import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'
import { waitForUtilityExecutionContext } from '../WaitForUtilityExecutionContext/WaitForUtilityExecutionContext.ts'

export const connectDevtools = async (devtoolsWebSocketUrl: string, attachedToPageTimeout: number): Promise<any> => {
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)
  const { sessionRpc, sessionId, targetId } = await waitForSession(browserRpc, 30_000)
  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc)
  const { frameTree } = await DevtoolsProtocolPage.getFrameTree(sessionRpc)
  const frameId = frameTree.frame.id
  const executionContextPromise = waitForUtilityExecutionContext(sessionRpc)
  await DevtoolsProtocolPage.createIsolatedWorld(sessionRpc, {
    frameId: frameId,
    worldName: 'utility',
  })
  const utilityContext = await executionContextPromise
  const utilityScript = await UtilityScript.getUtilityScript()
  await DevtoolsProtocolRuntime.evaluate(sessionRpc, {
    uniqueContextId: utilityContext.uniqueId,
    expression: utilityScript,
  })
  return {
    sessionRpc,
    sessionId,
    targetId,
    async dispose() {
      await browserRpc.dispose()
    },
  }
}
