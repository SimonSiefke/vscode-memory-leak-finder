import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

const waitForEventInternal = (sessionRpc, utilityExecutionContextName): Promise<any> => {
  const { resolve, promise } = Promise.withResolvers<any>()
  const cleanup = (value) => {
    // TODO remove event listener
    resolve(value)
  }
  const handleExecutionContextCreated = (event) => {
    const { params } = event
    const { context } = params
    const { name, id, uniqueId } = context
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

export const waitForUtilityExecutionContext = async (sessionRpc, utilityExecutionContextName) => {
  const eventPromise = waitForEventInternal(sessionRpc, utilityExecutionContextName)
  await DevtoolsProtocolRuntime.enable(sessionRpc)
  const { name, id, uniqueId } = await eventPromise
  await DevtoolsProtocolRuntime.disable(sessionRpc)

  return {
    name,
    id,
    uniqueId,
  }
}
