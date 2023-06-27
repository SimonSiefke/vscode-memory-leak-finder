import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.js'
import * as ObjectType from '../ObjectType/ObjectType.js'
import * as PageClose from '../PageClose/PageClose.js'
import * as PageEvaluate from '../PageEvaluate/PageEvaluate.js'
import * as PageReload from '../PageReload/PageReload.js'
import * as WebWorker from '../WebWorker/WebWorker.js'

export const create = async ({ electronRpc, electronObjectId, targetId, sessionId, rpc }) => {
  return {
    type: DevtoolsTargetType.Page,
    sessionId,
    targetId,
    rpc,
    electronRpc,
    electronObjectId,
    async evaluate({ expression, awaitPromise = false, replMode = false }) {
      return PageEvaluate.evaluate(this.rpc, {
        expression,
        awaitPromise,
        replMode,
      })
    },
    async reload() {
      return PageReload.reload(this.rpc)
    },
    async close() {
      return PageClose.close(this.rpc)
    },
    webWorker() {
      return WebWorker.waitForWebWorker({ sessionId })
    },
    locator(selector) {
      return {
        type: ObjectType.Locator,
        selector,
        sessionId,
      }
    },
  }
}
