import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { objectUrlTrackerScript } from '../ObjectUrlTrackerScript/ObjectUrlTrackerScript.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

const isObjectUrlCountMeasure = (measureId: string): boolean => {
  return measureId === 'objectUrlCount' || measureId === 'objecturlcount' || measureId === 'object-url-count'
}

export const connectDevtools = async (devtoolsWebSocketUrl: string, attachedToPageTimeout: number, measureId: string): Promise<any> => {
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)
  const { sessionId, sessionRpc, targetId } = await waitForSession(browserRpc, attachedToPageTimeout)
  const objectUrlTrackerPromise = isObjectUrlCountMeasure(measureId)
    ? DevtoolsProtocolRuntime.evaluate(sessionRpc, { expression: objectUrlTrackerScript, returnByValue: true })
    : undefined
  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc)
  await objectUrlTrackerPromise
  return {
    async dispose() {
      await browserRpc.dispose()
    },
    sessionId,
    sessionRpc,
    targetId,
  }
}
