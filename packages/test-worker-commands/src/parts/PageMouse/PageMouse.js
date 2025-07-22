import * as Assert from '../Assert/Assert.js'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.js'

export const down = async (rpc) => {
  Assert.object(rpc)
  await EvaluateInUtilityContext.evaluateInUtilityContext({
    functionDeclaration: '(key) => test.mouseDown(key)',
    arguments: [],
    awaitPromise: true,
  })
}

export const move = async (rpc, x, y) => {
  Assert.object(rpc)
  Assert.number(x)
  Assert.number(y)
  await EvaluateInUtilityContext.evaluateInUtilityContext({
    functionDeclaration: '(text) => test.mouseMove(text)',
    arguments: [
      {
        value: x,
      },
      {
        value: y,
      },
    ],
    awaitPromise: true,
  })
}

export const up = async (rpc) => {
  Assert.object(rpc)
  await EvaluateInUtilityContext.evaluateInUtilityContext({
    functionDeclaration: '(locator, fnName, options) => test.mouseUp(locator, fnName, options)',
    arguments: [],
    awaitPromise: true,
  })
}
