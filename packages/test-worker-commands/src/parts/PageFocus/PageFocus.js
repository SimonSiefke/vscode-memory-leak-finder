import { VError } from '@lvce-editor/verror'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

const script = `(async function () {
  const el = globalThis._____electron
  return 123
  // const electron = require('electron')
  // const { BrowserWindow } = electron
  // const browserWindows = BrowserWindow.getAllWindows()
  // const browserWindow = browserWindows[0]
  // if(!browserWindow){
  //   throw new Error("no browser window found")
  // }
  // browserWindow.focus()
})()`

export const focus = async ({ electronRpc, electronObjectId }) => {
  console.log({ electronRpc, electronObjectId })
  try {
    const r = await DevtoolsProtocolRuntime.evaluate(electronRpc, {
      expression: script,
      awaitPromise: true,
    })
    console.log({ r })
  } catch (error) {
    throw new VError(error, `Failed to focus page`)
  }
}
