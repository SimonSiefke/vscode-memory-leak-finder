import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

/**
 * @deprecated use Locator.fill instead
 */
export const type = async (locator, text) => {
  Assert.object(locator)
  Assert.string(text)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
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
      functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
    },
    locator,
  )
}

export const typeAndWaitFor = async (locator, text, waitFor, options) => {
  Assert.object(locator)
  Assert.string(text)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: { locator, text, waitFor, ...options },
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(options) => test.typeAndWaitFor(options)',
    },
    locator,
  )
}
