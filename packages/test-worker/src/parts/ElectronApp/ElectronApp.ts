import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'
import * as Page from '../Page/Page.ts'
import * as WaitForIframe from '../WaitForIframe/WaitForIframe.ts'
import * as WaitForPage from '../WaitForIframe/WaitForIframe.ts'

const loadUrlScript = `function (url) {
  const electron = this
  const { BrowserWindow } = electron
  const browserWindows = BrowserWindow.getAllWindows()
  const browserWindow = browserWindows[0]
  if (!browserWindow) {
    throw new Error('no browser window found')
  }
  browserWindow.loadURL(url)
}`

export const create = ({ browserRpc, electronObjectId, electronRpc, firstWindow, idleTimeout, sessionRpc }) => {
  let currentFirstWindow = firstWindow
  let currentSessionRpc = sessionRpc

  return {
    electronObjectId,
    evaluate(expression) {
      return DevtoolsProtocolRuntime.evaluate(this.rpc, {
        expression,
        returnByValue: true,
      })
    },
    firstWindow() {
      return currentFirstWindow
    },
    loadUrl(url) {
      return DevtoolsProtocolRuntime.callFunctionOn(this.rpc, {
        arguments: [
          {
            value: url,
          },
        ],
        functionDeclaration: loadUrlScript,
        objectId: this.electronObjectId,
      })
    },
    objectType: ObjectType.ElectronApp,
    rebind({ firstWindow, sessionRpc }) {
      currentFirstWindow = firstWindow
      currentSessionRpc = sessionRpc
    },
    rpc: electronRpc,
    waitForIframe({ injectUtilityScript = true, url }) {
      return WaitForIframe.waitForIframe({
        browserRpc,
        createPage: Page.create,
        electronObjectId,
        electronRpc,
        idleTimeout,
        injectUtilityScript,
        sessionRpc: currentSessionRpc,
        url,
      })
    },
    waitForPage({ injectUtilityScript = true, sessionId }) {
      return WaitForPage.waitForPage({
        browserRpc,
        createPage: Page.create,
        electronObjectId,
        electronRpc,
        idleTimeout,
        injectUtilityScript,
        sessionId,
      })
    },
    windows: [],
  }
}
