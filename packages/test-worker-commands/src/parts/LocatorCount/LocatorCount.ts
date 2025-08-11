import * as Assert from '../Assert/Assert.js'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const count = async (locator) => {
  Assert.object(locator)
  const value = await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, options) => test.count(locator, options)',
      arguments: [
        {
          value: locator,
        },
        {
          value: {},
        },
      ],
      awaitPromise: true,
      returnByValue: true,
    },
    locator.sessionId,
  )
  return value
}
