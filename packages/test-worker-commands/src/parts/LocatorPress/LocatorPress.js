import * as Assert from '../Assert/Assert.js'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const press = async (locator, key) => {
  Assert.object(locator)
  await EvaluateInUtilityContext.evaluateInUtilityContext({
    functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
    arguments: [
      {
        value: locator,
      },
      {
        value: 'press',
      },
      {
        value: {
          key,
          bubbles: true,
        },
      },
    ],
    awaitPromise: true,
  })
}
