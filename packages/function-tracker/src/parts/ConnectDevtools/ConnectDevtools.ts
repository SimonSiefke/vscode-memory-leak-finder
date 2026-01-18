import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolFetch } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
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
  } catch (error) {
    console.warn(`Could not read transformed code from ${transformedCodePath}:`, error)
  }

  // Enable Fetch domain to intercept network requests
  await DevtoolsProtocolFetch.enable(sessionRpc, {
    patterns: [
      {
        urlPattern: '*workbench.desktop.main.js*',
        requestStage: 'Request',
      },
    ],
  })

  // Handle paused requests
  sessionRpc.on('Fetch.requestPaused', async (event: any) => {
    const { requestId, request } = event.params
    const url = request.url

    // Intercept workbench.desktop.main.js requests
    if (url.includes('workbench.desktop.main.js') && transformedCode) {
      try {
        // Fulfill the request with transformed code
        // Body must be base64-encoded according to Chrome DevTools Protocol
        const bodyBase64 = Buffer.from(transformedCode, 'utf8').toString('base64')
        await DevtoolsProtocolFetch.fulfillRequest(sessionRpc, {
          requestId,
          responseCode: 200,
          responseHeaders: [
            { name: 'Content-Type', value: 'application/javascript' },
          ],
          body: bodyBase64,
        })
      } catch (error) {
        console.error('Error fulfilling request with transformed code:', error)
        // Continue with original request if fulfillment fails
        await DevtoolsProtocolFetch.continueRequest(sessionRpc, {
          requestId,
        })
      }
    } else {
      // Continue with original request for other files
      await DevtoolsProtocolFetch.continueRequest(sessionRpc, {
        requestId,
      })
    }
  })

  // Store sessionRpc for GetFunctionStatistics
  setSessionRpc(sessionRpc)
}
