import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const press = async (locator, key) => {
  Assert.object(locator)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: locator,
        },
        {
          value: 'press',
        },
        {
          value: {
            bubbles: true,
            key,
          },
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
    },
    locator,
  )
}
