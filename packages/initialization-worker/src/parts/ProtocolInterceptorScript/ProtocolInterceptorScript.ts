export const protocolInterceptorScript = (port: number, preGeneratedWorkbenchPath: string | null): string => {
  const preGeneratedPath = preGeneratedWorkbenchPath ? JSON.stringify(preGeneratedWorkbenchPath) : 'null'
  return `function() {
  const electron = this
  const require = globalThis._____require
  const { protocol, app, BrowserWindow } = electron

  const fs = require('fs')
  const path = require('path')
  const preGeneratedWorkbenchPath = ${preGeneratedPath}

  // Check if this is workbench.desktop.main.js and load pre-generated file
  const isWorkbenchMain = (filePath) => {
    return filePath.endsWith('workbench.desktop.main.js')
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
      } else if (isJavaScript && isWorkbenchMain(filePath) && preGeneratedWorkbenchPath) {
        // For workbench.desktop.main.js, load the pre-generated file directly
        console.log('[ProtocolInterceptor] Loading pre-generated workbench.desktop.main.js from:', preGeneratedWorkbenchPath)
        fs.readFile(preGeneratedWorkbenchPath, (err, data) => {
          if (err) {
            console.error('[ProtocolInterceptor] Error reading pre-generated workbench file:', preGeneratedWorkbenchPath, err)
            // Fall back to original file
            fs.readFile(filePath, (err2, data2) => {
              if (err2) {
                console.error('[ProtocolInterceptor] Error reading original file:', filePath, err2)
                callback({ error: -6 })
                return
              }
              const mimeType = getMimeType(filePath)
              callback({ data: data2, mimeType })
            })
            return
          }
          callback({
            data,
            mimeType: 'application/javascript',
          })
        })
        return
      } else if (isJavaScript) {
        // For other JS files, return original file (no transformation)
        fs.readFile(filePath, (err, data) => {
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
