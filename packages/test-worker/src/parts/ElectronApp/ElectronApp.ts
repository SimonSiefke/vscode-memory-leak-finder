import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'
import * as WaitForIframe from '../WaitForIframe/WaitForIframe.ts'
import * as WaitForPage from '../WaitForPage/WaitForPage.ts'

export const create = ({ electronRpc, electronObjectId, idleTimeout }) => {
  return {
    objectType: ObjectType.ElectronApp,
    rpc: electronRpc,
    electronObjectId,
    windows: [],
    firstWindow() {
      return WaitForPage.waitForPage({ index: 0, electronRpc, electronObjectId, idleTimeout })
    },
    secondWindow() {
      return WaitForPage.waitForPage({ index: 1, electronRpc, electronObjectId, idleTimeout })
    },
    thirdWindow() {
      return WaitForPage.waitForPage({ index: 2, electronRpc, electronObjectId, idleTimeout })
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
      })
    },
  }
}
