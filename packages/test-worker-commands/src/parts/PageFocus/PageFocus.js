import { VError } from '@lvce-editor/verror'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

const script = `(function () {
  const electron = require('electron')
  const { BrowserWindow } = electron
  const browserWindows = BrowserWindow.getAllWindows()
  const browserWindow = browserWindows[0]
  if(!browserWindow){
    throw new Error("no browser window found")
  }
  browserWindow.focus()
})()`

export const focus = async ({ electronRpc, electronObjectId }) => {
  console.log({ electronRpc, electronObjectId })
  try {
    await DevtoolsProtocolRuntime.evaluate(electronRpc, {
      expression: script,
    })
  } catch (error) {
    throw new VError(error, `Failed to focus page`)
  }
}
