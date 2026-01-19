import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { setSessionRpc } from '../SessionState/SessionState.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export interface DevToolsConnection {
  readonly dispose: () => Promise<void>
  readonly sessionId: string
  readonly sessionRpc: any
  readonly targetId: string
}

const getTransformedCodePath = (): string => {
  const root = join(import.meta.dirname, '..', '..', '..', '..', '..')
  return join(root, 'packages', 'function-tracker', 'workbench.desktop.main.tracked.js')
}

export const connectDevtools = async (
  devtoolsWebSocketUrl: string,
  webSocketUrl: string,
  connectionId: number,
  measureId: string,
): Promise<void> => {
  if (typeof devtoolsWebSocketUrl !== 'string' || !devtoolsWebSocketUrl.trim()) {
    throw new Error('devtoolsWebSocketUrl must be a non-empty string')
  }
  if (typeof connectionId !== 'number' || connectionId < 0) {
    throw new Error('connectionId must be a non-negative number')
  }
  if (typeof measureId !== 'string' || !measureId.trim()) {
    throw new Error('measureId must be a non-empty string')
  }

  const browserRpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const { sessionRpc } = await waitForSession(browserRpc, 19990)

  // Read transformed code
  const transformedCodePath = getTransformedCodePath()
  let transformedCode: string | null = null
  try {
    transformedCode = readFileSync(transformedCodePath, 'utf8')
    console.log(`[FunctionTracker] Loaded transformed code from ${transformedCodePath}`)
  } catch (error) {
    console.warn(`[FunctionTracker] Could not read transformed code from ${transformedCodePath}:`, error)
  }

  // Enable Page domain to inject tracking code before page loads
  await DevtoolsProtocolPage.enable(sessionRpc)

  // Inject tracking code using Page.addScriptToEvaluateOnNewDocument
  // This ensures the tracking infrastructure is available before any scripts execute
  // TODO set this up when setting up utility context
  const { trackingCode } = await import('../TrackingCode/TrackingCode.ts')
  await DevtoolsProtocolPage.addScriptToEvaluateOnNewDocument(sessionRpc, {
    source: trackingCode,
  })

  // Store sessionRpc for GetFunctionStatistics
  setSessionRpc(sessionRpc)
}
