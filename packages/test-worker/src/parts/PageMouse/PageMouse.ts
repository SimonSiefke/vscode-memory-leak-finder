import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const mockPointerEvents = async (rpc: any, utilityContext: any) => {
  Assert.object(rpc)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [],
      awaitPromise: true,
      functionDeclaration: `() => {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}`,
    },
    {
      rpc,
      utilityContext,
    },
  )
}
export const down = async (rpc: any, utilityContext: any) => {
  Assert.object(rpc)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [],
      awaitPromise: true,
      functionDeclaration: '(key) => test.mouseDown(key)',
    },
    {
      rpc,
      utilityContext,
    },
  )
}

export const move = async (rpc: any, utilityContext: any, x: any, y: any) => {
  Assert.object(rpc)
  Assert.number(x)
  Assert.number(y)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: x,
        },
        {
          value: y,
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(x,y) => test.mouseMove(x,y)',
    },
    {
      rpc,
      utilityContext,
    },
  )
}

export const up = async (rpc: any, utilityContext: any) => {
  Assert.object(rpc)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [],
      awaitPromise: true,
      functionDeclaration: '(locator, fnName, options) => test.mouseUp(locator, fnName, options)',
    },
    {
      rpc,
      utilityContext,
    },
  )
}
