import * as Assert from '../Assert/Assert.ts'
import * as EvaluateInUtilityContext from '../EvaluateInUtilityContext/EvaluateInUtilityContext.ts'

export const press = async (rpc: any, utilityContext: any, key: string) => {
  Assert.object(rpc)
  Assert.string(key)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: key,
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(key) => test.pressKey(key)',
    },
    {
      rpc,
      utilityContext,
    },
  )
}

export const type = async (rpc: any, utilityContext: any, text: string) => {
  Assert.object(rpc)
  Assert.string(text)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: text,
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(text) => test.type(text)',
    },
    {
      rpc,
      utilityContext,
    },
  )
}

export const pressKeyExponential = async (rpc: any, utilityContext: any, options: any) => {
  Assert.object(options)
  Assert.string(options.key)
  Assert.object(options.waitFor)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: options,
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(locator, fnName, options) => test.pressKeyExponential(locator, fnName, options)',
    },
    {
      rpc,
      utilityContext,
    },
  )

  // TODO
}

export const contentEditableInsert = async (rpc: any, utilityContext: any, options: any) => {
  Assert.object(options)
  Assert.string(options.value)
  await EvaluateInUtilityContext.evaluateInUtilityContext(
    {
      arguments: [
        {
          value: options,
        },
      ],
      awaitPromise: true,
      functionDeclaration: '(options) => test.contentEditableInsert(options)',
    },
    {
      rpc,
      utilityContext,
    },
  )
}
