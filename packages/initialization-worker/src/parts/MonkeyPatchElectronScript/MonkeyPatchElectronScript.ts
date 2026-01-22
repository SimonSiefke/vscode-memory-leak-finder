// based on https://github.com/microsoft/playwright/blob/92375f63338c32aee8c4f3f9b70660577e1a87f2/packages/playwright-core/src/server/electron/loader.ts by Microsoft (License Apache 2.0)

// it is necessary to defer the app ready event to avoid
// race conditions when attaching to the debugger
// when using --remote-debugging-port
export const monkeyPatchElectronScript = `function () {
  const electron = this
  const { app } = electron
  const originalWhenReady = app.whenReady()
  const originalEmit = app.emit.bind(app)

  let readyEventArgs
  let isReady = false

  // Initialize IPC message tracking
  globalThis.__ipcMessages = []
  globalThis.__ipcMessageCount = 0

  const { resolve, promise } = Promise.withResolvers();

  const patchedAppEmit = (event, ...args) => {
    if (event === 'ready') {
      readyEventArgs = args;
      return app.listenerCount('ready') > 0;
    }
    return originalEmit(event, ...args)
  }

  const patchedWhenReady = () => {
    return promise
  }

  const patchedIsReady = () => {
    return isReady
  }

  app.commandLine.appendSwitch('js-flags', "--allow-natives-syntax");

  app.emit = patchedAppEmit
  app.whenReady = patchedWhenReady
  app.isReady = patchedIsReady

  // Intercept IPC messages
  const { ipcMain } = electron
  const originalIpcMainOn = ipcMain.on.bind(ipcMain)
  const originalIpcMainHandle = ipcMain.handle.bind(ipcMain)

  ipcMain.on = function(channel, listener) {
    const wrappedListener = (event, ...args) => {
      // Log the IPC message
      const message = {
        channel,
        timestamp: Date.now(),
        type: 'on',
        args: args.map(arg => {
          // Check if it's a Buffer
          if (Buffer.isBuffer(arg)) {
            return {
              type: 'buffer',
              length: arg.length,
              content: arg.toString('utf8')
            }
          }
          // Check if it's a Uint8Array
          if (arg instanceof Uint8Array) {
            return {
              type: 'uint8array',
              length: arg.length,
              content: Buffer.from(arg).toString('utf8')
            }
          }
          try {
            return JSON.stringify(arg)
          } catch (e) {
            return '[unserializable]'
          }
        })
      }

      globalThis.__ipcMessages.push(message)
      globalThis.__ipcMessageCount++

      return listener(event, ...args)
    }

    return originalIpcMainOn(channel, wrappedListener)
  }

  ipcMain.handle = function(channel, listener) {
    const wrappedListener = async (event, ...args) => {
      // Log the IPC handle request
      const requestMessage = {
        channel,
        timestamp: Date.now(),
        type: 'handle-request',
        args: args.map(arg => {
          // Check if it's a Buffer
          if (Buffer.isBuffer(arg)) {
            return {
              type: 'buffer',
              length: arg.length,
              content: arg.toString('utf8')
            }
          }
          // Check if it's a Uint8Array
          if (arg instanceof Uint8Array) {
            return {
              type: 'uint8array',
              length: arg.length,
              content: Buffer.from(arg).toString('utf8')
            }
          }
          try {
            return JSON.stringify(arg)
          } catch (e) {
            return '[unserializable]'
          }
        })
      }

      globalThis.__ipcMessages.push(requestMessage)
      globalThis.__ipcMessageCount++

      try {
        const result = await listener(event, ...args)

        // Log the IPC handle response
        const responseMessage = {
          channel,
          timestamp: Date.now(),
          type: 'handle-response',
          result: (() => {
            // Check if result is a Buffer
            if (Buffer.isBuffer(result)) {
              return {
                type: 'buffer',
                length: result.length,
                content: result.toString('utf8')
              }
            }
            // Check if result is a Uint8Array
            if (result instanceof Uint8Array) {
              return {
                type: 'uint8array',
                length: result.length,
                content: Buffer.from(result).toString('utf8')
              }
            }
            try {
              return JSON.stringify(result)
            } catch (e) {
              return '[unserializable]'
            }
          })()
        }

        globalThis.__ipcMessages.push(responseMessage)
        globalThis.__ipcMessageCount++

        return result
      } catch (error) {
        // Log the IPC handle error
        const errorMessage = {
          channel,
          timestamp: Date.now(),
          type: 'handle-error',
          error: error?.message || String(error)
        }

        globalThis.__ipcMessages.push(errorMessage)
        globalThis.__ipcMessageCount++

        throw error
      }
    }

    return originalIpcMainHandle(channel, wrappedListener)
  }

  return async () => {
    const event = await originalWhenReady
    isReady = true
    resolve(event)
    originalEmit('ready', ...readyEventArgs)
  }
}
`

export const undoMonkeyPatch = `function () {
  const fn = this
  return fn()
}`
