export const monkeyPatchElectronIpcMain = `function () { const electron = this
  // Initialize IPC message tracking
  globalThis.__ipcMessages = []
  const patchedWebContents = new WeakSet()

  if (globalThis.__vscodeMemoryLeakFinderIpcMainPatched) {
    return
  }
  globalThis.__vscodeMemoryLeakFinderIpcMainPatched = true
  const patchedSenders = new WeakSet()

  // Intercept IPC messages
  const { ipcMain } = electron
  const originalIpcMainOn = ipcMain.on.bind(ipcMain)
  const originalIpcMainHandle = ipcMain.handle.bind(ipcMain)
  const safeCall = (fn, fallback = undefined) => {
    try {
      return fn()
    } catch {
      return fallback
    }
  }
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
  const getLabel = (type) => {
    if (type === 'window') {
      return 'browser-window'
    }
    if (type) {
      return type
    }
    return 'unknown-renderer'
  }
  const getWebContentsInfo = (contents) => {
    if (!contents) {
      return {
        kind: 'renderer',
        label: 'unknown-renderer',
      }
    }
    const type = safeCall(() => contents.getType?.(), undefined)
    const processId = safeCall(() => contents.getProcessId?.(), undefined)
    const osProcessId = safeCall(() => contents.getOSProcessId?.(), undefined)
    return {
      kind: 'renderer',
      label: getLabel(type),
      webContentsId: contents.id,
      type,
      url: safeCall(() => contents.getURL?.(), undefined),
      title: safeCall(() => contents.getTitle?.(), undefined),
      processId,
      osProcessId,
    }
  }
  const getIpcEventEndpoint = (event) => {
    const endpoint = getWebContentsInfo(event?.sender)
    endpoint.processId = event?.processId ?? endpoint.processId
    endpoint.frameId = event?.frameId
    endpoint.frameUrl = safeCall(() => event?.senderFrame?.url, undefined)
    return endpoint
  }
  const getMainEndpoint = () => {
    return {
      kind: 'electron-main',
      label: 'electron-main',
      pid: process.pid,
    }
  }

  const pushMessage = (message) => {
    globalThis.__ipcMessages.push(message)
  }
  const patchWebContents = (contents) => {
    if (!contents || patchedWebContents.has(contents)) {
      return
    }
    patchedWebContents.add(contents)
    if (typeof contents.send === 'function') {
      const originalSend = contents.send.bind(contents)
      contents.send = function(channel, ...args) {
        pushMessage({
          args: args.map(serializeArg),
          channel,
          direction: 'main-to-renderer',
          from: getMainEndpoint(),
          timestamp: Date.now(),
          to: getWebContentsInfo(contents),
          type: 'webContents.send',
        })
        return originalSend(channel, ...args)
      }
    }
    if (typeof contents.sendToFrame === 'function') {
      const originalSendToFrame = contents.sendToFrame.bind(contents)
      contents.sendToFrame = function(frameId, channel, ...args) {
        pushMessage({
          args: args.map(serializeArg),
          channel,
          direction: 'main-to-renderer',
          frameId,
          from: getMainEndpoint(),
          timestamp: Date.now(),
          to: { ...getWebContentsInfo(contents), frameId },
          type: 'webContents.sendToFrame',
        })
        return originalSendToFrame(frameId, channel, ...args)
      }
    }
    if (typeof contents.postMessage === 'function') {
      const originalPostMessage = contents.postMessage.bind(contents)
      contents.postMessage = function(channel, message, transfer) {
        const args = transfer === undefined ? [message] : [message, transfer]
        pushMessage({
          args: args.map(serializeArg),
          channel,
          direction: 'main-to-renderer',
          from: getMainEndpoint(),
          timestamp: Date.now(),
          to: getWebContentsInfo(contents),
          type: 'webContents.postMessage',
        })
        if (transfer === undefined) {
          return originalPostMessage(channel, message)
        }
        return originalPostMessage(channel, message, transfer)
      }
    }
  }
  safeCall(() => {
    for (const contents of electron.webContents?.getAllWebContents?.() || []) {
      patchWebContents(contents)
    }
  })
  safeCall(() => {
    electron.app?.on?.('web-contents-created', (event, contents) => {
      patchWebContents(contents)
    })
  })

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
      const message = {
        channel,
        timestamp: Date.now(),
        type: 'on',
        direction: 'renderer-to-main',
        from: getIpcEventEndpoint(event),
        to: getMainEndpoint(),
        args: args.map(serializeArg)
      }
      pushMessage(message)
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
        direction: 'renderer-to-main',
        from: getIpcEventEndpoint(event),
        to: getMainEndpoint(),
        args: args.map(serializeArg)
      }
      pushMessage(requestMessage)

      try {
        const result = await listener(event, ...args)
        const responseMessage = {
          channel,
          timestamp: Date.now(),
          type: 'handle-response',
          direction: 'main-to-renderer',
          from: getMainEndpoint(),
          to: getIpcEventEndpoint(event),
          result: serializeArg(result)
        }
        pushMessage(responseMessage)
        return result
      } catch (error) {
        const errorMessage = {
          channel,
          timestamp: Date.now(),
          type: 'handle-error',
          direction: 'main-to-renderer',
          from: getMainEndpoint(),
          to: getIpcEventEndpoint(event),
          error: error?.message || String(error)
        }
        pushMessage(errorMessage)
        throw error
      }
    }

    return originalIpcMainHandle(channel, wrappedListener)
  }
}`
