import type { ExecutionContext } from '../ExecutionContextState/ExecutionContextState.ts'
import type { Session } from '../SessionState/SessionState.ts'
import type { DevToolsMessage } from '../Types/Types.ts'
import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import {
  DevtoolsProtocolHeapProfiler,
  DevtoolsProtocolPage,
  DevtoolsProtocolRuntime,
  DevtoolsProtocolTarget,
} from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.ts'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import * as TargetState from '../TargetState/TargetState.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import { VError } from '../VError/VError.ts'

export const Locator = (selector: string): { selector: string } => {
  return {
    selector,
  }
}

export const handleScriptParsed = (x: unknown): void => {
  // console.log("script parsed", x);
}

export const getSessions = (): readonly Session[] => {
  return SessionState.getAllSessions()
}

export const getExecutionContexts = (): readonly ExecutionContext[] => {
  return ExecutionContextState.getAll()
}

const handleAttachedToBrowser = (message: DevToolsMessage): void => {
  console.log('attached to browser', message)
}

const handleAttachedToJs = async (message: DevToolsMessage, type: string): Promise<void> => {
  const sessionId = message.params?.sessionId as string
  if (!sessionId) {
    return
  }
  const browserSession = SessionState.getSession('browser')
  if (!browserSession) {
    return
  }
  const browserRpc = (browserSession as any).rpc
  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

  const targetInfo = message.params?.targetInfo as any
  if (!targetInfo) {
    return
  }

  SessionState.addSession(sessionId, {
    type: targetInfo.type,
    url: targetInfo.url,
    sessionId,
    rpc: sessionRpc,
  } as any)

  TargetState.addTarget(targetInfo.targetId, {
    type,
    targetId: targetInfo.targetId,
    title: targetInfo.title,
    url: targetInfo.url,
    sessionId: message.params?.sessionId,
    browserContextId: message.params?.browserContextId,
  } as any)

  await Promise.all([
    DevtoolsProtocolHeapProfiler.enable(sessionRpc),
    DevtoolsProtocolRuntime.enable(sessionRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc),
  ])
}

const handleAttachedToWorker = async (message: DevToolsMessage): Promise<void> => {
  try {
    await handleAttachedToJs(message, DevtoolsTargetType.Worker)
  } catch (error) {
    console.warn(new VError(error, `Failed to attach to worker`))
  }
}

export const handleTargetDestroyed = (message: DevToolsMessage): void => {
  const targetId = message.params?.targetId as string
  if (targetId) {
    TargetState.removeTarget(targetId)
  }
}

export const handleTargetInfoChanged = (message: DevToolsMessage): void => {
  // console.log('target info changed', message)
}

export const handleTargetCrashed = (message: DevToolsMessage): void => {
  console.log('target crashed', message)
  const targetId = message.params?.targetId as string
  if (targetId) {
    ExecutionContextState.executeCrashListener(targetId)
  }
}

const handleAttachedToPage = async (message: DevToolsMessage): Promise<void> => {
  try {
    const sessionId = message.params?.sessionId as string
    if (!sessionId) {
      return
    }
    const browserSession = SessionState.getSession('browser')
    const browserRpc = (browserSession as any)?.rpc
    const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

    const targetInfo = message.params?.targetInfo as any
    if (!targetInfo) {
      return
    }

    const { targetId } = targetInfo
    const { type } = targetInfo
    const { url } = targetInfo
    const { browserContextId } = targetInfo

    SessionState.addSession(sessionId, {
      type,
      url,
      sessionId,
      rpc: sessionRpc,
    } as any)

    TargetState.addTarget(targetId, {
      type: DevtoolsTargetType.Page,
      url,
      browserContextId,
      sessionId,
      targetId,
    } as any)

    await PTimeout.pTimeout(
      Promise.all([
        DevtoolsProtocolPage.enable(sessionRpc),
        DevtoolsProtocolPage.setLifecycleEventsEnabled(sessionRpc, { enabled: true }),
        DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
          autoAttach: true,
          waitForDebuggerOnStart: true,
          flatten: true,
        }),
        DevtoolsProtocolRuntime.enable(sessionRpc),
        DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc),
      ]),
      { milliseconds: TimeoutConstants.AttachToPage },
    )
  } catch (error) {
    // @ts-ignore
    if (error && error.name === 'TestFinishedError') {
      return
    }
    const targetInfo = message.params?.targetInfo as any
    const targetId = targetInfo?.targetId || 'unknown'
    const browserContextId = targetInfo?.browserContextId || 'unknown'
    console.error(`Failed to attach to page ${targetId} ${browserContextId}: ${error}`)
  }
}

const handleAttachedToIframe = async (message: DevToolsMessage): Promise<void> => {
  await handleAttachedToPage(message)
}

const handleAttachedToServiceWorker = async (message: DevToolsMessage): Promise<void> => {
  await handleAttachedToJs(message, DevtoolsTargetType.ServiceWorker)
}

export const handleAttachedToTarget = (message: DevToolsMessage): void | Promise<void> => {
  const targetInfo = message.params?.targetInfo as any
  if (!targetInfo?.type) {
    return
  }
  const { type } = targetInfo
  switch (type) {
    case DevtoolsTargetType.Page:
      return handleAttachedToPage(message)
    case DevtoolsTargetType.Worker:
      return handleAttachedToWorker(message)
    case DevtoolsTargetType.Iframe:
      return handleAttachedToIframe(message)
    case DevtoolsTargetType.Browser:
      return handleAttachedToBrowser(message)
    case DevtoolsTargetType.ServiceWorker:
      return handleAttachedToServiceWorker(message)
    default:
      console.warn(`unsupported attachment type ${type}`)
  }
}

export const handleDetachedFromTarget = (message: DevToolsMessage): void => {
  const sessionId = message.params?.sessionId as string
  if (sessionId) {
    SessionState.removeSession(sessionId)
  }
}

export const handleTargetCreated = async (message: DevToolsMessage): Promise<void> => {}
