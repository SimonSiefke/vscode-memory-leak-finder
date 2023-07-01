import * as Assert from '../Assert/Assert.js'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const click = async (locator) => {
  Assert.object(locator)
  await EvaluateInUtilityContext.evaluateInUtilityContext({
    functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
    arguments: [
      {
        value: locator,
      },
      {
        value: 'click',
      },
      {
        value: {
          bubbles: true,
        },
      },
    ],
    awaitPromise: true,
  })
}

export const dblclick = async (locator) => {
  Assert.object(locator)
  await EvaluateInUtilityContext.evaluateInUtilityContext({
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
    awaitPromise: true,
  })
}
