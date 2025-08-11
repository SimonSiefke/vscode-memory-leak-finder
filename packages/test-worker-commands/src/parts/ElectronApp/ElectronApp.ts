import * as ObjectType from '../ObjectType/ObjectType.ts'
import * as WaitForPage from '../WaitForPage/WaitForPage.ts'
import * as WaitForIframe from '../WaitForIframe/WaitForIframe.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const create = ({ electronRpc, electronObjectId }) => {
  return {
    objectType: ObjectType.ElectronApp,
    rpc: electronRpc,
    electronObjectId,
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
