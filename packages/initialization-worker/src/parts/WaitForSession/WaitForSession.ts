import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
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

interface TargetDiscoveryEvent {
  params: {
    targetInfo: TargetInfo
  }
}

interface BrowserRpc {
  callbacks: Record<string, unknown>
  invoke(method: string, params?: unknown): Promise<unknown>
  invokeWithSession(sessionId: string, method: string, params?: unknown): Promise<unknown>
  listeners: Record<string, unknown>
  off(event: string, listener: (event: any) => void): void
  on(event: string, listener: (event: any) => void): void
  once(event: string): Promise<AttachedToTargetEvent>
}

interface TargetLookup {
  readonly error?: unknown
  readonly targets: readonly TargetInfo[]
}

interface AttachResult {
  readonly attachError?: unknown
  readonly event?: AttachedToTargetEvent
  readonly target?: TargetInfo
  readonly targetLookup: TargetLookup
}

interface WaitForSessionOptions {
  readonly beforeWaitForTarget?: () => Promise<void>
}

const FALLBACK_PROTOCOL_TIMEOUT = 10_000
const AUTO_ATTACH_EVENT_TIMEOUT = 5_000
const FALLBACK_RETRY_DELAY = 1_000

const shouldAttachManuallyBeforeAutoAttach = (attachedToPageTimeout: number): boolean => {
  void attachedToPageTimeout
  return false
}

const getFallbackProtocolTimeout = (attachedToPageTimeout: number): number => {
  return Math.min(attachedToPageTimeout, FALLBACK_PROTOCOL_TIMEOUT)
}

const getAutoAttachEventTimeout = (attachedToPageTimeout: number): number => {
  return Math.min(attachedToPageTimeout, AUTO_ATTACH_EVENT_TIMEOUT)
}

const getAutoAttachFilter = (): readonly object[] => {
  return [
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
  ]
}

const isMacos = (): boolean => {
  return process.platform === 'darwin'
}

const getRemainingTime = (deadline: number): number => {
  return Math.max(deadline - Date.now(), 0)
}

const getAttemptTimeout = (attachedToPageTimeout: number, deadline: number): number => {
  return Math.min(getFallbackProtocolTimeout(attachedToPageTimeout), getRemainingTime(deadline))
}

const delay = (timeout: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}

const waitForInitialAutoAttachEvent = async (
  eventPromise: Promise<AttachedToTargetEvent | null>,
  autoAttachEventTimeout: number,
): Promise<AttachedToTargetEvent | null> => {
  return Promise.race([eventPromise, delay(autoAttachEventTimeout).then(() => null)])
}

const waitForLateAutoAttachEvent = async (eventPromise: Promise<AttachedToTargetEvent | null>): Promise<AttachResult> => {
  const event = await eventPromise
  if (!event) {
    return new Promise(() => {})
  }
  return {
    event,
    targetLookup: {
      targets: [],
    },
  }
}

const withProtocolTimeout = async <T>(promise: Promise<T>, method: string, timeout: number): Promise<T> => {
  const { promise: timeoutPromise, reject } = Promise.withResolvers<T>()
  const timeoutRef = setTimeout(() => {
    reject(new Error(`${method} timed out after ${timeout}ms`))
  }, timeout)
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutRef)
  }
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

const logTargets = (label: string, targets: readonly TargetInfo[]): void => {
  console.error(`[macos-ci-debug] ${label}: ${targets.length === 0 ? '<none>' : targets.map(formatTarget).join('; ')}`)
}

const getTargets = async (browserRpc: BrowserRpc, timeout: number): Promise<TargetLookup> => {
  try {
    const targets = await withProtocolTimeout(
      DevtoolsProtocolTarget.getTargets(browserRpc) as Promise<readonly TargetInfo[]>,
      'Target.getTargets',
      timeout,
    )
    logTargets('Target.getTargets result', targets)
    return {
      targets,
    }
  } catch (error) {
    console.error(`[macos-ci-debug] Target.getTargets failed: ${formatUnknownError(error)}`)
    return {
      error,
      targets: [],
    }
  }
}

const getPageTarget = (targets: readonly TargetInfo[]): TargetInfo | undefined => {
  return targets.find((target) => target.type === 'page')
}

const isLikelyWorkbenchTabTarget = (target: TargetInfo): boolean => {
  if (target.type !== 'tab') {
    return false
  }
  if (target.url?.startsWith('devtools://')) {
    return false
  }
  return (
    target.title === 'Visual Studio Code' ||
    target.url?.startsWith('vscode-file://') ||
    target.url?.startsWith('vscode-webview://') ||
    !target.url
  )
}

const getAttachableTarget = (targets: readonly TargetInfo[]): TargetInfo | undefined => {
  return getPageTarget(targets) ?? targets.find(isLikelyWorkbenchTabTarget)
}

const getTargetDiscoveryFilter = (): readonly object[] => {
  return [
    {
      exclude: true,
      type: 'browser',
    },
  ]
}

const waitForDiscoveredTarget = (browserRpc: BrowserRpc, timeout: number): Promise<TargetInfo | null> => {
  const { promise, resolve } = Promise.withResolvers<TargetInfo | null>()

  const cleanup = (targetInfo: TargetInfo | null): void => {
    browserRpc.off(DevtoolsEventType.TargetTargetCreated, handleDiscoveryEvent)
    browserRpc.off(DevtoolsEventType.TargetTargetInfoChanged, handleDiscoveryEvent)
    clearTimeout(timeoutRef)
    resolve(targetInfo)
  }

  const handleDiscoveryEvent = (message: TargetDiscoveryEvent): void => {
    const targetInfo = message?.params?.targetInfo
    if (!targetInfo) {
      return
    }
    console.error(`[macos-ci-debug] target discovery event ${formatTarget(targetInfo)}`)
    const target = getAttachableTarget([targetInfo])
    if (target) {
      cleanup(target)
    }
  }

  const handleTimeout = (): void => {
    console.error(`[macos-ci-debug] waitForDiscoveredTarget timed out after ${timeout}ms`)
    cleanup(null)
  }

  browserRpc.on(DevtoolsEventType.TargetTargetCreated, handleDiscoveryEvent)
  browserRpc.on(DevtoolsEventType.TargetTargetInfoChanged, handleDiscoveryEvent)
  const timeoutRef = setTimeout(handleTimeout, timeout)
  return promise
}

const attachToExistingTarget = async (browserRpc: BrowserRpc, targetInfo: TargetInfo, timeout: number): Promise<AttachedToTargetEvent> => {
  console.error(`[macos-ci-debug] attaching to existing target ${formatTarget(targetInfo)}`)
  const sessionId = await withProtocolTimeout(
    DevtoolsProtocolTarget.attachToTarget(browserRpc, {
      flatten: true,
      targetId: targetInfo.targetId,
    }) as Promise<string>,
    'Target.attachToTarget',
    timeout,
  )
  console.error(`[macos-ci-debug] attached to existing target sessionId=${sessionId}`)
  return {
    params: {
      sessionId,
      targetInfo,
    },
  }
}

const attachToExistingTargetWithRetries = async (
  browserRpc: BrowserRpc,
  attachedToPageTimeout: number,
  deadline: number,
): Promise<AttachResult> => {
  let attachError: unknown
  let targetLookup: TargetLookup = {
    targets: [],
  }

  while (true) {
    const attemptTimeout = getAttemptTimeout(attachedToPageTimeout, deadline)
    targetLookup = await getTargets(browserRpc, attemptTimeout)
    const target = getAttachableTarget(targetLookup.targets)
    if (target) {
      try {
        const event = await attachToExistingTarget(browserRpc, target, attemptTimeout)
        return { event, targetLookup }
      } catch (error) {
        attachError = error
      }
    }

    const remainingTime = getRemainingTime(deadline)
    if (remainingTime === 0) {
      return { attachError, targetLookup }
    }
    await delay(Math.min(FALLBACK_RETRY_DELAY, remainingTime))
  }
}

const runBeforeWaitForTarget = async (beforeWaitForTarget: (() => Promise<void>) | undefined): Promise<void> => {
  if (!beforeWaitForTarget) {
    return
  }
  console.error(`[macos-ci-debug] waitForSession beforeWaitForTarget start`)
  await beforeWaitForTarget()
  console.error(`[macos-ci-debug] waitForSession beforeWaitForTarget complete`)
}

const attachToDiscoveredTarget = async (
  browserRpc: BrowserRpc,
  attachedToPageTimeout: number,
  deadline: number,
  beforeWaitForTarget: (() => Promise<void>) | undefined,
): Promise<AttachResult> => {
  let target: TargetInfo | null = null
  let attachError: unknown

  const discoveryPromise = waitForDiscoveredTarget(browserRpc, attachedToPageTimeout)
  try {
    const timeout = getAttemptTimeout(attachedToPageTimeout, deadline)
    console.error(`[macos-ci-debug] Target.setDiscoverTargets start`)
    await withProtocolTimeout(
      DevtoolsProtocolTarget.setDiscoverTargets(browserRpc, {
        discover: true,
        filter: getTargetDiscoveryFilter(),
      }) as Promise<void>,
      'Target.setDiscoverTargets',
      timeout,
    )
    console.error(`[macos-ci-debug] Target.setDiscoverTargets complete`)
    await runBeforeWaitForTarget(beforeWaitForTarget)
    target = await discoveryPromise
    if (!target) {
      return {
        targetLookup: {
          targets: [],
        },
      }
    }

    try {
      const event = await attachToExistingTarget(browserRpc, target, getAttemptTimeout(attachedToPageTimeout, deadline))
      return {
        event,
        target,
        targetLookup: {
          targets: [target],
        },
      }
    } catch (error) {
      attachError = error
    }
  } catch (error) {
    attachError = error
  }

  const result: AttachResult = {
    attachError,
    targetLookup: {
      targets: target ? [target] : [],
    },
  }
  if (target) {
    return {
      ...result,
      target,
    }
  }
  return result
}

const createAttachErrorMessage = ({
  attachedToPageTimeout,
  attachError,
  autoAttachAttempted,
  targetDiscoveryAttempted,
  targetLookup,
}: {
  attachedToPageTimeout: number
  attachError?: unknown
  autoAttachAttempted: boolean
  targetDiscoveryAttempted: boolean
  targetLookup: TargetLookup
}): string => {
  const parts = [`Failed to attach to page after ${attachedToPageTimeout}ms`]

  if (autoAttachAttempted) {
    parts.push(`No Target.attachedToTarget event was received after Target.setAutoAttach`)
  } else if (targetDiscoveryAttempted) {
    parts.push(`Target discovery did not find an attachable target`)
  } else {
    parts.push(`Manual Target.getTargets attach fallback did not find an attachable target`)
  }

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

export const waitForSession = async (browserRpc: BrowserRpc, attachedToPageTimeout: number, options: WaitForSessionOptions = {}) => {
  console.error(`[macos-ci-debug] waitForSession start timeout=${attachedToPageTimeout}`)
  const deadline = Date.now() + attachedToPageTimeout
  const autoAttachEventTimeout = getAutoAttachEventTimeout(attachedToPageTimeout)

  let event: AttachedToTargetEvent | null = null
  let autoAttachAttempted = false
  let targetDiscoveryAttempted = false

  if (isMacos()) {
    targetDiscoveryAttempted = true
    const discoveryResult = await attachToDiscoveredTarget(browserRpc, attachedToPageTimeout, deadline, options.beforeWaitForTarget)
    event = discoveryResult.event ?? null
    if (!event) {
      throw new Error(
        createAttachErrorMessage({
          attachedToPageTimeout,
          attachError: discoveryResult.attachError,
          autoAttachAttempted,
          targetDiscoveryAttempted,
          targetLookup: discoveryResult.targetLookup,
        }),
      )
    }
  }

  if (shouldAttachManuallyBeforeAutoAttach(attachedToPageTimeout)) {
    console.error(`[macos-ci-debug] waitForSession using manual target attach before Target.setAutoAttach`)
    const fallbackResult = await attachToExistingTargetWithRetries(browserRpc, attachedToPageTimeout, deadline)
    event = fallbackResult.event ?? null
    if (!event) {
      throw new Error(
        createAttachErrorMessage({
          attachedToPageTimeout,
          attachError: fallbackResult.attachError,
          autoAttachAttempted,
          targetDiscoveryAttempted,
          targetLookup: fallbackResult.targetLookup,
        }),
      )
    }
  }

  if (!event) {
    autoAttachAttempted = true
    const eventPromise = waitForAttachedEvent(browserRpc, attachedToPageTimeout) as Promise<AttachedToTargetEvent | null>
    const filter = getAutoAttachFilter()

    console.error(`[macos-ci-debug] Target.setAutoAttach start waitForDebuggerOnStart=true`)
    await withProtocolTimeout(
      DevtoolsProtocolTarget.setAutoAttach(browserRpc, {
        autoAttach: true,
        filter,
        flatten: true,
        waitForDebuggerOnStart: true,
      }) as Promise<void>,
      'Target.setAutoAttach',
      attachedToPageTimeout,
    )
    console.error(`[macos-ci-debug] Target.setAutoAttach complete`)

    event = await waitForInitialAutoAttachEvent(eventPromise, autoAttachEventTimeout)
    console.error(`[macos-ci-debug] waitForSession initial event ${event ? 'received' : 'missing'}`)

    if (!event) {
      const fallbackResult = await Promise.race([
        waitForLateAutoAttachEvent(eventPromise),
        attachToExistingTargetWithRetries(browserRpc, attachedToPageTimeout, deadline),
      ])
      event = fallbackResult.event ?? null
      if (!event) {
        throw new Error(
          createAttachErrorMessage({
            attachedToPageTimeout,
            attachError: fallbackResult.attachError,
            autoAttachAttempted,
            targetDiscoveryAttempted,
            targetLookup: fallbackResult.targetLookup,
          }),
        )
      }
    }
  }
  const { sessionId, targetInfo } = event.params
  console.error(`[macos-ci-debug] waitForSession using target sessionId=${sessionId} target=${formatTarget(targetInfo)}`)
  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

  // Listen for any NEW targets being attached (e.g., new windows created during testing) and automatically continue them
  // Register AFTER we've gotten the initial page, so this only affects new windows/targets
  const handleNewTarget = (message: any): void => {
    const { sessionId: newSessionId } = message.params
    const newTargetInfo = message?.params?.targetInfo
    console.error(
      `[macos-ci-debug] waitForSession new target sessionId=${newSessionId} targetId=${newTargetInfo?.targetId} type=${newTargetInfo?.type} url=${JSON.stringify(newTargetInfo?.url ?? '')}`,
    )
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
