import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const setChecked = async (locator, value: boolean): Promise<void> => {
  Assert.object(locator)
  if (typeof value !== 'boolean') {
<<<<<<< HEAD
    throw new Error(`setChecked expects a boolean value, got ${typeof value}`)
  }
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
=======
    throw new TypeError(`setChecked expects a boolean value, got ${typeof value}`)
  }
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
>>>>>>> origin/main
      arguments: [
        {
          value: locator,
        },
        {
          value: 'setChecked',
        },
        {
          value: {
            value,
          },
        },
      ],
      awaitPromise: true,
<<<<<<< HEAD
=======
      functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
>>>>>>> origin/main
    },
    locator,
  )
}
