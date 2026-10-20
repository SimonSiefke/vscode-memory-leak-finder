const { app, BrowserWindow, webContents } = require('electron')

// Keep the main process alive between cycles, including with zero windows.
app.on('window-all-closed', () => {})
app.setPath('userData', process.env.ELECTRON_E2E_USER_DATA)

const settle = () => new Promise((resolve) => setTimeout(resolve, 100))
const retainedFunctions = []

globalThis.electronE2E = {
  ready: app.whenReady().then(() => true),
  async windowOpenClose() {
    const window = new BrowserWindow({ width: 400, height: 300, show: true })
    try {
      await window.loadURL('data:text/html,<h1>Electron memory test</h1>')
      const closed = new Promise((resolve) => window.once('closed', resolve))
      window.close()
      await closed
      // Destruction of webContents can finish after the window's closed event.
      await settle()
      if (BrowserWindow.getAllWindows().length || webContents.getAllWebContents().length) {
        throw new Error('Window or webContents survived closing the window')
      }
    } finally {
      if (!window.isDestroyed()) window.destroy()
    }
  },
  // Positive control: validate that main-process measurements detect growth.
  async retainFunction() {
    retainedFunctions.push(function electronE2ERetainedFunction() {})
  },
}
