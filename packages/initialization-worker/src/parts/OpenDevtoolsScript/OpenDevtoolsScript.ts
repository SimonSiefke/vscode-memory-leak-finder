export const openDevtoolsScript = `(function () {
      const electron = globalThis._____electron
      const { BrowserWindow } = electron
      const intervalId = setInterval(() => {
        const focusedWindow = BrowserWindow.getFocusedWindow()
        if (focusedWindow) {
          clearInterval(intervalId)
          focusedWindow.webContents.openDevTools()
        }
      }, 100)
    })()`
