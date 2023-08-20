import * as Assert from '../Assert/Assert.js'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const getTextContent = async (locator) => {
  Assert.object(locator)
  const text = await EvaluateInUtilityContext.evaluateInUtilityContext({
    functionDeclaration: '(locator) => test.getTextContent(locator)',
    arguments: [
      {
        value: locator,
      },
    ],
    awaitPromise: true,
  })
  return text
}
