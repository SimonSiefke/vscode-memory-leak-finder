import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, Server, Socket } from 'net'

const getTransformedCodePath = (): string => {
  const root = join(import.meta.dirname, '..', '..', '..', '..', '..')
  return join(root, 'packages', 'function-tracker', 'workbench.desktop.main.tracked.js')
}

interface JsonRpcRequest {
  readonly jsonrpc: '2.0'
  readonly method: string
  readonly params?: unknown
  readonly id: number | string | null
}

interface JsonRpcSuccessResponse {
  readonly jsonrpc: '2.0'
  readonly result: unknown
  readonly id: number | string | null
}

interface JsonRpcErrorResponse {
  readonly jsonrpc: '2.0'
  readonly error: {
    readonly code: number
    readonly message: string
    readonly data?: unknown
  }
  readonly id: number | string | null
}

type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse

interface TransformParams {
  readonly url: string
}

let socketServer: Server | null = null

const isWellBalancedJson = (buffer: string): number => {
  // Find complete JSON object by counting braces
  let braceCount = 0
  let inString = false
  let escapeNext = false

  for (let i = 0; i < buffer.length; i++) {
    const char = buffer[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '{') {
      braceCount++
    } else if (char === '}') {
      braceCount--
      if (braceCount === 0) {
        return i + 1
      }
    }
  }

  return 0
}

export const startSocketServer = async (socketPath: string): Promise<void> => {
  // Remove existing socket file if it exists
  try {
    if (existsSync(socketPath)) {
      unlinkSync(socketPath)
    }
  } catch (error) {
    // Ignore errors
  }

  const { promise, resolve, reject } = Promise.withResolvers<void>()

  socketServer = createServer((socket: Socket) => {
    let requestBuffer = ''

    socket.on('data', async (data: Buffer) => {
      requestBuffer += data.toString()

      // Try to parse complete JSON requests
      try {
        const endIndex = isWellBalancedJson(requestBuffer)

        if (endIndex > 0) {
          const requestJson = requestBuffer.substring(0, endIndex)
          requestBuffer = requestBuffer.substring(endIndex)

          try {
            const request: JsonRpcRequest = JSON.parse(requestJson)

            // Validate JSON-RPC 2.0 request
            if (request.jsonrpc !== '2.0' || !request.method) {
              const errorResponse: JsonRpcErrorResponse = {
                jsonrpc: '2.0',
                error: {
                  code: -32600,
                  message: 'Invalid Request',
                },
                id: request.id ?? null,
              }
              socket.write(JSON.stringify(errorResponse))
              socket.end()
              return
            }

            // Handle transform method
            if (request.method === 'transform') {
              const params = request.params as TransformParams
              if (!params || typeof params.url !== 'string') {
                const errorResponse: JsonRpcErrorResponse = {
                  jsonrpc: '2.0',
                  error: {
                    code: -32602,
                    message: 'Invalid params',
                  },
                  id: request.id ?? null,
                }
                socket.write(JSON.stringify(errorResponse))
                socket.end()
                return
              }

              if (params.url.includes('workbench.desktop.main.js')) {
                try {
                  // Read pre-transformed file
                  const transformedPath = getTransformedCodePath()
                  let transformedCode: string | null = null

                  try {
                    transformedCode = readFileSync(transformedPath, 'utf8')
                    console.log(`[SocketServer] Returning transformed code for ${params.url}`)
                  } catch (error) {
                    console.warn(`[SocketServer] Transformed file not found at ${transformedPath}, skipping transformation`)
                    const response: JsonRpcSuccessResponse = {
                      jsonrpc: '2.0',
                      result: null,
                      id: request.id ?? null,
                    }
                    socket.write(JSON.stringify(response))
                    socket.end()
                    return
                  }

                  if (transformedCode) {
                    const response: JsonRpcSuccessResponse = {
                      jsonrpc: '2.0',
                      result: { code: transformedCode },
                      id: request.id ?? null,
                    }
                    socket.write(JSON.stringify(response))
                    socket.end()
                    return
                  }
                } catch (error) {
                  console.error('[SocketServer] Error transforming code:', error)
                  const errorResponse: JsonRpcErrorResponse = {
                    jsonrpc: '2.0',
                    error: {
                      code: -32000,
                      message: error instanceof Error ? error.message : 'Server error',
                    },
                    id: request.id ?? null,
                  }
                  socket.write(JSON.stringify(errorResponse))
                  socket.end()
                  return
                }
              }

              // Skip transformation for other files
              const response: JsonRpcSuccessResponse = {
                jsonrpc: '2.0',
                result: null,
                id: request.id ?? null,
              }
              socket.write(JSON.stringify(response))
              socket.end()
              return
            }

            // Unknown method
            const errorResponse: JsonRpcErrorResponse = {
              jsonrpc: '2.0',
              error: {
                code: -32601,
                message: 'Method not found',
              },
              id: request.id ?? null,
            }
            socket.write(JSON.stringify(errorResponse))
            socket.end()
          } catch (parseError) {
            // Invalid JSON
            const errorResponse: JsonRpcErrorResponse = {
              jsonrpc: '2.0',
              error: {
                code: -32700,
                message: 'Parse error',
              },
              id: null,
            }
            socket.write(JSON.stringify(errorResponse))
            socket.end()
          }
        }
      } catch (error) {
        // Not complete JSON yet, wait for more data
      }
    })

    socket.on('error', (error) => {
      console.error('[SocketServer] Socket error:', error)
    })
  })

  socketServer.on('error', (error) => {
    console.error('[SocketServer] Server error:', error)
    reject(error)
  })

  socketServer.listen(socketPath, () => {
    console.log(`[FunctionTracker] Socket server listening on ${socketPath}`)
    resolve()
  })

  await promise
}

export const stopSocketServer = async (): Promise<void> => {
  if (socketServer) {
    const { promise, resolve } = Promise.withResolvers<void>()
    socketServer.close(() => {
      socketServer = null
      resolve()
    })
    await promise
  }
}
