import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'
import * as Page from '../Page/Page.ts'
import * as WaitForIframe from '../WaitForIframe/WaitForIframe.ts'

export const create = ({ browserRpc, electronObjectId, electronRpc, firstWindow, idleTimeout, sessionRpc }) => {
  return {
    electronObjectId,
    evaluate(expression) {
      return DevtoolsProtocolRuntime.evaluate(this.rpc, {
        expression,
        returnByValue: true,
      })
    },
    firstWindow() {
      return firstWindow
    },
    objectType: ObjectType.ElectronApp,
    rpc: electronRpc,
    waitForIframe({ injectUtilityScript = true, url }) {
      return WaitForIframe.waitForIframe({
        browserRpc,
        createPage: Page.create,
        electronObjectId,
        electronRpc,
        idleTimeout,
        injectUtilityScript,
        sessionRpc,
        url,
      })
    },
    windows: [],
  }
}
