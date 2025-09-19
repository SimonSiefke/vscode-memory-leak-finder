import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.ts'
import * as Locator from '../Locator/Locator.ts'
import * as PageBlur from '../PageBlur/PageBlur.ts'
import * as PageClose from '../PageClose/PageClose.ts'
import * as PageEvaluate from '../PageEvaluate/PageEvaluate.ts'
import * as PageFocus from '../PageFocus/PageFocus.ts'
import * as PageKeyBoard from '../PageKeyBoard/PageKeyBoard.ts'
import * as PageMouse from '../PageMouse/PageMouse.ts'
import * as PageReload from '../PageReload/PageReload.ts'
import * as PageWaitForIdle from '../PageWaitForIdle/PageWaitForIdle.ts'
import * as WebWorker from '../WebWorker/WebWorker.ts'

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

export const create = ({ electronRpc, electronObjectId, targetId, sessionId, rpc, idleTimeout }) => {
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
      return PageWaitForIdle.waitForIdle(this.rpc, this.electronRpc.canUseIdleCallback, idleTimeout)
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
