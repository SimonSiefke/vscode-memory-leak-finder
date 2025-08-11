import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const setValue = async (locator, text) => {
  Assert.object(locator)
  Assert.string(text)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
      arguments: [
        {
          value: locator,
        },
        {
          value: 'setValue',
        },
        {
          value: {
            text,
          },
        },
      ],
      awaitPromise: true,
    },
    locator.sessionId,
  )
}
