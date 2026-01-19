import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createServer, Server, Socket } from 'net'
import { transformCodeWithTracking } from '../TransformCodeWithTracking/TransformCodeWithTracking.ts'
import { transformCode } from '../Transform/Transform.ts'

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

              try {
                // Extract file path from URL
                // URL format: vscode-file://vscode-app/path/to/file.js
                if (!params.url.startsWith('vscode-file://vscode-app')) {
                  const response: JsonRpcSuccessResponse = {
                    jsonrpc: '2.0',
                    result: null,
                    id: request.id ?? null,
                  }
                  socket.write(JSON.stringify(response))
                  socket.end()
                  return
                }

                let filePath = params.url.slice('vscode-file://vscode-app'.length)

                // Remove query parameters (everything after ?)
                const queryIndex = filePath.indexOf('?')
                if (queryIndex !== -1) {
                  filePath = filePath.substring(0, queryIndex)
                }

                // Remove hash (everything after #)
                const hashIndex = filePath.indexOf('#')
                if (hashIndex !== -1) {
                  filePath = filePath.substring(0, hashIndex)
                }

                // Only transform JavaScript files
                if (!filePath.endsWith('.js')) {
                  const response: JsonRpcSuccessResponse = {
                    jsonrpc: '2.0',
                    result: null,
                    id: request.id ?? null,
                  }
                  socket.write(JSON.stringify(response))
                  socket.end()
                  return
                }

                // Read original file from disk
                let originalCode: string
                try {
                  originalCode = readFileSync(filePath, 'utf8')
                } catch (error) {
                  console.error(`[SocketServer] Error reading file ${filePath}:`, error)
                  const errorResponse: JsonRpcErrorResponse = {
                    jsonrpc: '2.0',
                    error: {
                      code: -32000,
                      message: error instanceof Error ? error.message : 'Failed to read file',
                    },
                    id: request.id ?? null,
                  }
                  socket.write(JSON.stringify(errorResponse))
                  socket.end()
                  return
                }

                // Transform code on-the-fly
                try {
                  const transformedCode = transformCode(originalCode, {
                    filename: filePath,
                    minify: true,
                  })

                  // Write transformed code to temporary file
                  const tempFilePath = `/tmp/${randomUUID()}`
                  writeFileSync(tempFilePath, transformedCode, 'utf8')

                  const response: JsonRpcSuccessResponse = {
                    jsonrpc: '2.0',
                    result: { filePath: tempFilePath },
                    id: request.id ?? null,
                  }
                  socket.write(JSON.stringify(response))
                  socket.end()
                  return
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
              } catch (error) {
                console.error('[SocketServer] Error handling transform request:', error)
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
