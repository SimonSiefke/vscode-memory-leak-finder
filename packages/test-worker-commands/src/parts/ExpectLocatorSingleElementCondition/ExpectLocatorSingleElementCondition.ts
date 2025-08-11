import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'
import * as IsDevtoolsInternalError from '../IsDevtoolsInternalError/IsDevtoolsInternalError.js'

export const checkSingleElementCondition = async (fnName, locator, options = {}) => {
  while (true) {
    try {
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
