import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'
import { waitForUtilityExecutionContext } from '../WaitForUtilityExecutionContext/WaitForUtilityExecutionContext.ts'

export const addUtilityExecutionContext = async (rpc, utilityExecutionContextName, frameId) => {
  const executionContextPromise = waitForUtilityExecutionContext(rpc, utilityExecutionContextName)
  await DevtoolsProtocolPage.createIsolatedWorld(rpc, {
    frameId: frameId,
    worldName: utilityExecutionContextName,
  })

  const utilityContext = await executionContextPromise
  const utilityScript = await UtilityScript.getUtilityScript()
  await DevtoolsProtocolRuntime.evaluate(rpc, {
    uniqueContextId: utilityContext.uniqueId,
    expression: utilityScript,
  })
  return utilityContext
}
