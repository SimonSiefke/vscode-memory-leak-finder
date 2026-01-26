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
import * as WaitForIframe from '../WaitForIframe/WaitForIframe.ts'
import { waitForSubIframe } from '../WaitForSubIframe/WaitForSubIframe.ts'
import * as WebWorker from '../WebWorker/WebWorker.ts'

const createKeyboard = (rpc, utilityContext) => {
  return {
    contentEditableInsert(options) {
      return PageKeyBoard.contentEditableInsert(this.rpc, this.utilityContext, options)
    },
    press(key) {
      return PageKeyBoard.press(this.rpc, this.utilityContext, key)
    },
    pressKeyExponential(options) {
      return PageKeyBoard.pressKeyExponential(this.rpc, this.utilityContext, options)
    },
    rpc,
    type(text) {
      return PageKeyBoard.type(this.rpc, this.utilityContext, text)
    },
    utilityContext,
  }
}

const createMouse = (rpc, utilityContext) => {
  return {
    down() {
      return PageMouse.down(this.rpc, this.utilityContext)
    },
    mockPointerEvents() {
      return PageMouse.mockPointerEvents(this.rpc, this.utilityContext)
    },
    move(x, y) {
      return PageMouse.move(this.rpc, this.utilityContext, x, y)
    },
    rpc,
    up() {
      return PageMouse.up(this.rpc, this.utilityContext)
    },
    utilityContext,
  }
}

export const create = ({
  browserRpc,
  electronObjectId,
  electronRpc,
  idleTimeout,
  rpc,
  sessionId,
  sessionRpc,
  targetId,
  utilityContext,
}) => {
  return {
    blur() {
      return PageBlur.blur({
        electronObjectId: this.electronObjectId,
        electronRpc: this.electronRpc,
      })
    },
    browserRpc,
    async close() {
      return PageClose.close(this.rpc)
    },
    electronObjectId,
    electronRpc,
    async evaluate({ awaitPromise = false, expression, replMode = false }) {
      return PageEvaluate.evaluate(this.rpc, {
        awaitPromise,
        expression,
        replMode,
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
    keyboard: createKeyboard(sessionRpc, utilityContext),
    locator(selector, options = {}) {
      return Locator.create(this.rpc, this.sessionId, selector, options, this.utilityContext)
    },
    mouse: createMouse(sessionRpc, utilityContext),
    objectType: DevtoolsTargetType.Page,
    pressKeyExponential(options) {
      return PageKeyBoard.pressKeyExponential(this.sessionRpc, utilityContext, options)
    },
    async reload() {
      return PageReload.reload(this.rpc)
    },
    rpc,
    sessionId,
    sessionRpc,
    targetId,
    type: DevtoolsTargetType.Page,
    utilityContext,
    async waitForIdle() {
      return PageWaitForIdle.waitForIdle(this.rpc, this.electronRpc.canUseIdleCallback, idleTimeout)
    },
    waitForIframe({ injectUtilityScript = true, url }) {
      return WaitForIframe.waitForIframe({
        browserRpc,
        createPage: create,
        electronObjectId,
        electronRpc,
        idleTimeout,
        injectUtilityScript,
        sessionRpc,
        url,
      })
    },
    waitForPage({ injectUtilityScript = true, sessionId }) {
      return WaitForIframe.waitForPage({
        browserRpc,
        createPage: create,
        electronObjectId,
        electronRpc,
        idleTimeout,
        injectUtilityScript,
        sessionId,
      })
    },
    waitForSubIframe({ injectUtilityScript = true, url }) {
      return waitForSubIframe({
        browserRpc,
        createPage: create,
        electronObjectId,
        electronRpc,
        idleTimeout,
        injectUtilityScript,
        sessionRpc,
        url,
      })
    },
    webWorker() {
      return WebWorker.waitForWebWorker({ sessionId })
    },
  }
}
