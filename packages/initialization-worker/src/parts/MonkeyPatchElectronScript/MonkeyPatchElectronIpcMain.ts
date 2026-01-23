export const monkeyPatchElectronIpcMain = `function () { const electron = this
  // Initialize IPC message tracking
  globalThis.__ipcMessages = []
  globalThis.__ipcMessageCount = 0

  // Intercept IPC messages
  const { ipcMain } = electron
  const originalIpcMainOn = ipcMain.on.bind(ipcMain)
  const originalIpcMainHandle = ipcMain.handle.bind(ipcMain)

  ipcMain.on = function(channel, listener) {
    const wrappedListener = (event, ...args) => {
      const message = {
        channel,
        timestamp: Date.now(),
        type: 'on',
        args: args.map(arg => {
          if (Buffer.isBuffer(arg)) {
            return {
              type: 'buffer',
              length: arg.length,
              content: arg.toString('utf8')
            }
          }
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
      const requestMessage = {
        channel,
        timestamp: Date.now(),
        type: 'handle-request',
        args: args.map(arg => {
          if (Buffer.isBuffer(arg)) {
            return {
              type: 'buffer',
              length: arg.length,
              content: arg.toString('utf8')
            }
          }
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

        const responseMessage = {
          channel,
          timestamp: Date.now(),
          type: 'handle-response',
          result: (() => {
            if (Buffer.isBuffer(result)) {
              return {
                type: 'buffer',
                length: result.length,
                content: result.toString('utf8')
              }
            }
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
}`

