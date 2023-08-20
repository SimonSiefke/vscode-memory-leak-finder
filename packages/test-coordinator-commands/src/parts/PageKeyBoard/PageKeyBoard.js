import * as Assert from '../Assert/Assert.js'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const press = async (rpc, key) => {
  Assert.object(rpc)
  Assert.string(key)
  await EvaluateInUtilityContext.evaluateInUtilityContext({
    functionDeclaration: '(key) => test.pressKey(key)',
    arguments: [
      {
        value: key,
      },
    ],
    awaitPromise: true,
  })
}

export const pressKeyExponential = async (options) => {
  Assert.object(options)
  Assert.string(options.key)
  Assert.object(options.waitFor)
  await EvaluateInUtilityContext.evaluateInUtilityContext({
    functionDeclaration: '(locator, fnName, options) => test.pressKeyExponential(locator, fnName, options)',
    arguments: [
      {
        value: options,
      },
    ],
    awaitPromise: true,
  })

  // TODO
}
