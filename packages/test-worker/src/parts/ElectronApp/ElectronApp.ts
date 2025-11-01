import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'
import * as WaitForIframe from '../WaitForIframe/WaitForIframe.ts'
import * as Page from '../Page/Page.ts'

export const create = ({ electronRpc, electronObjectId, idleTimeout, firstWindow, browserRpc, sessionRpc }) => {
  return {
    objectType: ObjectType.ElectronApp,
    rpc: electronRpc,
    electronObjectId,
    windows: [],
    firstWindow() {
      return firstWindow
    },
    evaluate(expression) {
      return DevtoolsProtocolRuntime.evaluate(this.rpc, {
        expression,
      })
    },
    waitForIframe({ url }) {
      return WaitForIframe.waitForIframe({
        electronObjectId,
        electronRpc,
        url,
        idleTimeout,
        browserRpc,
        sessionRpc,
        createPage: Page.create,
      })
    },
  }
}
