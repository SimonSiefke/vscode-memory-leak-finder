import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

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
