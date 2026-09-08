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
  const eventPromise = waitForAttachedEvent(browserRpc, attachedToPageTimeout, async (message) => {
    const { sessionId, targetInfo } = message.params
    for (let attempt = 0; attempt < 100; attempt++) {
      const targets = await DevtoolsProtocolTarget.getTargets(browserRpc)
      const currentTarget = targets.find((target: any) => target.targetId === targetInfo.targetId)
      if (currentTarget?.url) {
        console.error('[WaitForSession] classified target', targetInfo.targetId, currentTarget.url)
        if (currentTarget.url.startsWith('devtools://')) {
          const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)
          DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc).catch(() => {})
          return false
        }
        return true
      }
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    return false
  })

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

  // Listen for any NEW targets being attached (e.g., new windows created during testing) and automatically continue them
  // Register AFTER we've gotten the initial page, so this only affects new windows/targets
  const handleNewTarget = (message: any): void => {
    const { sessionId: newSessionId } = message.params
    const newSessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, newSessionId)
    // Automatically continue any newly attached targets that are waiting for debugger
    // Fire and forget - don't wait for this to complete
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(newSessionRpc).catch(() => {
      // Silently ignore errors as the target might not be waiting
    })
  }

  browserRpc.on('Target.attachedToTarget', handleNewTarget)

  return {
    sessionId,
    sessionRpc,
    targetId: targetInfo.targetId,
  }
}
