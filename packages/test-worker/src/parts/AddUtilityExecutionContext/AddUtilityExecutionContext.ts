import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'
import { waitForUtilityExecutionContext } from '../WaitForUtilityExecutionContext/WaitForUtilityExecutionContext.ts'

type ExecutionContext = {
  readonly name: string
  readonly [key: string]: unknown
}

const getMatchingContext = (contexts: Record<string, ExecutionContext>, utilityExecutionContextName: string): ExecutionContext | undefined => {
  for (const value of Object.values(contexts)) {
    if (value.name === utilityExecutionContextName) {
      return value
    }
  }
  return undefined
}

export const addUtilityExecutionContext = async (rpc: { invoke: (method: string, ...args: readonly unknown[]) => Promise<unknown> }, utilityExecutionContextName: string, frameId: string): Promise<ExecutionContext> => {
  const contexts = Object.create(null)

  const executionContextPromise = waitForUtilityExecutionContext(rpc, utilityExecutionContextName, contexts)

  await DevtoolsProtocolRuntime.enable(rpc)

  const matchingContext = getMatchingContext(contexts, utilityExecutionContextName)

  if (matchingContext) {
    await DevtoolsProtocolRuntime.disable(rpc)
    return matchingContext
  }

  await DevtoolsProtocolPage.createIsolatedWorld(rpc, {
    frameId: frameId,
    worldName: utilityExecutionContextName,
  })

  const utilityContext = await executionContextPromise
  await DevtoolsProtocolRuntime.disable(rpc)

  const utilityScript = await UtilityScript.getUtilityScript()
  await DevtoolsProtocolRuntime.evaluate(rpc, {
    expression: utilityScript,
    uniqueContextId: utilityContext.uniqueId,
  })
  return utilityContext
}
