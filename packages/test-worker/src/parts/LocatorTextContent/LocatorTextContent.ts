import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const getTextContent = async (locator, { allowHidden }) => {
  Assert.object(locator)
  const text = await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, options) => test.getTextContent(locator, options)',
      arguments: [
        {
          value: locator,
        },
        {
          value: {
            allowHidden,
          },
        },
      ],
      awaitPromise: true,
    },
    locator,
  )
  return text
}
