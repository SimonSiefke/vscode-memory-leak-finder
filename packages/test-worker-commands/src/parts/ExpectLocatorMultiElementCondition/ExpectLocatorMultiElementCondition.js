import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const checkMultiElementCondition = async (fnName, locator, options = {}) => {
  await EvaluateInUtilityContext.evaluateInUtilityContext({
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
  })

  // TODO
}
