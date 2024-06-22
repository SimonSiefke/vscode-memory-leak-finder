import * as Assert from '../Assert/Assert.js'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const clickExponential = async (locator, options) => {
  Assert.object(locator)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(options) => test.clickExponential(options)',
      arguments: [
        {
          value: {
            locator,
            ...options,
          },
        },
      ],
      awaitPromise: true,
    },
    locator.sessionId,
  )
}
