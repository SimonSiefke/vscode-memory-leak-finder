import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'
import { waitForUtilityExecutionContext } from '../WaitForUtilityExecutionContext/WaitForUtilityExecutionContext.ts'

const getEvaluateContextOptions = (utilityContext: { id?: number; uniqueId?: string }) => {
  if (utilityContext.uniqueId) {
    return {
      uniqueContextId: utilityContext.uniqueId,
    }
  }
  return {
    contextId: utilityContext.id,
  }
}

const getMatchingContext = (contexts: Record<string, any>, utilityExecutionContextName: string) => {
  for (const value of Object.values(contexts)) {
    if (value.name === utilityExecutionContextName) {
      return value
    }
  }
  return undefined
}

export const addUtilityExecutionContext = async (rpc, utilityExecutionContextName, frameId) => {
  const contexts = Object.create(null)

  const executionContextPromise = waitForUtilityExecutionContext(rpc, utilityExecutionContextName, contexts)

  await DevtoolsProtocolRuntime.enable(rpc)

  const matchingContext = getMatchingContext(contexts, utilityExecutionContextName)

  if (matchingContext) {
    await DevtoolsProtocolRuntime.disable(rpc)
    return matchingContext
  }

  const createIsolatedWorldResult = await DevtoolsProtocolPage.createIsolatedWorld(rpc, {
    frameId: frameId,
    worldName: utilityExecutionContextName,
  })

  const utilityContext =
    typeof createIsolatedWorldResult?.executionContextId === 'number'
      ? {
          id: createIsolatedWorldResult.executionContextId,
          name: utilityExecutionContextName,
        }
      : await executionContextPromise
  await DevtoolsProtocolRuntime.disable(rpc)

  const utilityScript = await UtilityScript.getUtilityScript()
  await DevtoolsProtocolRuntime.evaluate(rpc, {
    expression: utilityScript,
    ...getEvaluateContextOptions(utilityContext),
  })
  return utilityContext
}
