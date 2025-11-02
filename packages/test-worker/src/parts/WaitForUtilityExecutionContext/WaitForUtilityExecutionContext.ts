import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

const waitForEventInternal = (sessionRpc, utilityExecutionContextName, contexts): Promise<any> => {
  const { resolve, promise } = Promise.withResolvers<any>()
  const cleanup = (value) => {
    // TODO remove event listener
    resolve(value)
  }
  const handleExecutionContextCreated = (event) => {
    const { params } = event
    const { context } = params
    const { name, id, uniqueId } = context
    contexts[uniqueId] = {
      name,
      id,
      uniqueId,
    }
    if (name === utilityExecutionContextName) {
      cleanup({
        name,
        id,
        uniqueId,
      })
    }
  }
  sessionRpc.on(DevtoolsEventType.RuntimeExecutionContextCreated, handleExecutionContextCreated)
  return promise
}

export const waitForUtilityExecutionContext = async (sessionRpc, utilityExecutionContextName, contexts) => {
  const eventPromise = waitForEventInternal(sessionRpc, utilityExecutionContextName, contexts)
  const { name, id, uniqueId } = await eventPromise
  return {
    name,
    id,
    uniqueId,
  }
}
