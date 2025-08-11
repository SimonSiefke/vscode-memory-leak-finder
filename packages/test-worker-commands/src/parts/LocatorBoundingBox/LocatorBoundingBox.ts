import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const boundingBox = async (locator) => {
  Assert.object(locator)
  // TODO ask for bounding box
  const boundingBox = await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator) => test.boundingBox(locator)',
      arguments: [
        {
          value: locator,
        },
      ],
      awaitPromise: true,
      returnByValue: true,
    },
    locator.sessionId,
  )
  return boundingBox
}
