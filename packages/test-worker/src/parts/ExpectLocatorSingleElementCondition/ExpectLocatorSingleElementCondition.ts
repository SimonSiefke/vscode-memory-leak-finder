import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'
import * as IsDevtoolsInternalError from '../IsDevtoolsInternalError/IsDevtoolsInternalError.ts'

export const checkSingleElementCondition = async (fnName, locator, options = {}) => {
  while (true) {
    try {
      await EvaluateInUtilityContext.evaluateInUtilityContext(
        {
          arguments: [
            {
              value: {
                hasText: locator.hasText,
                nth: -1,
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
          functionDeclaration: '(locator, fnName, options) => test.checkSingleElementCondition(locator, fnName, options)',
        },
        locator,
      )
      return
    } catch (error) {
      if (IsDevtoolsInternalError.isDevtoolsInternalError(error)) {
        console.info(`[single element condition devtools internal error] ${error}`)
      } else {
        throw error
      }
    }
  }
}
