import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'

const handleAttachedToBrowser = (message) => {
  console.log('attached to browser', message)
}

export const handleTargetCrashed = (message) => {
  console.log('target crashed', message)
}

const handleAttachedToPage = async (browserRpc, message) => {
  console.log('attached to page. need to add utility script')
  console.log({ message })
  const { sessionId } = message.params
  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

  await PTimeout.pTimeout(
    Promise.all([
      DevtoolsProtocolPage.addScriptToEvaluateOnNewDocument(sessionRpc, {
        source: UtilityScript.getUtilityScript(),
        worldName: 'utility',
      }),
      DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
        autoAttach: true,
        waitForDebuggerOnStart: true,
        flatten: true,
      }),
    ]),
    { milliseconds: 10_000 },
  )
}

const handleAttachedToIframe = async (message) => {}

export const handleAttachedToTarget = (browserRpc, message) => {
  const { type } = message.params.targetInfo
  switch (type) {
    case DevtoolsTargetType.Page:
      return handleAttachedToPage(browserRpc, message)
    case DevtoolsTargetType.Iframe:
      return handleAttachedToIframe(message)
    case DevtoolsTargetType.Browser:
      return handleAttachedToBrowser(message)
    default:
      console.warn(`unsupported attachment type ${type}`)
  }
}
