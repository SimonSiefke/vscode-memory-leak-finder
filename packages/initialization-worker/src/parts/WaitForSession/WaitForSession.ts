import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'

interface TargetInfo {
  attached?: boolean
  targetId: string
  title?: string
  type: string
  url?: string
}

interface AttachedToTargetEvent {
  params: {
    sessionId: string
    targetInfo: TargetInfo
  }
}

interface BrowserRpc {
  callbacks: Record<string, unknown>
  invoke(method: string, params?: unknown): Promise<unknown>
  invokeWithSession(sessionId: string, method: string, params?: unknown): Promise<unknown>
  listeners: Record<string, unknown>
  on(event: string, listener: (event: AttachedToTargetEvent) => void): void
  once(event: string): Promise<AttachedToTargetEvent>
}

interface TargetLookup {
  readonly error?: unknown
  readonly targets: readonly TargetInfo[]
}

const formatUnknownError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return `${error}`
}

const formatTarget = (target: TargetInfo): string => {
  const url = target.url || '<empty>'
  const title = target.title || '<empty>'
  const attached = target.attached ?? '<unknown>'
  return `${target.type} targetId=${target.targetId} attached=${attached} url=${JSON.stringify(url)} title=${JSON.stringify(title)}`
}

const getTargets = async (browserRpc: BrowserRpc): Promise<TargetLookup> => {
  try {
    const targets = await DevtoolsProtocolTarget.getTargets(browserRpc)
    return {
      targets,
    }
  } catch (error) {
    return {
      error,
      targets: [],
    }
  }
}

const getPageTarget = (targets: readonly TargetInfo[]): TargetInfo | undefined => {
  return targets.find((target) => target.type === 'page')
}

const attachToExistingPage = async (browserRpc: BrowserRpc, targetInfo: TargetInfo): Promise<AttachedToTargetEvent> => {
  const sessionId = await DevtoolsProtocolTarget.attachToTarget(browserRpc, {
    flatten: true,
    targetId: targetInfo.targetId,
  })
  return {
    params: {
      sessionId,
      targetInfo,
    },
  }
}

const createAttachErrorMessage = ({
  attachedToPageTimeout,
  attachError,
  targetLookup,
}: {
  attachedToPageTimeout: number
  attachError?: unknown
  targetLookup: TargetLookup
}): string => {
  const parts = [
    `Failed to attach to page after ${attachedToPageTimeout}ms`,
    `No Target.attachedToTarget event was received after Target.setAutoAttach`,
  ]

  if (targetLookup.error) {
    parts.push(`Target.getTargets failed: ${formatUnknownError(targetLookup.error)}`)
  } else if (targetLookup.targets.length === 0) {
    parts.push(`Target.getTargets returned no targets`)
  } else {
    parts.push(`Available targets: ${targetLookup.targets.map(formatTarget).join('; ')}`)
  }

  if (attachError) {
    parts.push(`Fallback Target.attachToTarget failed: ${formatUnknownError(attachError)}`)
  }

  return parts.join('. ')
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

  let event = await eventPromise

  if (!event) {
    const targetLookup = await getTargets(browserRpc)
    const pageTarget = getPageTarget(targetLookup.targets)
    let attachError: unknown
    if (pageTarget) {
      try {
        event = await attachToExistingPage(browserRpc, pageTarget)
      } catch (error) {
        attachError = error
      }
    }
    if (!event) {
      throw new Error(createAttachErrorMessage({ attachedToPageTimeout, attachError, targetLookup }))
    }
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
