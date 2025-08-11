import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const toBeHidden = async (locator, options = {}) => {
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, options) => test.checkHidden(locator, options)',
      arguments: [
        {
          value: {
            selector: locator.selector,
            nth: locator.nth,
          },
        },
        {
          value: options,
        },
      ],
      awaitPromise: true,
    },
    locator.sessionId,
  )
}
