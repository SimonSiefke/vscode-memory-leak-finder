import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const press = async (rpc, utilityContext, key) => {
  Assert.object(rpc)
  Assert.string(key)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(key) => test.pressKey(key)',
      arguments: [
        {
          value: key,
        },
      ],
      awaitPromise: true,
    },
    {
      utilityContext,
      rpc,
    },
  )
}

export const type = async (rpc, utilityContext, text) => {
  Assert.object(rpc)
  Assert.string(text)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(text) => test.type(text)',
      arguments: [
        {
          value: text,
        },
      ],
      awaitPromise: true,
    },
    {
      utilityContext,
      rpc,
    },
  )
}

export const pressKeyExponential = async (rpc, utilityContext, options) => {
  Assert.object(options)
  Assert.string(options.key)
  Assert.object(options.waitFor)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(locator, fnName, options) => test.pressKeyExponential(locator, fnName, options)',
      arguments: [
        {
          value: options,
        },
      ],
      awaitPromise: true,
    },
    {
      utilityContext,
      rpc,
    },
  )

  // TODO
}

export const contentEditableInsert = async (utilityContext, rpc, options) => {
  Assert.object(options)
  Assert.string(options.value)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      functionDeclaration: '(options) => test.contentEditableInsert(options)',
      arguments: [
        {
          value: options,
        },
      ],
      awaitPromise: true,
    },
    {
      utilityContext,
      rpc,
    },
  )
}
