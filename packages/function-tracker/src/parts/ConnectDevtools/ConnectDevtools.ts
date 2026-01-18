import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { setSessionRpc } from '../SessionState/SessionState.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export interface DevToolsConnection {
  readonly dispose: () => Promise<void>
  readonly sessionId: string
  readonly sessionRpc: any
  readonly targetId: string
}

const getTransformedCodePath = (): string => {
  const __dirname = import.meta.dirname
  const root = join(__dirname, '..', '..', '..')
  return join(root, 'workbench.desktop.main.tracked.js')
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

  // Read the transformed code
  const transformedPath = getTransformedCodePath()
  let trackedCode: string | undefined
  if (existsSync(transformedPath)) {
    trackedCode = readFileSync(transformedPath, 'utf8')
    console.log('[FunctionTracker] Loaded transformed code from:', transformedPath)
  } else {
    console.warn('[FunctionTracker] Transformed code not found at:', transformedPath)
    console.warn('[FunctionTracker] Request interception will not work. Run apply-transform.js first.')
  }

  // Enable Fetch domain to intercept requests
  await sessionRpc.invoke('Fetch.enable', {
    patterns: [
      {
        urlPattern: '*workbench.desktop.main.js*',
        requestStage: 'Request',
      },
    ],
    handleAuthRequests: false,
  })

  // Set up request interception to replace JavaScript files with modified versions
  sessionRpc.on('Fetch.requestPaused', async (event: any) => {
    const { requestId, request } = event.params
    const url = request.url

    // Intercept workbench.desktop.main.js requests
    if (url.includes('workbench.desktop.main.js') && trackedCode) {
      console.log('[FunctionTracker] Intercepting workbench.desktop.main.js request:', url)
      try {
        // Fulfill the request with the transformed code
        await sessionRpc.invoke('Fetch.fulfillRequest', {
          requestId,
          responseCode: 200,
          responseHeaders: [
            {
              name: 'Content-Type',
              value: 'application/javascript',
            },
          ],
          body: Buffer.from(trackedCode).toString('base64'),
        })
      } catch (error) {
        console.error('[FunctionTracker] Error fulfilling request:', error)
        // Continue with original request if fulfillment fails
        await sessionRpc.invoke('Fetch.continueRequest', {
          requestId,
        })
      }
    } else {
      // Continue with original request for other files
      await sessionRpc.invoke('Fetch.continueRequest', {
        requestId,
      })
    }
  })

  // Store sessionRpc for GetFunctionStatistics
  setSessionRpc(sessionRpc)
  console.log('[FunctionTracker] DevTools connection established and request interception enabled')
}
