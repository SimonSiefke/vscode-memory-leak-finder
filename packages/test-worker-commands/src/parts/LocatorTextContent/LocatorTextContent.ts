import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const getTextContent = async (locator) => {
  Assert.object(locator)
  const text = await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator) => test.getTextContent(locator)',
      arguments: [
        {
          value: locator,
        },
      ],
      awaitPromise: true,
    },
    locator.sessionId,
  )
  return text
}
