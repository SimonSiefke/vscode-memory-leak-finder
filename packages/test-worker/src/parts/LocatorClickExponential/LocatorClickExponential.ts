import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const clickExponential = async (locator, options) => {
  Assert.object(locator)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: {
            locator,
            ...options,
          },
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(options) => test.clickExponential(options)',
    },
    locator,
  )
}
