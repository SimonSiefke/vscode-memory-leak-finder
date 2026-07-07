export const monkeyPatchElectronIpcMain = `function () { const electron = this
  // Initialize IPC message tracking
  globalThis.__ipcMessages = []

  if (globalThis.__vscodeMemoryLeakFinderIpcMainPatched) {
    return
  }
  globalThis.__vscodeMemoryLeakFinderIpcMainPatched = true
  const patchedSenders = new WeakSet()

  // Intercept IPC messages
  const { ipcMain } = electron
  const originalIpcMainOn = ipcMain.on.bind(ipcMain)
  const originalIpcMainHandle = ipcMain.handle.bind(ipcMain)
  const serializeArg = (arg) => {
    if (Buffer.isBuffer(arg)) {
      return { type: 'buffer', length: arg.length, encoding: 'latin1', content: arg.toString('latin1') }
    }
    if (arg instanceof Uint8Array) {
      return { type: 'uint8array', length: arg.length, encoding: 'latin1', content: Buffer.from(arg).toString('latin1') }
    }
    try {
      return JSON.stringify(arg)
    } catch (e) {
      return '[unserializable]'
    }
  }

  const pushMessage = (message) => {
    globalThis.__ipcMessages.push(message)
  }

  const patchSender = (sender) => {
    if (!sender || patchedSenders.has(sender)) {
      return
    }
    patchedSenders.add(sender)
    const originalSend = sender.send.bind(sender)
    sender.send = function(channel, ...args) {
      const message = { channel, timestamp: Date.now(), type: 'send', args: args.map(serializeArg) }
      pushMessage(message)
      return originalSend(channel, ...args)
    }
  }

  ipcMain.on = function(channel, listener) {
    const wrappedListener = (event, ...args) => {
      patchSender(event.sender)
      const message = { channel, timestamp: Date.now(), type: 'on', args: args.map(serializeArg) }
      pushMessage(message)
      return listener(event, ...args)
    }

    return originalIpcMainOn(channel, wrappedListener)
  }

  ipcMain.handle = function(channel, listener) {
    const wrappedListener = async (event, ...args) => {
      const requestMessage = { channel, timestamp: Date.now(), type: 'handle-request', args: args.map(serializeArg) }
      pushMessage(requestMessage)

      try {
        const result = await listener(event, ...args)
        const responseMessage = { channel, timestamp: Date.now(), type: 'handle-response', result: serializeArg(result) }
        pushMessage(responseMessage)
        return result
      } catch (error) {
        const errorMessage = { channel, timestamp: Date.now(), type: 'handle-error', error: error?.message || String(error) }
        pushMessage(errorMessage)
        throw error
      }
    }

    return originalIpcMainHandle(channel, wrappedListener)
  }
}`
