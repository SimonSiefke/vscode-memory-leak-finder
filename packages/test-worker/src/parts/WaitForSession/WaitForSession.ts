import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'

export const waitForSession = async (browserRpc, attachedToPageTimeout) => {
  const eventPromise = waitForAttachedEvent(browserRpc, attachedToPageTimeout)

  await Promise.all([
    DevtoolsProtocolTarget.setAutoAttach(browserRpc, {
      autoAttach: true,
      waitForDebuggerOnStart: true,
      flatten: true,
    }),
    DevtoolsProtocolTarget.setDiscoverTargets(browserRpc, {
      discover: true,
    }),
  ])

  const event = await eventPromise

  if (!event) {
    throw new Error(`Failed to attach to page`)
  }
  console.log({ event: event.params.targetInfo })
  const { sessionId, targetInfo } = event.params
  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)
  return {
    sessionId,
    targetId: targetInfo.targetId,
    sessionRpc,
  }
}
