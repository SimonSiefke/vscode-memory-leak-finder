import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.js'
import {
  DevtoolsProtocolHeapProfiler,
  DevtoolsProtocolPage,
  DevtoolsProtocolRuntime,
  DevtoolsProtocolTarget,
} from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import * as SessionState from '../SessionState/SessionState.js'
import * as TargetState from '../TargetState/TargetState.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'
import * as UtilityScript from '../UtilityScript/UtilityScript.js'
import { VError } from '../VError/VError.js'

export const Locator = (selector) => {
  return {
    selector,
  }
}

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

const handlePageFrameAttached = (event) => {
  console.log('frame attached', event)
}

const handlePageFrameDetached = (event) => {
  console.log('frame detached', event)
}

const handleConsoleApiCalled = (event) => {
  console.log(`page:`, event.params.args[0].value)
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
  const sessionId = message.params.sessionId
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

  await Promise.all([
    DevtoolsProtocolHeapProfiler.enable(sessionRpc),
    DevtoolsProtocolRuntime.enable(sessionRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc),
  ])
}

const handleAttachedToWorker = async (message) => {
  try {
    await handleAttachedToJs(message, DevtoolsTargetType.Worker)
  } catch (error) {
    console.warn(new VError(error, `Failed to attach to worker`))
  }
}

export const handleTargetDestroyed = (message) => {
  const targetId = message.params.targetId
  TargetState.removeTarget(targetId)
}

export const handleTargetInfoChanged = (message) => {
  // console.log('target info changed', message)
}

export const handleHeapSnapshotChunk = (chunk) => {
  console.log({ chunk })
}

export const handleTargetCrashed = (message) => {
  console.log('target crashed', message)
}

const handleAttachedToPage = async (message) => {
  try {
    const sessionId = message.params.sessionId
    const browserSession = SessionState.getSession('browser')
    const browserRpc = browserSession.rpc
    const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)
    const targetId = message.params.targetInfo.targetId
    const type = message.params.targetInfo.type
    const url = message.params.targetInfo.url
    const browserContextId = message.params.targetInfo.browserContextId
    SessionState.addSession(sessionId, {
      type,
      url,
      sessionId,
      rpc: sessionRpc,
    })

    TargetState.addTarget(targetId, {
      type: DevtoolsTargetType.Page,
      url,
      browserContextId,
      sessionId,
      targetId,
    })

    await PTimeout.pTimeout(
      Promise.all([
        DevtoolsProtocolPage.enable(sessionRpc),
        DevtoolsProtocolPage.setLifecycleEventsEnabled(sessionRpc, { enabled: true }),
        DevtoolsProtocolPage.addScriptToEvaluateOnNewDocument(sessionRpc, {
          source: UtilityScript.utilityScript,
          worldName: 'utility',
        }),
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
    if (error && error.name === 'TestFinishedError') {
      return
    }
    console.error(`Failed to attach to page ${message.params.targetInfo.targetId} ${message.params.targetInfo.browserContextId}: ${error}`)
  }
}

const handleAttachedToIframe = async (message) => {
  await handleAttachedToPage(message)
}

const handleAttachedToServiceWorker = async (message) => {
  await handleAttachedToJs(message, DevtoolsTargetType.ServiceWorker)
}

export const handleAttachedToTarget = (message) => {
  const type = message.params.targetInfo.type
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

export const waitForDevtoolsListening = async (stderr) => {
  const devtoolsData = await new Promise((resolve) => {
    const cleanup = () => {
      stderr.off('data', handleData)
    }
    const handleData = (data) => {
      if (data.includes('DevTools listening on')) {
        cleanup()
        resolve(data)
      }
    }
    stderr.on('data', handleData)
  })
  const devtoolsMatch = devtoolsData.match(/DevTools listening on (ws:\/\/.*)/)
  const devtoolsUrl = devtoolsMatch[1]
  return devtoolsUrl
}
