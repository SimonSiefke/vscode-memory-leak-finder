import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'
import { waitForUtilityExecutionContext } from '../WaitForUtilityExecutionContext/WaitForUtilityExecutionContext.ts'

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

  await DevtoolsProtocolPage.createIsolatedWorld(rpc, {
    frameId: frameId,
    worldName: utilityExecutionContextName,
  })

  const utilityContext = await executionContextPromise
  await DevtoolsProtocolRuntime.disable(rpc)

  const utilityScript = await UtilityScript.getUtilityScript()
  await DevtoolsProtocolRuntime.evaluate(rpc, {
    uniqueContextId: utilityContext.uniqueId,
    expression: utilityScript,
  })
  return utilityContext
}
