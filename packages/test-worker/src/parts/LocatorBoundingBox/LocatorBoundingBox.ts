import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const boundingBox = async (locator) => {
  Assert.object(locator)
  // TODO ask for bounding box
  const boundingBox = await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: locator,
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(locator) => test.boundingBox(locator)',
      returnByValue: true,
    },
    locator,
  )
  return boundingBox
}
