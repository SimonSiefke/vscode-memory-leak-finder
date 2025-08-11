import * as Assert from '../Assert/Assert.js'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const getAttribute = async (locator, attributeName) => {
  Assert.object(locator)
  Assert.string(attributeName)
  const attributeValue = await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, attributeName) => test.getAttribute(locator, attributeName)',
      arguments: [
        {
          value: locator,
        },
        {
          value: attributeName,
        },
      ],
      awaitPromise: true,
    },
    locator.sessionId,
  )
  return attributeValue
}
