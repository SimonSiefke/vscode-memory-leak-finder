import * as Assert from '../Assert/Assert.js'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const isVisible = async (locator) => {
  Assert.object(locator)
  const value = await EvaluateInUtilityContext.evaluateInUtilityContext({
    functionDeclaration: '(locator) => test.isVisible(locator)',
    arguments: [
      {
        value: locator,
      },
    ],
    awaitPromise: true,
    returnByValue: true,
  })
  return value
}
