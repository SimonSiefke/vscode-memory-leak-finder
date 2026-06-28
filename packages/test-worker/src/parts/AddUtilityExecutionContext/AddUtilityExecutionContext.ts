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

const waitForContextWithTimeout = async (promise: Promise<any>, timeout: number) => {
  const { promise: timeoutPromise, resolve } = Promise.withResolvers<undefined>()
  const timeoutRef = setTimeout(() => {
    resolve(undefined)
  }, timeout)
  try {
    const result = await Promise.race([promise, timeoutPromise])
    return result
  } finally {
    clearTimeout(timeoutRef)
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
  const utilityScript = await UtilityScript.getUtilityScript()

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

  await DevtoolsProtocolPage.addScriptToEvaluateOnNewDocument(rpc, {
    source: utilityScript,
    worldName: utilityExecutionContextName,
  })

  const createdExecutionContext = await waitForContextWithTimeout(executionContextPromise, 5000)
  const utilityContext =
    createdExecutionContext ||
    (typeof createIsolatedWorldResult?.executionContextId === 'number'
      ? {
          id: createIsolatedWorldResult.executionContextId,
          name: utilityExecutionContextName,
        }
      : await executionContextPromise)
  await DevtoolsProtocolRuntime.disable(rpc)

  await DevtoolsProtocolRuntime.evaluate(rpc, {
    expression: utilityScript,
    ...getEvaluateContextOptions(utilityContext),
  })

  const testType = await DevtoolsProtocolRuntime.evaluate(rpc, {
    expression: 'typeof test',
    returnByValue: true,
    ...getEvaluateContextOptions(utilityContext),
  })

  if (testType !== 'object' && !utilityContext.uniqueId) {
    const contextFromEvent = await waitForContextWithTimeout(executionContextPromise, 5000)
    if (contextFromEvent) {
      await DevtoolsProtocolRuntime.evaluate(rpc, {
        expression: utilityScript,
        ...getEvaluateContextOptions(contextFromEvent),
      })
      return contextFromEvent
    }
  }
  return utilityContext
}
