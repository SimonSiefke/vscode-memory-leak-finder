import { addUtilityExecutionContext } from '../AddUtilityExecutionContext/AddUtilityExecutionContext.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
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

const createKeyboard = (rpc: any, utilityContext: any) => {
  return {
    contentEditableInsert(options: any) {
      return PageKeyBoard.contentEditableInsert(this.rpc, this.utilityContext, options)
    },
    press(key: string) {
      return PageKeyBoard.press(this.rpc, this.utilityContext, key)
    },
    pressKeyExponential(options: any) {
      return PageKeyBoard.pressKeyExponential(this.rpc, this.utilityContext, options)
    },
    rpc,
    type(text: string) {
      return PageKeyBoard.type(this.rpc, this.utilityContext, text)
    },
    utilityContext,
  }
}

const createMouse = (rpc: any, utilityContext: any) => {
  return {
    down() {
      return PageMouse.down(this.rpc, this.utilityContext)
    },
    mockPointerEvents() {
      return PageMouse.mockPointerEvents(this.rpc, this.utilityContext)
    },
    move(x: any, y: any) {
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
}: any) => {
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
    async evaluate({ awaitPromise = false, expression, replMode = false }: any) {
      return PageEvaluate.evaluate(this.rpc, {
        awaitPromise,
        expression,
        replMode,
      })
    },
    async evaluateInMainWorld({ awaitPromise = false, expression, replMode = false }: any) {
      return DevtoolsProtocolRuntime.evaluate(this.rpc, {
        awaitPromise,
        expression,
        replMode,
        returnByValue: true,
      })
    },
    async evaluateInUtilityWorld({ awaitPromise = false, expression, replMode = false }: any) {
      return DevtoolsProtocolRuntime.evaluate(this.rpc, {
        awaitPromise,
        expression,
        replMode,
        returnByValue: true,
        ...(this.utilityContext.uniqueId ? { uniqueContextId: this.utilityContext.uniqueId } : { contextId: this.utilityContext.id }),
      })
    },
    focus() {
      return PageFocus.focus({
        electronRpc: this.electronRpc,
      })
    },
    frameLocator(selector: string, options = {}) {
      return Locator.create(this.rpc, this.sessionId, `${selector}:internal-enter-frame()`, options)
    },
    keyboard: createKeyboard(sessionRpc, utilityContext),
    locator(selector: string, options = {}) {
      return Locator.create(this.rpc, this.sessionId, selector, options, this.utilityContext)
    },
    mouse: createMouse(sessionRpc, utilityContext),
    objectType: DevtoolsTargetType.Page,
    pressKeyExponential(options: any) {
      return PageKeyBoard.pressKeyExponential(this.sessionRpc, utilityContext, options)
    },
    async refresh() {
      const { frameTree } = await DevtoolsProtocolPage.getFrameTree(this.sessionRpc)
      const nextUtilityContext = await addUtilityExecutionContext(this.sessionRpc, 'utility', frameTree.frame.id)
      return create({
        browserRpc,
        electronObjectId,
        electronRpc,
        idleTimeout,
        rpc: this.rpc,
        sessionId: this.sessionId,
        sessionRpc: this.sessionRpc,
        targetId: this.targetId,
        utilityContext: nextUtilityContext,
      })
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
    waitForIframe({ index = 0, injectUtilityScript = true, url }: any) {
      return WaitForIframe.waitForIframe({
        browserRpc,
        createPage: create,
        electronObjectId,
        electronRpc,
        idleTimeout,
        index,
        injectUtilityScript,
        sessionRpc,
        url,
      })
    },
    waitForPage({ injectUtilityScript = true, sessionId }: any) {
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
    waitForSubIframe({ injectUtilityScript = true, url }: any) {
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
