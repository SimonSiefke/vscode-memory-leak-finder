import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

const waitForEventInternal = (sessionRpc, utilityExecutionContextName, contexts, signal?: AbortSignal): Promise<any> => {
  const { promise, resolve } = Promise.withResolvers<any>()
  const cleanup = (value) => {
    remove()
    resolve(value)
  }
  const remove = () => {
    sessionRpc.off(DevtoolsEventType.RuntimeExecutionContextCreated, handleExecutionContextCreated)
    signal?.removeEventListener('abort', remove)
  }
  const handleExecutionContextCreated = (event) => {
    if (sessionRpc.sessionId && event.sessionId !== sessionRpc.sessionId) return
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
  signal?.addEventListener('abort', remove, { once: true })
  if (signal?.aborted) remove()
  return promise
}

export const waitForUtilityExecutionContext = async (sessionRpc, utilityExecutionContextName, contexts, signal?: AbortSignal) => {
  const eventPromise = waitForEventInternal(sessionRpc, utilityExecutionContextName, contexts, signal)
  const { id, name, uniqueId } = await eventPromise
  return {
    id,
    name,
    uniqueId,
  }
}
