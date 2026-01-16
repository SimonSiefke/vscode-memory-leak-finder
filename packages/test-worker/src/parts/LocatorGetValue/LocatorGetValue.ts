import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const getValue = async (locator) => {
  Assert.object(locator)
  return await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: locator,
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(locator) => test.getValue(locator)',
    },
    locator,
  )
}
