const { BrowserWindow, MessageChannelMain, ipcMain, session, Menu, nativeImage } = require('electron')
const { createServer } = require('node:http')

module.exports = ({ settle, waitForEvent, closeWindow, verifyWebContentsCount }) => {
  let apiSession
  let apiHost
  let server
  let origin
  const channel = 'electron-e2e-invoke'
  const scheme = 'electron-e2e'

  return {
    async setupApiSession() {
      // Reuse a single partition: unique partitions have application lifetime.
      apiSession = session.fromPartition('electron-e2e-api')
    },
    async setupApiHost() {
      apiHost = new BrowserWindow({
        width: 320,
        height: 240,
        show: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false },
      })
      await apiHost.loadURL('data:text/html,<h1>Local API fixture</h1>')
      verifyWebContentsCount(1)
    },
    async teardownApiHost() {
      await closeWindow(apiHost)
      apiHost = undefined
      verifyWebContentsCount(0)
    },
    async setupRequestServer() {
      apiSession = session.fromPartition('electron-e2e-api')
      server = createServer((_request, response) => {
        response.writeHead(200, { 'Content-Type': 'text/plain' })
        response.end('electron-e2e-response')
      })
      const listening = waitForEvent(server, 'listening')
      server.listen(0, '127.0.0.1')
      await listening
      origin = `http://127.0.0.1:${server.address().port}`
    },
    async teardownRequestServer() {
      const closed = waitForEvent(server, 'close')
      server.close()
      server.closeAllConnections()
      await closed
      server = undefined
    },
    async messageChannelRoundtripClose() {
      const { port1, port2 } = new MessageChannelMain()
      try {
        const received = waitForEvent(port2, 'message')
        port2.start()
        port1.postMessage('electron-e2e-message')
        const [event] = await received
        if (event.data !== 'electron-e2e-message') throw new Error('Message port roundtrip failed')
        const closed = waitForEvent(port2, 'close')
        port1.close()
        await closed
        port2.close()
        await settle()
      } finally {
        port1.close()
        port2.close()
      }
    },
    async ipcHandleInvokeRemove() {
      ipcMain.handle(channel, function electronE2EIpcHandler(_event, value) {
        return value + 1
      })
      try {
        const result = await apiHost.webContents.executeJavaScript(`require('electron').ipcRenderer.invoke('${channel}', 41)`)
        if (result !== 42) throw new Error('IPC invoke returned the wrong result')
      } finally {
        ipcMain.removeHandler(channel)
      }
      // Re-registering and invoking proves removal without generating expected
      // missing-handler errors that the inspector console could retain.
      ipcMain.handle(channel, function electronE2EIpcReplacement() {
        return 43
      })
      try {
        const result = await apiHost.webContents.executeJavaScript(`require('electron').ipcRenderer.invoke('${channel}', 41)`)
        if (result !== 43) throw new Error('Replacement IPC handler was not invoked')
      } finally {
        ipcMain.removeHandler(channel)
      }
      await settle()
    },
    async protocolHandleFetchUnhandle() {
      apiSession.protocol.handle(scheme, function electronE2EProtocolHandler() {
        return new Response('electron-e2e-protocol-response')
      })
      try {
        const response = await apiSession.fetch(`${scheme}://fixture/response`)
        if ((await response.text()) !== 'electron-e2e-protocol-response') throw new Error('Protocol handler was not exercised')
      } finally {
        apiSession.protocol.unhandle(scheme)
      }
      if (await apiSession.protocol.isProtocolHandled(scheme)) throw new Error('Protocol handler remained registered')
      await settle()
    },
    async webRequestInterceptRemove() {
      let observed = 0
      apiSession.webRequest.onBeforeRequest({ urls: [`${origin}/*`] }, function electronE2ERequestHandler(_details, callback) {
        observed++
        callback({ cancel: false })
      })
      try {
        const response = await apiSession.fetch(`${origin}/intercepted`, { cache: 'no-store' })
        if ((await response.text()) !== 'electron-e2e-response' || observed !== 1) throw new Error('Request interception was not exercised')
      } finally {
        apiSession.webRequest.onBeforeRequest(null)
      }
      const response = await apiSession.fetch(`${origin}/removed`, { cache: 'no-store' })
      await response.text()
      if (observed !== 1) throw new Error('Removed request listener still ran')
      await settle()
    },
    async cookieSetGetRemove() {
      const url = 'http://127.0.0.1/'
      const name = 'electron-e2e-cookie'
      await apiSession.cookies.set({ url, name, value: 'test-value' })
      try {
        const cookies = await apiSession.cookies.get({ url, name })
        if (cookies.length !== 1 || cookies[0].value !== 'test-value') throw new Error('Cookie write/read failed')
      } finally {
        await apiSession.cookies.remove(url, name)
      }
      if ((await apiSession.cookies.get({ url, name })).length) throw new Error('Cookie survived removal')
      await settle()
    },
    async debuggerAttachCommandDetach() {
      const debug = apiHost.webContents.debugger
      debug.attach('1.3')
      try {
        const response = await debug.sendCommand('Runtime.evaluate', { expression: '6 * 7', returnByValue: true })
        if (response.result.value !== 42) throw new Error('Debugger command failed')
      } finally {
        debug.detach()
      }
      if (debug.isAttached()) throw new Error('Debugger remained attached')
      await settle()
    },
    async menuInstallRestore() {
      const previous = Menu.getApplicationMenu()
      let clicked = false
      const menu = Menu.buildFromTemplate([
        {
          label: 'Electron e2e',
          submenu: [
            {
              id: 'electron-e2e-action',
              label: 'Run',
              click: function electronE2EMenuClick() {
                clicked = true
              },
            },
          ],
        },
      ])
      try {
        Menu.setApplicationMenu(menu)
        if (Menu.getApplicationMenu() !== menu) throw new Error('Application menu was not installed')
        menu.getMenuItemById('electron-e2e-action').click()
        if (!clicked) throw new Error('Menu callback was not exercised')
      } finally {
        Menu.setApplicationMenu(previous)
      }
      if (Menu.getApplicationMenu() !== previous) throw new Error('Application menu was not restored')
      await settle()
    },
    async nativeImageCreateTransformRelease() {
      const image = nativeImage.createFromBitmap(Buffer.alloc(16 * 16 * 4, 255), { width: 16, height: 16 })
      const resized = image.resize({ width: 8, height: 8 })
      const cropped = resized.crop({ x: 0, y: 0, width: 4, height: 4 })
      const png = cropped.toPNG()
      if (cropped.isEmpty() || cropped.getSize().width !== 4 || png.length === 0) throw new Error('Native image transformation failed')
      // NativeImage has no explicit destroy API; these wrappers must be collectible.
      await settle()
    },
  }
}
