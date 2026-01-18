import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolFetch, DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
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
  const { trackingCode } = await import('../TrackingCode/TrackingCode.ts')
  await DevtoolsProtocolPage.addScriptToEvaluateOnNewDocument(sessionRpc, {
    source: trackingCode,
  })
  console.log('[FunctionTracker] Injected tracking code via Page.addScriptToEvaluateOnNewDocument')

  // Set up Debugger.scriptParsed handler BEFORE enabling Debugger domain
  // This ensures we catch the event when the script is parsed
  sessionRpc.on('Debugger.scriptParsed', async (event: any) => {
    const { url, scriptId } = event.params
    if (url && url.includes('workbench.desktop.main.js') && transformedCode) {
      console.log(`[FunctionTracker] Debugger.scriptParsed: ${url} (scriptId: ${scriptId})`)
      console.log(`[FunctionTracker] Attempting to replace script source with transformed code...`)
      try {
        // Replace the script source with transformed code
        // This must be done before the script executes
        const result = await DevtoolsProtocolDebugger.setScriptSource(sessionRpc, {
          scriptId,
          scriptSource: transformedCode,
        })
        if (result.result && result.result.stackChanged !== undefined) {
          console.log(`[FunctionTracker] Successfully replaced script source (stackChanged: ${result.result.stackChanged})`)
        } else {
          console.log(`[FunctionTracker] setScriptSource returned:`, JSON.stringify(result, null, 2))
        }
      } catch (error) {
        console.error(`[FunctionTracker] Error replacing script source:`, error)
        // Script might have already executed, or setScriptSource might not be supported
        // Fallback: tracking code is already injected via Page.addScriptToEvaluateOnNewDocument
        // but we can't replace the script source, so functions won't be tracked unless
        // the transformed code file is used
      }
    }
  })

  // Enable Debugger domain to intercept script parsing and replace workbench.desktop.main.js
  await DevtoolsProtocolDebugger.enable(sessionRpc)

  // Set up event listener BEFORE enabling Fetch domain
  // This ensures we don't miss any events
  let requestPausedCount = 0
  sessionRpc.on('Fetch.requestPaused', async (event: any) => {
    requestPausedCount++
    const { requestId, request } = event.params
    const url = request.url
    console.log(`[FunctionTracker] Fetch.requestPaused #${requestPausedCount}: ${url}`)

    // Intercept workbench.desktop.main.js requests
    if (url.includes('workbench.desktop.main.js') && transformedCode) {
      console.log(`[FunctionTracker] Intercepting workbench.desktop.main.js request`)
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
        console.log(`[FunctionTracker] Successfully fulfilled request with transformed code`)
      } catch (error) {
        console.error('[FunctionTracker] Error fulfilling request with transformed code:', error)
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

  // Enable Fetch domain to intercept network requests
  // Enable WITHOUT patterns first to catch ALL requests and verify Fetch is working
  // This will help us debug if Fetch domain works at all in Electron
  console.log('[FunctionTracker] Enabling Fetch domain without patterns (to catch all requests)...')
  try {
    await DevtoolsProtocolFetch.enable(sessionRpc, {})
    console.log('[FunctionTracker] Fetch domain enabled without patterns (will catch ALL requests for debugging)')
  } catch (error) {
    console.error('[FunctionTracker] Error enabling Fetch domain:', error)
    throw error
  }

  // Store sessionRpc for GetFunctionStatistics
  setSessionRpc(sessionRpc)
}
