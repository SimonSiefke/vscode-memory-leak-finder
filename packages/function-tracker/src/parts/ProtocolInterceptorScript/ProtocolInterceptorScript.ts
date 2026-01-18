// Protocol interceptor script to be injected into Electron main process
// This intercepts vscode-file:// protocol requests and queries function-tracker worker
// via socket to get transformed code
export const protocolInterceptorScript = (socketPath: string): string => {
  return `function() {
  const electron = this
  const { protocol } = electron
  const net = require('net')
  const fs = require('fs')
  const path = require('path')
  
  // Create socket client to communicate with function-tracker worker
  const queryFunctionTracker = (url) => {
    return new Promise((resolve) => {
      const socket = net.createConnection('${socketPath}')
      let responseData = ''
      
      socket.on('connect', () => {
        const request = JSON.stringify({ type: 'transform', url })
        socket.write(request)
      })
      
      socket.on('data', (data) => {
        responseData += data.toString()
      })
      
      socket.on('end', () => {
        try {
          const response = JSON.parse(responseData)
          if (response.type === 'transformed' && response.code) {
            resolve(response.code)
          } else {
            resolve(null)
          }
        } catch (error) {
          console.error('[ProtocolInterceptor] Error parsing response:', error)
          resolve(null)
        }
      })
      
      socket.on('error', (error) => {
        console.error('[ProtocolInterceptor] Socket error:', error)
        resolve(null)
      })
      
      setTimeout(() => {
        socket.destroy()
        resolve(null)
      }, 5000)
    })
  }
  
  // Intercept vscode-file:// protocol using interceptBufferProtocol
  // This allows us to return a Buffer with the transformed code
  protocol.interceptBufferProtocol('vscode-file', async (request, callback) => {
    const url = request.url
    
    // Only intercept workbench.desktop.main.js
    if (url.includes('workbench.desktop.main.js')) {
      try {
        const transformedCode = await queryFunctionTracker(url)
        if (transformedCode) {
          callback({
            data: Buffer.from(transformedCode, 'utf8'),
            mimeType: 'application/javascript',
          })
          return
        }
      } catch (error) {
        console.error('[ProtocolInterceptor] Error getting transformed code:', error)
      }
    }
    
    // Fall through: convert vscode-file://vscode-app to file path and read file
    if (url.startsWith('vscode-file://vscode-app')) {
      const filePath = url.slice('vscode-file://vscode-app'.length)
      fs.readFile(filePath, (err, data) => {
        if (err) {
          callback({ error: -6 })
        } else {
          callback({ data, mimeType: 'application/javascript' })
        }
      })
    } else {
      callback({ error: -6 })
    }
  })
  
  return '${socketPath}'
}`
}
