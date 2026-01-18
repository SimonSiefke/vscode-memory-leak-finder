import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, Server, Socket } from 'net'

const getTransformedCodePath = (): string => {
  const root = join(import.meta.dirname, '..', '..', '..', '..', '..')
  return join(root, 'packages', 'function-tracker', 'workbench.desktop.main.tracked.js')
}

interface TransformRequest {
  readonly type: 'transform'
  readonly url: string
}

interface TransformResponse {
  readonly type: 'transformed' | 'skip'
  readonly code?: string
}

let socketServer: Server | null = null

export const startSocketServer = async (socketPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Remove existing socket file if it exists
    try {
      if (existsSync(socketPath)) {
        unlinkSync(socketPath)
      }
    } catch (error) {
      // Ignore errors
    }

    socketServer = createServer((socket: Socket) => {
      let requestBuffer = ''

      socket.on('data', async (data: Buffer) => {
        requestBuffer += data.toString()

        // Try to parse complete JSON requests
        let endIndex = 0
        try {
          // Find complete JSON object by counting braces
          let braceCount = 0
          let inString = false
          let escapeNext = false

          for (let i = 0; i < requestBuffer.length; i++) {
            const char = requestBuffer[i]

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
                endIndex = i + 1
                break
              }
            }
          }

          if (endIndex > 0) {
            const requestJson = requestBuffer.substring(0, endIndex)
            requestBuffer = requestBuffer.substring(endIndex)

            const request: TransformRequest = JSON.parse(requestJson)

            if (request.type === 'transform' && request.url.includes('workbench.desktop.main.js')) {
              try {
                // Read pre-transformed file
                const transformedPath = getTransformedCodePath()
                let transformedCode: string | null = null

                try {
                  transformedCode = readFileSync(transformedPath, 'utf8')
                  console.log(`[SocketServer] Returning transformed code for ${request.url}`)
                } catch (error) {
                  console.warn(`[SocketServer] Transformed file not found at ${transformedPath}, skipping transformation`)
                  const response: TransformResponse = { type: 'skip' }
                  socket.write(JSON.stringify(response))
                  socket.end()
                  return
                }

                if (transformedCode) {
                  const response: TransformResponse = {
                    type: 'transformed',
                    code: transformedCode,
                  }
                  socket.write(JSON.stringify(response))
                  socket.end()
                  return
                }
              } catch (error) {
                console.error('[SocketServer] Error transforming code:', error)
              }
            }

            // Skip transformation for other files
            const response: TransformResponse = { type: 'skip' }
            socket.write(JSON.stringify(response))
            socket.end()
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
  })
}

export const stopSocketServer = async (): Promise<void> => {
  if (socketServer) {
    return new Promise((resolve) => {
      socketServer!.close(() => {
        socketServer = null
        resolve()
      })
    })
  }
}
