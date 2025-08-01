import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.js'
import * as Locator from '../Locator/Locator.js'
import * as PageBlur from '../PageBlur/PageBlur.js'
import * as PageClose from '../PageClose/PageClose.js'
import * as PageEvaluate from '../PageEvaluate/PageEvaluate.js'
import * as PageFocus from '../PageFocus/PageFocus.js'
import * as PageKeyBoard from '../PageKeyBoard/PageKeyBoard.js'
import * as PageReload from '../PageReload/PageReload.js'
import * as PageMouse from '../PageMouse/PageMouse.js'
import * as PageWaitForIdle from '../PageWaitForIdle/PageWaitForIdle.js'
import * as WebWorker from '../WebWorker/WebWorker.js'

const createKeyboard = (rpc) => {
  return {
    rpc,
    press(key) {
      return PageKeyBoard.press(this.rpc, key)
    },
    type(text) {
      return PageKeyBoard.type(this.rpc, text)
    },
    pressKeyExponential(options) {
      return PageKeyBoard.pressKeyExponential(options)
    },
    contentEditableInsert(options) {
      return PageKeyBoard.contentEditableInsert(options)
    },
  }
}

const createMouse = (rpc) => {
  return {
    rpc,
    down() {
      return PageMouse.down(this.rpc)
    },
    move(x, y) {
      return PageMouse.move(this.rpc, x, y)
    },
    up() {
      return PageMouse.up(this.rpc)
    },
    mockPointerEvents() {
      return PageMouse.mockPointerEvents(this.rpc)
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
    async waitForIdle() {
      return PageWaitForIdle.waitForIdle(this.rpc, this.electronRpc.canUseIdleCallback)
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
    mouse: createMouse(rpc),
    webWorker() {
      return WebWorker.waitForWebWorker({ sessionId })
    },
    locator(selector, options = {}) {
      return Locator.create(this.rpc, this.sessionId, selector, options)
    },
    blur() {
      return PageBlur.blur({
        electronRpc: this.electronRpc,
        electronObjectId: this.electronObjectId,
      })
    },
    focus() {
      return PageFocus.focus({
        electronRpc: this.electronRpc,
      })
    },
    frameLocator(selector, options = {}) {
      return Locator.create(this.rpc, this.sessionId, `${selector}:internal-enter-frame()`, options)
    },
  }
}
