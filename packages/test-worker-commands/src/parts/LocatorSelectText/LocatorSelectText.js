import * as Assert from '../Assert/Assert.js'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const selectText = async (locator) => {
  Assert.object(locator)
  await EvaluateInUtilityContext.evaluateInUtilityContext({
    functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
    arguments: [
      {
        value: locator,
      },
      {
        value: 'selectText',
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
