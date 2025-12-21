import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const getTextContent = async (locator, { allowHidden }) => {
  Assert.object(locator)
  const text = await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
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
      functionDeclaration: '(locator, options) => test.getTextContent(locator, options)',
    },
    locator,
  )
  return text
}
