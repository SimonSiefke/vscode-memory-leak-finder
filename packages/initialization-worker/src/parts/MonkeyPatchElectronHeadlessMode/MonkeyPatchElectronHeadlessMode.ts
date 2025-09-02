// overwrite electron module for headless mode
export const monkeyPatchElectronHeadlessMode = `function(){
  const originalElectron = globalThis._____electron
  const require = globalThis._____require
  const Module = require('node:module')
  const util = require('node:util')

  const electron = require('electron')
  const {app}=electron
  const fs = require('fs')

  const logStream = fs.createWriteStream('/tmp/log.txt')

  const { BrowserWindow } = process._linkedBinding('electron_browser_window')

  const originalInit = BrowserWindow.prototype._init

  BrowserWindow.prototype._init = function ()  {
    logStream.write('\\ninit')
    logStream.write('\\ninit: '+util.inspect(this))

    const instance = originalInit.call(this)

    logStream.write('\\ninit2: '+util.inspect(instance))
    logStream.write('\\ninit2: '+util.inspect(this.hide))
    logStream.write('\\ninit2: '+util.inspect(this.show))
    logStream.write('\\ninit2: '+util.inspect(this.__proto__))

    setTimeout(()=>{
      this.hide()
    }, 0)
  }
}
`
