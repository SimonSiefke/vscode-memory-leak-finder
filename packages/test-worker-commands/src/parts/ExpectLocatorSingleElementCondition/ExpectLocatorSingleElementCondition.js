import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const checkSingleElementCondition = async (fnName, locator, options = {}) => {
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, fnName, options) => test.checkSingleElementCondition(locator, fnName, options)',
      arguments: [
        {
          value: {
            selector: locator.selector,
            nth: -1,
            hasText: locator.hasText,
          },
        },
        {
          value: fnName,
        },
        {
          value: options,
        },
      ],
      awaitPromise: true,
    },
    locator.sessionId,
  )

  // TODO
}
