import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

// TODO duplicate code
// TODO pass page session as parameter
export const hover = async (locator, options) => {
  Assert.object(locator)
  Assert.object(options)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: locator,
        },
        {
          value: 'hover',
        },
        {
          value: {
            bubbles: true,
            ...options,
          },
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
    },
    locator,
  )
}
