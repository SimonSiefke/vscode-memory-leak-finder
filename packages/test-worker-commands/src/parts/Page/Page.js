import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.js'
import * as ObjectType from '../ObjectType/ObjectType.js'
import * as PageClick from '../PageClick/PageClick.js'
import * as PageClose from '../PageClose/PageClose.js'
import * as PageEvaluate from '../PageEvaluate/PageEvaluate.js'
import * as PageKeyBoard from '../PageKeyBoard/PageKeyBoard.js'
import * as PageReload from '../PageReload/PageReload.js'
import * as PageTextContent from '../PageTextContent/PageTextContent.js'
import * as PageType from '../PageType/PageType.js'
import * as PageCount from '../PageCount/PageCount.js'
import * as WebWorker from '../WebWorker/WebWorker.js'

const createKeyboard = (rpc) => {
  return {
    rpc,
    press(key) {
      return PageKeyBoard.press(this.rpc, key)
    },
    pressKeyExponential(options) {
      return PageKeyBoard.pressKeyExponential(options)
    },
  }
}

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
    keyboard: createKeyboard(rpc),
    webWorker() {
      return WebWorker.waitForWebWorker({ sessionId })
    },
    locator(selector, { hasText = '', nth = -1 } = {}) {
      return {
        objectType: ObjectType.Locator,
        selector,
        sessionId,
        hasText,
        _nth: nth,
        nth(value) {
          return {
            ...this,
            selector: `${this.selector}`,
            _nth: value + 1,
          }
        },
        first() {
          return {
            ...this,
            selector: `${this.selector}`,
            _nth: 1,
          }
        },
        count() {
          return PageCount.count({
            selector: this.selector,
          })
        },
        locator(selector, { hasText = '', nth = -1 } = {}) {
          return {
            ...this,
            selector: `${this.selector} ${selector}`,
            hasText,
            _nth: nth,
          }
        },
        type(text) {
          return PageType.type(
            {
              selector: this.selector,
              hasText: this.hasText,
              _nth: this._nth,
            },
            text
          )
        },
        click() {
          return PageClick.click({
            selector: this.selector,
            hasText: this.hasText,
            _nth: this._nth,
          })
        },
        dblclick() {
          return PageClick.dblclick({
            selector: this.selector,
            hasText: this.hasText,
            _nth: this._nth,
          })
        },
        textContent() {
          return PageTextContent.getTextContent({
            selector: this.selector,
            hasText: this.hasText,
            _nth: this._nth,
          })
        },
      }
    },
  }
}
