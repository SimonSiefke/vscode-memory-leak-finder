import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'

export const waitForSession = async (browserRpc: any, attachedToPageTimeout: number) => {
  const eventPromise = waitForAttachedEvent(browserRpc, attachedToPageTimeout)

  await DevtoolsProtocolTarget.setAutoAttach(browserRpc, {
    autoAttach: true,
    waitForDebuggerOnStart: true,
    flatten: true,
    filter: [
      {
        type: 'browser',
        exclude: true,
      },
      {
        type: 'tab',
        exclude: true,
      },
      {
        type: 'page',
        exclude: false,
      },
    ],
  })

  const event = await eventPromise

  if (!event) {
    throw new Error(`Failed to attach to page`)
  }
  const { sessionId, targetInfo } = event.params
  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

  // TODO can remove attachment now
  return {
    sessionId,
    targetId: targetInfo.targetId,
    sessionRpc,
  }
}
