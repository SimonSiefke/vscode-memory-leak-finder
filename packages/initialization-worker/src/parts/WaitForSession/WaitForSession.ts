import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
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

  console.log('[WaitForSession] Registering Target.attachedToTarget listener')
  // Listen for any NEW targets being attached (e.g., new windows created during testing) and automatically continue them
  const handleNewTarget = (message: any): void => {
    const { sessionId: newSessionId } = message.params
    console.log(`[WaitForSession] New target attached: ${newSessionId}`)
    const newSessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, newSessionId)
    // Automatically continue any newly attached targets that are waiting for debugger
    // Fire and forget - don't wait for this to complete
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(newSessionRpc).then(() => {
      console.log(`[WaitForSession] Continued target: ${newSessionId}`)
    }).catch((err: any) => {
      // Silently ignore errors as the target might not be waiting
      console.log(`[WaitForSession] Could not continue target ${newSessionId}: ${err.message}`)
    })
  }

  browserRpc.on('Target.attachedToTarget', handleNewTarget)

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

  console.log('[WaitForSession] Waiting for initial page attachment...')
  const event = await eventPromise

  if (!event) {
    throw new Error(`Failed to attach to page`)
  }
  console.log('[WaitForSession] Initial page attached')
  const { sessionId, targetInfo } = event.params
  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

  return {
    sessionId,
    sessionRpc,
    targetId: targetInfo.targetId,
  }
}
