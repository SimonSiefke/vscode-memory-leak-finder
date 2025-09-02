// overwrite electron module for headless mode
export const monkeyPatchElectronHeadlessMode = `function () {
  const electron = this
  const { app, BrowserWindow } = electron

  const originalInit = BrowserWindow.prototype._init

  BrowserWindow.prototype._init = function () {
    originalInit.call(this)

    setTimeout(() => {
      this.hide()
    }, 100)
  };
}
`
