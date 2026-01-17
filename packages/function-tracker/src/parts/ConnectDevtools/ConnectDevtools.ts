import { setSessionRpc } from '../GetFunctionStatistics/GetFunctionStatistics.ts'
import { transformCodeWithTracking } from '../TransformCodeWithTracking/TransformCodeWithTracking.ts'
import { trackingCode } from '../TrackingCode/TrackingCode.ts'
import { Buffer } from 'node:buffer'

export interface DevToolsConnection {
  dispose(): Promise<void>
  sessionId: string
  sessionRpc: any
  targetId: string
}

interface DevToolsMessage {
  id?: number
  method: string
  params?: any
  result?: any
  error?: any
}

export const connectDevtools = async (
  devtoolsWebSocketUrl: string,
  electronWebSocketUrl: string,
  connectionId: number,
  measureId: string,
  attachedToPageTimeout: number,
  pid: number,
): Promise<DevToolsConnection> => {
  if (typeof devtoolsWebSocketUrl !== 'string' || !devtoolsWebSocketUrl.trim()) {
    throw new Error('devtoolsWebSocketUrl must be a non-empty string')
  }
  if (typeof electronWebSocketUrl !== 'string' || !electronWebSocketUrl.trim()) {
    throw new Error('electronWebSocketUrl must be a non-empty string')
  }
  if (typeof connectionId !== 'number' || connectionId < 0) {
    throw new Error('connectionId must be a non-negative number')
  }
  if (typeof measureId !== 'string' || !measureId.trim()) {
    throw new Error('measureId must be a non-empty string')
  }
  if (typeof attachedToPageTimeout !== 'number' || attachedToPageTimeout <= 0) {
    throw new Error('attachedToPageTimeout must be a positive number')
  }
  if (typeof pid !== 'number' || pid <= 0) {
    throw new Error('pid must be a positive number')
  }

  let messageId = 1
  const pendingCommands = new Map<number, { resolve: (value: any) => void; reject: (error: any) => void }>()
  let webSocket: WebSocket | null = null
  let sessionId: string
  let targetId: string

  try {
    // 1. Connect to devtools WebSocket
    webSocket = new WebSocket(devtoolsWebSocketUrl)

    const { promise: connectionPromise, resolve: connectionResolve, reject: connectionReject } = Promise.withResolvers<void>()
    const connectionTimeout = setTimeout(() => {
      connectionReject(new Error(`WebSocket connection timeout after ${attachedToPageTimeout}ms`))
    }, attachedToPageTimeout)

    webSocket!.onopen = () => {
      clearTimeout(connectionTimeout)
      connectionResolve()
    }

    webSocket!.onerror = (error) => {
      clearTimeout(connectionTimeout)
      connectionReject(new Error(`WebSocket connection failed: ${error}`))
    }

    await connectionPromise

    const sendCommand = (method: string, params?: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        const id = messageId++
        const message: DevToolsMessage = { id, method, params }

        pendingCommands.set(id, { resolve, reject })
        webSocket!.send(JSON.stringify(message))

        // Set timeout for command completion
        setTimeout(() => {
          if (pendingCommands.has(id)) {
            pendingCommands.delete(id)
            reject(new Error(`Command ${method} timed out after ${attachedToPageTimeout}ms`))
          }
        }, attachedToPageTimeout)
      })
    }

    // Handle incoming messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const message: DevToolsMessage = JSON.parse(event.data)

        if (message.id && pendingCommands.has(message.id)) {
          const { resolve, reject } = pendingCommands.get(message.id)!
          pendingCommands.delete(message.id)

          if (message.error) {
            reject(new Error(message.error.message || 'DevTools command failed'))
          } else {
            resolve(message.result)
          }
        }

        // Handle network interceptions
        if (message.method === 'Fetch.requestPaused') {
          const requestId = message.params?.requestId
          const request = message.params?.request
          const responseStatusCode = message.params?.responseStatusCode
          const responseHeaders = message.params?.responseHeaders

          // Intercept responses (not requests) for JS files
          if (requestId && request && responseStatusCode !== undefined) {
            const url = request.url
            if (url.endsWith('.js') || url.endsWith('.mjs') || url.endsWith('.cjs')) {
              // Intercept and transform the JavaScript response
              ;(async () => {
                try {
                  // Get the response body
                  const responseBody = await sendCommand('Fetch.getResponseBody', { requestId })
                  if (responseBody.body) {
                    let code: string
                    if (responseBody.base64Encoded) {
                      // Decode base64 in Node.js environment
                      code = Buffer.from(responseBody.body, 'base64').toString('utf-8')
                    } else {
                      code = responseBody.body
                    }

                    // Transform the code with tracking
                    const transformedCode = transformCodeWithTracking(code, {
                      scriptId: 0,
                    })
                    // Combine tracking code with transformed code
                    const finalCode = trackingCode + '\n' + transformedCode
                    // Encode the transformed code to base64
                    const encodedBody = Buffer.from(finalCode, 'utf-8').toString('base64')
                    // Fulfill the request with transformed code
                    await sendCommand('Fetch.fulfillRequest', {
                      requestId,
                      responseCode: responseStatusCode || 200,
                      responseHeaders: responseHeaders || [{ name: 'Content-Type', value: 'application/javascript' }],
                      body: encodedBody,
                    })
                  } else {
                    // If we can't get the body, continue with original response
                    await sendCommand('Fetch.continueRequest', { requestId })
                  }
                } catch (error) {
                  console.error('Error intercepting and transforming JS:', error)
                  // Continue with original response on error
                  await sendCommand('Fetch.continueRequest', { requestId }).catch(console.error)
                }
              })()
            } else {
              // Continue non-JS requests normally
              sendCommand('Fetch.continueRequest', {
                requestId,
              }).catch(console.error)
            }
          } else {
            // Continue other requests normally
            sendCommand('Fetch.continueRequest', {
              requestId,
            }).catch(console.error)
          }
        }
      } catch (error) {
        console.error('Failed to parse DevTools message:', error)
      }
    }

    webSocket!.onmessage = handleMessage

    // 2. Setup auto-attach and wait for session (following initialization-worker pattern)
    await sendCommand('Target.setAutoAttach', {
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

    // Wait for attached to page event
    const { promise: attachPromise, resolve: attachResolve, reject: attachReject } = Promise.withResolvers<DevToolsMessage>()
    const attachTimeout = setTimeout(() => {
      attachReject(new Error(`Failed to attach to page within ${attachedToPageTimeout}ms`))
    }, attachedToPageTimeout)

    const checkAttached = (event: MessageEvent) => {
      try {
        const message: DevToolsMessage = JSON.parse(event.data)
        if (message.method === 'Target.attachedToTarget') {
          clearTimeout(attachTimeout)
          webSocket!.removeEventListener('message', checkAttached)
          attachResolve(message)
        }
      } catch (error) {
        // Ignore parsing errors for other messages
      }
    }

    webSocket!.addEventListener('message', checkAttached)
    const attachedEvent = await attachPromise

    sessionId = attachedEvent.params.sessionId
    targetId = attachedEvent.params.targetInfo.targetId

    // Create session RPC abstraction
    const sessionRpc = {
      invoke: async (method: string, params?: any) => {
        return sendCommand(method, params)
      },
    }

    // 3. Pause page / ensure page is paused on start
    await sendCommand('Runtime.enable')

    // Inject tracking code into the page before any scripts run
    await sendCommand('Runtime.evaluate', {
      expression: trackingCode,
    })

    // 4. Setup logic to intercept JS network requests
    await sendCommand('Network.enable')
    await sendCommand('Fetch.enable', {
      patterns: [
        { urlPattern: '*.js', requestStage: 'Response' },
        { urlPattern: '*.mjs', requestStage: 'Response' },
        { urlPattern: '*.cjs', requestStage: 'Response' },
      ],
    })
    await sendCommand('Runtime.runIfWaitingForDebugger')

    console.log(`DevTools connection established for connection ${connectionId}, measure ${measureId}`)

    // Store sessionRpc for GetFunctionStatistics
    setSessionRpc(sessionRpc)

    return {
      async dispose() {
        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
          webSocket.close()
        }
        setSessionRpc(undefined)
      },
      sessionId,
      sessionRpc,
      targetId,
    }
  } catch (error) {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      webSocket.close()
    }
    throw new Error(`Failed to connect to DevTools at ${devtoolsWebSocketUrl}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
