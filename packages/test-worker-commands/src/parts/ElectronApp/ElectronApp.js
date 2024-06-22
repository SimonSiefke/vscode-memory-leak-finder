import * as ObjectType from '../ObjectType/ObjectType.js'
import * as WaitForPage from '../WaitForPage/WaitForPage.js'
import * as WaitForIframe from '../WaitForIframe/WaitForIframe.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const create = ({ electronRpc, electronObjectId, callFrameId }) => {
  return {
    objectType: ObjectType.ElectronApp,
    rpc: electronRpc,
    electronObjectId,
    callFrameId,
    windows: [],
    firstWindow() {
      return WaitForPage.waitForPage({ index: 0, electronRpc, electronObjectId })
    },
    secondWindow() {
      return WaitForPage.waitForPage({ index: 1, electronRpc, electronObjectId })
    },
    thirdWindow() {
      return WaitForPage.waitForPage({ index: 2, electronRpc, electronObjectId })
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
      })
    },
  }
}
