import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const getAttribute = async (locator, attributeName) => {
  Assert.object(locator)
  Assert.string(attributeName)
  const attributeValue = await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: locator,
        },
        {
          value: attributeName,
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(locator, attributeName) => test.getAttribute(locator, attributeName)',
    },
    locator,
  )
  return attributeValue
}
