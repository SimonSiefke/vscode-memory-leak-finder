import { VError } from '@lvce-editor/verror'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

// TODO emulate a focused page?
const script = `(async function () {
  const electron = globalThis._____electron
  const { BrowserWindow } = electron
  const browserWindows = BrowserWindow.getAllWindows()
  const browserWindow = browserWindows[0]
  if(!browserWindow){
    throw new Error("no browser window found")
  }
  browserWindow.focus()
})()`

export const focus = async ({ electronRpc }) => {
  try {
    await DevtoolsProtocolRuntime.evaluate(electronRpc, {
      expression: script,
      awaitPromise: true,
    })
  } catch (error) {
    throw new VError(error, `Failed to focus page`)
  }
}
