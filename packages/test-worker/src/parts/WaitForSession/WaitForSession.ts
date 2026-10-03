import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'

export const waitForSession = async (browserRpc, attachedToPageTimeout) => {
  const eventPromise = waitForAttachedEvent(browserRpc, attachedToPageTimeout, async (message) => {
    const { targetInfo } = message.params
    for (let attempt = 0; attempt < 100; attempt++) {
      const targets = await DevtoolsProtocolTarget.getTargets(browserRpc)
      const currentTarget = targets.find((target) => target.targetId === targetInfo.targetId)
      if (currentTarget?.url) {
        console.error('[TestWorker WaitForSession] classified target', targetInfo.targetId, currentTarget.url)
        return !currentTarget.url.startsWith('devtools://')
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
    waitForDebuggerOnStart: false,
  })

  const event = await eventPromise

  if (!event) {
    throw new Error(`Failed to attach to page`)
  }
  const { sessionId, targetInfo } = event.params
  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

  // Chromium can hold a newly opened auxiliary window at its startup barrier.
  // Such windows do not go through electronApp.waitForPage, unlike new workbenches.
  browserRpc.on('Target.attachedToTarget', (message) => {
    const childRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, message.params.sessionId)
    void DevtoolsProtocolRuntime.runIfWaitingForDebugger(childRpc).catch(() => {
      // A short-lived target may detach before the resume request arrives.
    })
  })

  // TODO can remove attachment now
  return {
    sessionId,
    sessionRpc,
    targetId: targetInfo.targetId,
  }
}
