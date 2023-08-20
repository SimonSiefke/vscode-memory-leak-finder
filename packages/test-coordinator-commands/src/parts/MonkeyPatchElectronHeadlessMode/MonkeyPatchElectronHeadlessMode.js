// overwrite electron module for headless mode
export const monkeyPatchElectronScript = `
const originalElectron=require('electron')
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
        super({ ...options, show: false, backgroundColor: "green" });
      }
    },
  };
  return electronModule;
};


Module._cache["electron"] = createElectronModule();
`
