import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.js'
import * as ObjectType from '../ObjectType/ObjectType.js'
import * as PageClick from '../PageClick/PageClick.js'
import * as PageClose from '../PageClose/PageClose.js'
import * as PageEvaluate from '../PageEvaluate/PageEvaluate.js'
import * as PageKeyBoard from '../PageKeyBoard/PageKeyBoard.js'
import * as PageReload from '../PageReload/PageReload.js'
import * as PageType from '../PageType/PageType.js'
import * as WebWorker from '../WebWorker/WebWorker.js'

export const create = async ({ electronRpc, electronObjectId, targetId, sessionId, rpc }) => {
  return {
    type: DevtoolsTargetType.Page,
    objectType: DevtoolsTargetType.Page,
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
    pressKeyExponential(options) {
      return PageKeyBoard.pressKeyExponential(options)
    },
    webWorker() {
      return WebWorker.waitForWebWorker({ sessionId })
    },
    locator(selector, { hasText = '' } = {}) {
      return {
        objectType: ObjectType.Locator,
        selector,
        sessionId,
        hasText,
        nth(value) {
          return {
            ...this,
            selector: `${this.selector}:nth-of-type(${value + 1})`,
          }
        },
        first() {
          return {
            ...this,
            selector: `${this.selector}:nth-of-type(${1})`,
          }
        },
        locator(selector) {
          return {
            ...this,
            selector: `${this.selector} ${selector}`,
          }
        },
        type(text) {
          return PageType.type(
            {
              selector: this.selector,
            },
            text
          )
        },
        click() {
          return PageClick.click({
            selector: this.selector,
            hasText: this.hasText,
          })
        },
        dblclick() {
          return PageClick.dblclick({
            selector: this.selector,
          })
        },
      }
    },
  }
}
