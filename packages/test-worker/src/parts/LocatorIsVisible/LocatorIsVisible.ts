import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const isVisible = async (locator) => {
  Assert.object(locator)
  const value = await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: locator,
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(locator) => test.isVisible(locator)',
      returnByValue: true,
    },
    locator,
  )
  return value
}
