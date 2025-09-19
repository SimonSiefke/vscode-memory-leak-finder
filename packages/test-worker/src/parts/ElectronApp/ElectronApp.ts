import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'
import * as WaitForIframe from '../WaitForIframe/WaitForIframe.ts'

export const create = ({ electronRpc, electronObjectId, idleTimeout, firstWindow }) => {
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
      })
    },
  }
}
