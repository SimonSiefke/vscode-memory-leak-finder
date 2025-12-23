import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'

interface BrowserRpc {
  callbacks: Record<string, unknown>
  invokeWithSession(sessionId: string, method: string, params?: unknown): Promise<unknown>
  listeners: Record<string, unknown>
  on(event: string, listener: (event: { params: { sessionId: string; targetInfo: { targetId: string } } }) => void): void
  once(event: string): Promise<{ params: { sessionId: string; targetInfo: { targetId: string } } }>
}

export const waitForSession = async (browserRpc: BrowserRpc, attachedToPageTimeout: number) => {
  const eventPromise = waitForAttachedEvent(browserRpc, attachedToPageTimeout)
  await DevtoolsProtocolTarget.setAutoAttach(browserRpc, {
    autoAttach: true,
    filter: [
      {
        exclude: true,
        type: 'browser',
      },
      {
        exclude: true,
        type: 'tab',
      },
      {
        exclude: false,
        type: 'page',
      },
    ],
    flatten: true,
    waitForDebuggerOnStart: true,
  })

  const event = await eventPromise

  if (!event) {
    throw new Error(`Failed to attach to page`)
  }
  const { sessionId, targetInfo } = event.params
  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

  return {
    sessionId,
    sessionRpc,
    targetId: targetInfo.targetId,
  }
}
