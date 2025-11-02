import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const checkMultiElementCondition = async (fnName, locator, options = {}) => {
  // TODO pass connection it to locator by which we can query page object
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, fnName, options) => test.checkMultiElementCondition(locator, fnName, options)',
      arguments: [
        {
          value: {
            selector: locator.selector,
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
    locator,
  )

  // TODO
}
