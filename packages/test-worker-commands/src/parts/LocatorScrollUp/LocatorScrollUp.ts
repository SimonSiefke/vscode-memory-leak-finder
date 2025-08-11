import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const scrollUp = async (locator, options = {}) => {
  Assert.object(locator)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
      arguments: [
        {
          value: locator,
        },
        {
          value: 'scrollUp',
        },
        {
          value: {
            bubbles: true,
            ...options,
          },
        },
      ],
      awaitPromise: true,
    },
    locator.sessionId,
  )
}
