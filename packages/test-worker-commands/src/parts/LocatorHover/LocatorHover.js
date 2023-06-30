import * as Assert from '../Assert/Assert.js'
import * as DevtoolsProtocolRuntime from '../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as SessionState from '../SessionState/SessionState.js'

// TODO duplicate code
// TODO pass page session as parameter
export const hover = async (locator) => {
  Assert.object(locator)
  const pageSession = SessionState.getPageSession()
  if (!pageSession) {
    throw new Error('no page found')
  }
  const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(pageSession.sessionId)
  if (!utilityExecutionContext) {
    throw new Error(`no utility execution context found`)
  }
  await DevtoolsProtocolRuntime.callFunctionOn(pageSession.rpc, {
    functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
    arguments: [
      {
        value: locator,
      },
      {
        value: 'hover',
      },
      {
        value: {
          bubbles: true,
        },
      },
    ],
    executionContextId: utilityExecutionContext.id, // TODO move to uniqueid once supported
    // uniqueContextId: utilityExecutionContext.uniqueId,
    awaitPromise: true,
  })
}

export const dblclick = async (locator) => {
  Assert.object(locator)
  const pageSession = SessionState.getPageSession()
  if (!pageSession) {
    throw new Error('no page found')
  }
  const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(pageSession.sessionId)
  if (!utilityExecutionContext) {
    throw new Error(`no utility execution context found`)
  }
  await DevtoolsProtocolRuntime.callFunctionOn(pageSession.rpc, {
    functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
    arguments: [
      {
        value: locator,
      },
      {
        value: 'dblclick',
      },
      {
        value: {
          bubbles: true,
        },
      },
    ],
    executionContextId: utilityExecutionContext.id, // TODO move to uniqueid once supported
    // uniqueContextId: utilityExecutionContext.uniqueId,
    awaitPromise: true,
  })
}
