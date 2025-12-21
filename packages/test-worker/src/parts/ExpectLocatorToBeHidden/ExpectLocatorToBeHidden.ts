import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const toBeHidden = async (locator, options = {}) => {
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: {
            nth: locator.nth,
            selector: locator.selector,
          },
        },
        {
          value: options,
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(locator, options) => test.checkHidden(locator, options)',
    },
    locator,
  )
}
