// overwrite electron module for headless mode
export const monkeyPatchElectronScript = `
const originalElectron = require('electron')
const Module = require('node:module')

const createElectronModule = () => {
  const electronModule = new Module("electron", undefined);
  electronModule.id = "electron";
  electronModule.loaded = true;
  electronModule.filename = "electron";
  electronModule.exports = {
    ...originalElectron,
    BrowserWindow: class extends originalElectron.BrowserWindow {
      constructor(options) {
        super({
          ...options,
          show: false,
          // backgroundColor: "green",
          // backgroundThrottling: false,
          // webPreferences:{
          //   // ...options.webPreferences,
          //   backgroundThrottling: false,
          //   preload: options.webPreferences.preload,
          //   additionalArguments: options.webPreferences.additionalArguments,
          // }
        });

        Object.defineProperty(this.webContents, 'openDevTools', {
          value(){},
          writable: false
        })

        this.show = () => {
        }

        this.focus = () => {}

        this.restore = () => {}
      }
    },
  };

  // Object.defineProperty(electronModule.exports.app, 'focus', {
  //   value(){},
  //   writable: false
  // })
  // electronModule.exports.app.commandLine.appendSwitch('no-sandbox');
  // electronModule.exports.app.commandLine.appendSwitch('disable-gpu-sandbox');
  electronModule.exports.app.commandLine.appendSwitch('--disable-background-timer-throttling');
  return electronModule;
};



Module._cache["electron"] = createElectronModule();
`
