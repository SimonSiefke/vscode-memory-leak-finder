import * as Assert from '../Assert/Assert.js'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const type = async (locator, text) => {
  Assert.object(locator)
  Assert.string(text)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
      arguments: [
        {
          value: locator,
        },
        {
          value: 'type',
        },
        {
          value: {
            text,
          },
        },
      ],
      awaitPromise: true,
    },
    locator.sessionId,
  )
}

export const typeAndWaitFor = async (locator, text, waitFor, options) => {
  Assert.object(locator)
  Assert.string(text)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(options) => test.typeAndWaitFor(options)',
      arguments: [
        {
          value: { locator, text, waitFor, ...options },
        },
      ],
      awaitPromise: true,
    },
    locator.sessionId,
  )
}
