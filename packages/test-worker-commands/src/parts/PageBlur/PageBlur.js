import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

const script = `function () {
  const electron = this
  const { BrowserWindow } = electron
  const browserWindows = BrowserWindow.getAllWindows()
  const browserWindow = browserWindows[0]
  if(!browserWindow){
    throw new Error("no browser window found")
  }
  browserWindow.blur()
}`

export const blur = async ({ electronRpc, electronObjectId }) => {
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: script,
    objectId: electronObjectId,
  })
}
