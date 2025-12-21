import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

const waitForEventInternal = (sessionRpc, utilityExecutionContextName, contexts): Promise<any> => {
  const { promise, resolve } = Promise.withResolvers<any>()
  const cleanup = (value) => {
    // TODO remove event listener
    resolve(value)
  }
  const handleExecutionContextCreated = (event) => {
    const { params } = event
    const { context } = params
    const { id, name, uniqueId } = context
    contexts[uniqueId] = {
      id,
      name,
      uniqueId,
    }
    if (name === utilityExecutionContextName) {
      cleanup({
        id,
        name,
        uniqueId,
      })
    }
  }
  sessionRpc.on(DevtoolsEventType.RuntimeExecutionContextCreated, handleExecutionContextCreated)
  return promise
}

export const waitForUtilityExecutionContext = async (sessionRpc, utilityExecutionContextName, contexts) => {
  const eventPromise = waitForEventInternal(sessionRpc, utilityExecutionContextName, contexts)
  const { id, name, uniqueId } = await eventPromise
  return {
    id,
    name,
    uniqueId,
  }
}
