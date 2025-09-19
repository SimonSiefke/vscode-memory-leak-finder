import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'

export const waitForSession = async (browserRpc, attachedToPageTimeout) => {
  const eventPromise = waitForAttachedEvent(browserRpc, attachedToPageTimeout)
  await DevtoolsProtocolTarget.setAutoAttach(browserRpc, {
    autoAttach: true,
    waitForDebuggerOnStart: false,
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

  return {
    sessionRpc,
    sessionId,
    targetId: targetInfo.targetId,
  }
}
