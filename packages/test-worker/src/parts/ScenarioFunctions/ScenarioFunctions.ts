import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.ts'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.ts'
import * as PageEventState from '../PageEventState/PageEventState.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import * as TargetState from '../TargetState/TargetState.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import { VError } from '../VError/VError.ts'

export const Locator = (selector) => {
  return {
    selector,
  }
}

export const handlePaused = () => {}
export const handleResumed = () => {}

export const handleScriptParsed = (x) => {
  // console.log("script parsed", x);
}

const getExecutionContextType = (message) => {
  if (message.params.context.auxData) {
    if (message.params.context.auxData.type) {
      return message.params.context.auxData.type
    }
    if (message.params.context.auxData.isDefault) {
      return 'default'
    }
  }
  return ''
}

const getSessionId = (message) => {
  if (message.sessionId) {
    return message.sessionId
  }
  return ''
}

export const handleRuntimeExecutionContextCreated = (message) => {
  const { uniqueId } = message.params.context
  const { id } = message.params.context
  const type = getExecutionContextType(message)
  const sessionId = getSessionId(message)
  const { name } = message.params.context
  const { origin } = message.params.context
  const context = {
    id,
    uniqueId,
    sessionId,
    origin,
    name,
    type,
  }
  ExecutionContextState.add(uniqueId, context)
}

export const handleRuntimeExecutionContextDestroyed = (message) => {
  const uniqueId = message.params.executionContextUniqueId
  ExecutionContextState.remove(uniqueId)
}

export const handleRuntimeExecutionContextsCleared = (message) => {
  const { sessionId } = message
  ExecutionContextState.removeBySessionId(sessionId)

  // console.log('execution contexts cleared', message)
}

export const getSessions = () => {
  return SessionState.getAllSessions()
}

export const getExecutionContexts = () => {
  return ExecutionContextState.getAll()
}

const handleAttachedToBrowser = (message) => {
  console.log('attached to browser', message)
}

const handleAttachedToJs = async (message, type) => {
  const { sessionId } = message.params
  const browserSession = SessionState.getSession('browser')
  if (!browserSession) {
    return
  }
  const browserRpc = browserSession.rpc
  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

  SessionState.addSession(sessionId, {
    type: message.params.targetInfo.type,
    url: message.params.targetInfo.url,
    sessionId,
    rpc: sessionRpc,
  })

  TargetState.addTarget(message.params.targetInfo.targetId, {
    type,
    targetId: message.params.targetInfo.targetId,
    title: message.params.targetInfo.title,
    url: message.params.targetInfo.url,
    sessionId: message.params.sessionId,
    browserContextId: message.params.browserContextId,
  })

  await Promise.all([DevtoolsProtocolRuntime.enable(sessionRpc), DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc)])
}

const handleAttachedToWorker = async (message) => {
  try {
    await handleAttachedToJs(message, DevtoolsTargetType.Worker)
  } catch (error) {
    console.warn(new VError(error, `Failed to attach to worker`))
  }
}

export const handleTargetDestroyed = (message) => {
  const { targetId } = message.params
  TargetState.removeTarget(targetId)
}

const handleTargetInfoChangePage = (message, type) => {
  TargetState.changeTarget(message.params.targetInfo.targetId, {
    type,
    targetId: message.params.targetInfo.targetId,
    title: message.params.targetInfo.title,
    url: message.params.targetInfo.url,
  })
}

export const handleTargetInfoChanged = (message) => {
  const { type } = message.params.targetInfo
  switch (type) {
    case DevtoolsTargetType.Page:
    case DevtoolsTargetType.Iframe:
      return handleTargetInfoChangePage(message, type)
    default:
      return
  }
}

export const handleTargetCrashed = (message) => {
  console.log('target crashed', message)
}

const handleAttachedToPage = async (message) => {
  try {
    const { sessionId } = message.params
    const browserSession = SessionState.getSession('browser')
    const browserRpc = browserSession.rpc
    const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)
    const { targetId } = message.params.targetInfo
    const { type } = message.params.targetInfo
    const { url } = message.params.targetInfo
    const { browserContextId } = message.params.targetInfo
    SessionState.addSession(sessionId, {
      type,
      url,
      sessionId,
      rpc: sessionRpc,
    })

    const actualType = type === 'iframe' ? 'iframe' : DevtoolsTargetType.Page

    TargetState.addTarget(targetId, {
      type: actualType,
      url,
      browserContextId,
      sessionId,
      targetId,
    })

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
    console.error(
      `[test-worker] Failed to attach to page ${message.params.targetInfo.targetId} ${message.params.targetInfo.browserContextId}: ${error}`,
    )
  }
}

const handleAttachedToIframe = async (message) => {
  await handleAttachedToPage(message)
}

const handleAttachedToServiceWorker = async (message) => {
  await handleAttachedToJs(message, DevtoolsTargetType.ServiceWorker)
}

export const handleAttachedToTarget = (message) => {
  const { type } = message.params.targetInfo
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

export const handleDetachedFromTarget = (message) => {
  SessionState.removeSession(message.params.sessionId)
}

export const handleTargetCreated = async (message) => {}

export const handlePageLoadEventFired = (message) => {
  // console.log('load event fired', message)
}

export const handlePageLifeCycleEvent = (message) => {
  PageEventState.addEvent({
    sessionId: message.sessionId,
    frameId: message.params.frameId,
    loaderId: message.params.loaderId,
    name: message.params.name,
    timestamp: message.params.timestamp,
  })
}

export const handlePageFrameNavigated = (message) => {
  // console.log('frame navigated', message)
}
