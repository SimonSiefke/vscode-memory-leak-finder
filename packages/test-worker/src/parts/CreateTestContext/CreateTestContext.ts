import { addUtilityExecutionContext } from '../AddUtilityExecutionContext/AddUtilityExecutionContext.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ElectronApp from '../ElectronApp/ElectronApp.ts'
import * as Expect from '../Expect/Expect.ts'
import * as Page from '../Page/Page.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import { VError } from '../VError/VError.ts'

const pageObjectUrl = new URL('../../../../page-object/src/main.ts', import.meta.url).href

export const createDefaultContext = (sessionRpc, utilityContext) => ({
  callFunctionOn(options) {
    return DevtoolsProtocolRuntime.evaluate(sessionRpc, {
      ...options,
      ...(utilityContext.uniqueId ? { uniqueContextId: utilityContext.uniqueId } : { contextId: utilityContext.id }),
    })
  },
})

export const createUtilityContext = (sessionRpc, utilityContext) => ({
  callFunctionOn(options) {
    return DevtoolsProtocolRuntime.callFunctionOn(sessionRpc, {
      ...options,
      ...(utilityContext.uniqueId ? { uniqueContextId: utilityContext.uniqueId } : { executionContextId: utilityContext.id }),
    })
  },
  evaluate(options) {
    return DevtoolsProtocolRuntime.evaluate(sessionRpc, {
      ...options,
      ...(utilityContext.uniqueId ? { uniqueContextId: utilityContext.uniqueId } : { contextId: utilityContext.id }),
    })
  },
})

export const createPageObjectContext = ({
  browserRpc,
  electronObjectId,
  electronRpc,
  idleTimeout,
  page,
  sessionRpc,
  utilityContext,
  ideVersion,
  platform,
  workspacePath,
}: any): any => ({
  browserRpc,
  defaultContext: createDefaultContext(sessionRpc, utilityContext),
  electronApp: ElectronApp.create({ browserRpc, electronObjectId, electronRpc, firstWindow: page, idleTimeout, sessionRpc }),
  evaluateInDefaultContext() {
    throw new Error('not implemented')
  },
  evaluateInUtilityContext() {},
  expect: Expect.expect,
  ideVersion,
  page,
  platform,
  reconnectDevtools: undefined,
  sessionRpc,
  utilityContext: createUtilityContext(sessionRpc, utilityContext),
  ...(workspacePath ? { workspacePath } : {}),
  VError,
})

// Create the same page API as regular scenarios, without relaunching or modifying
// the measured profile. Call after the startup completion boundary.
export const createTestContext = async ({
  renderer,
  main,
  workspacePath,
  ideVersion,
}: {
  renderer: any
  main: any
  workspacePath: string
  ideVersion: { major: number; minor: number; patch: number }
}) => {
  const { frameTree } = await DevtoolsProtocolPage.getFrameTree(renderer)
  const utilityContext = await addUtilityExecutionContext(renderer, 'utility', frameTree.frame.id)
  const raw = await main.invoke('Runtime.evaluate', {
    expression: `globalThis._____electron = typeof require === 'function' ? require('electron') : process.getBuiltinModule('module').createRequire(process.cwd() + '/package.json')('electron')`,
  })
  if (raw.error || raw.result.exceptionDetails) throw new Error('Cannot initialize Electron page context')
  const electronObjectId = raw.result.result.objectId
  const page = Page.create({
    browserRpc: renderer,
    electronObjectId,
    electronRpc: main,
    idleTimeout: 0,
    rpc: renderer,
    sessionId: renderer.sessionId,
    sessionRpc: renderer,
    targetId: '',
    utilityContext,
  })
  const context = createPageObjectContext({
    browserRpc: renderer,
    electronObjectId,
    electronRpc: main,
    idleTimeout: 0,
    ideVersion,
    page,
    platform: process.platform,
    sessionRpc: renderer,
    utilityContext,
    workspacePath,
  })
  const { create } = await import(pageObjectUrl)
  const api = await create(context)
  PageObjectState.set(1, api, context)
  return { api, dispose: () => PageObjectState.deletePageObject(1) }
}
