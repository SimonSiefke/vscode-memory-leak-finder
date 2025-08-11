import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const isVisible = async (locator) => {
  Assert.object(locator)
  const value = await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator) => test.isVisible(locator)',
      arguments: [
        {
          value: locator,
        },
      ],
      awaitPromise: true,
      returnByValue: true,
    },
    locator.sessionId,
  )
  return value
}
