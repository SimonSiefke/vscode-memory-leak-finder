export const protocolInterceptorScript = (socketPath: string): string => {
  return `function() {
  const electron = this
  const { protocol, app, BrowserWindow } = electron
  
  // Get require function
  let requireFn = globalThis._____require
  if (!requireFn || typeof requireFn !== 'function') {
    if (typeof global !== 'undefined' && global.require) {
      requireFn = global.require
    }
  }
  if (!requireFn || typeof requireFn !== 'function') {
    console.error('[ProtocolInterceptor] require is not available')
    return
  }
  
  const net = requireFn('net')
  const fs = requireFn('fs')
  const path = requireFn('path')
  
  // Query function tracker for transformed code
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
  
  // Get MIME type from file extension
  const getMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes = {
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.html': 'text/html',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    }
    return mimeTypes[ext] || 'application/octet-stream'
  }
  
  // Check if we should skip transformation (for blob scripts, workers, etc.)
  const shouldSkipTransformation = (url, filePath) => {
    const lowerUrl = url.toLowerCase()
    const lowerPath = filePath.toLowerCase()
    
    // Skip blob scripts - check if URL starts with blob: or contains blob: pattern
    if (lowerUrl.startsWith('blob:') || lowerUrl.includes('blob:') || lowerPath.includes('blob')) {
      return true
    }
    
    // Skip worker scripts
    if (lowerPath.includes('worker') || lowerUrl.includes('worker')) {
      return true
    }
    
    // Skip service worker scripts
    if (lowerPath.includes('service-worker') || lowerUrl.includes('service-worker')) {
      return true
    }
    
    // Skip web worker scripts
    if (lowerPath.includes('web-worker') || lowerUrl.includes('web-worker')) {
      return true
    }
    
    return false
  }
  
  // Check if file content indicates it should be skipped (e.g., blob scripts with specific patterns)
  const shouldSkipByContent = (content) => {
    if (typeof content !== 'string') {
      return false
    }
    // Check for the specific pattern that indicates blob/worker scripts
    if (content.includes('return p ? 0 : (performance.now() - b >= 1e3 && (p = !0), w <= 2 ? w : m(w - 1) + m(w - 2));')) {
      return true
    }
    return false
  }
  
  // Set up protocol interceptor - will be called when app becomes ready
  const setupInterceptor = () => {
    if (!app.isReady()) {
      console.error('[ProtocolInterceptor] App is not ready yet')
      return
    }

    // Intercept vscode-file protocol requests
    protocol.interceptBufferProtocol('vscode-file', async (request, callback) => {
      const url = request.url
      console.log('[ProtocolInterceptor] Intercepting vscode-file request:', url)
      
      // Check if URL starts with blob: - skip transformation for blob URLs
      if (url.toLowerCase().startsWith('blob:')) {
        console.log('[ProtocolInterceptor] Skipping blob URL:', url)
        callback({ error: -6 })
        return
      }
      
      // Convert vscode-file://vscode-app to file path
      if (!url.startsWith('vscode-file://vscode-app')) {
        callback({ error: -6 })
        return
      }
      
      // Parse URL to remove query parameters and hash
      // Extract just the pathname part (everything after vscode-file://vscode-app but before ? or #)
      let filePath = url.slice('vscode-file://vscode-app'.length)
      
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
      
      // Check if we should skip transformation (blob scripts, workers, etc.)
      const shouldSkip = shouldSkipTransformation(url, filePath)
      
      // Check if it's a JavaScript file (check the file path without query params)
      const isJavaScript = filePath.endsWith('.js')
      
      if (shouldSkip) {
        console.log('[ProtocolInterceptor] Skipping transformation for blob/worker script:', url)
        // Fall through to read original file
      } else if (isJavaScript) {
        // For JS files, read the original file first to check its content
        fs.readFile(filePath, async (err, data) => {
          if (err) {
            console.error('[ProtocolInterceptor] Error reading file:', filePath, err)
            callback({ error: -6 })
            return
          }
          
          // Check if content indicates it should be skipped
          const content = data.toString('utf8')
          if (shouldSkipByContent(content)) {
            console.log('[ProtocolInterceptor] Skipping transformation based on content pattern:', url)
            const mimeType = getMimeType(filePath)
            callback({ data, mimeType })
            return
          }
          
          // Try to get transformed code from function tracker
         try {
           const transformedCode = await queryFunctionTracker(url)
           if (transformedCode) {
             console.log('[ProtocolInterceptor] Returning transformed code for:', url)
             callback({
               data: Buffer.from(transformedCode, 'utf8'),
               mimeType: 'application/javascript',
             })
             return
           }
         } catch (error) {
           console.error('[ProtocolInterceptor] Error getting transformed code:', error)
         }
         
         // Fall through: return original file
         const mimeType = getMimeType(filePath)
         console.log('[ProtocolInterceptor] Returning original JS file:', filePath)
         callback({ data, mimeType })
       })
       return
      }
      
      // Fall through: read original file from disk (for non-JS files or skipped files)
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.error('[ProtocolInterceptor] Error reading file:', filePath, err)
          callback({ error: -6 })
        } else {
          const mimeType = getMimeType(filePath)
          console.log('[ProtocolInterceptor] Returning original file:', filePath, 'mimeType:', mimeType)
          callback({ data, mimeType })
        }
      })
    })

    // Open DevTools when window shows using setInterval
    const devToolsInterval = setInterval(() => {
      try {
        const focusedWindow = BrowserWindow.getFocusedWindow()
        if (focusedWindow && focusedWindow.webContents) {
          console.log('[ProtocolInterceptor] Found focused window, opening DevTools')
          focusedWindow.webContents.openDevTools()
          clearInterval(devToolsInterval)
        }
      } catch (error) {
        console.error('[ProtocolInterceptor] Error checking for focused window:', error)
      }
    }, 100)

    // Clear interval after 30 seconds to avoid infinite polling
    setTimeout(() => {
      clearInterval(devToolsInterval)
    }, 30000)

    console.log('[ProtocolInterceptor] Protocol interceptor installed')
  }

  // Set up interceptor immediately if app is ready, otherwise wait for ready event
  if (app.isReady()) {
    setupInterceptor()
  } else {
    app.once('ready', setupInterceptor)
  }
}`
}
