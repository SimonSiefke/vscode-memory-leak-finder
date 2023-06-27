export const code = `(function () {
  // const electron = this
  const electron = require('electron')
  const { app } = electron
  const handleBrowserWindowCreated = (x) => {
    // x.hide()
    // this.hide()
    console.log(x)
  }
  app.on('browser-window-created', handleBrowserWindowCreated)

  // const originalInit = electron.BrowserWindow.prototype._init.bind(electron.BrowserWindow)

  // electron.BrowserWindow.prototype._init = function () {}
  // electron.BrowserWindow = 123
  // const { BrowserWindow } = electron
  // BrowserWindow.prototype = {}
  return typeof electron.BrowserWindow
})()
`
