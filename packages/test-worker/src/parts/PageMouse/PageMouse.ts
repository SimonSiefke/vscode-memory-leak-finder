import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const mockPointerEvents = async (rpc, utilityContext) => {
  Assert.object(rpc)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: `() => {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}`,
      arguments: [],
      awaitPromise: true,
    },
    {
      rpc,
      utilityContext,
    },
  )
}
export const down = async (rpc, utilityContext) => {
  Assert.object(rpc)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(key) => test.mouseDown(key)',
      arguments: [],
      awaitPromise: true,
    },
    {
      rpc,
      utilityContext,
    },
  )
}

export const move = async (rpc, utilityContext, x, y) => {
  Assert.object(rpc)
  Assert.number(x)
  Assert.number(y)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(x,y) => test.mouseMove(x,y)',
      arguments: [
        {
          value: x,
        },
        {
          value: y,
        },
      ],
      awaitPromise: true,
    },
    {
      rpc,
      utilityContext,
    },
  )
}

export const up = async (rpc, utilityContext) => {
  Assert.object(rpc)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, fnName, options) => test.mouseUp(locator, fnName, options)',
      arguments: [],
      awaitPromise: true,
    },
    {
      rpc,
      utilityContext,
    },
  )
}
