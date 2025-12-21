import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const blur = async (locator) => {
  Assert.object(locator)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: locator,
        },
        {
          value: 'blur',
        },
        {
          value: {},
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
    },
    locator,
  )
}
