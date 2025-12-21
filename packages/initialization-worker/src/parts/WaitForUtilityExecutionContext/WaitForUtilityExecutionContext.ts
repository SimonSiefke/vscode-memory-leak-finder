import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

const waitForEventInternal = (sessionRpc): Promise<any> => {
  const { promise, resolve } = Promise.withResolvers<any>()
  const cleanup = (value) => {
    // TODO remove event listener
    resolve(value)
  }
  const handleExecutionContextCreated = (event) => {
    const { params } = event
    const { context } = params
    const { id, name, uniqueId } = context
    if (name === 'utility') {
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

export const waitForUtilityExecutionContext = async (sessionRpc) => {
  const eventPromise = waitForEventInternal(sessionRpc)
  await DevtoolsProtocolRuntime.enable(sessionRpc)
  const { id, name, uniqueId } = await eventPromise
  await DevtoolsProtocolRuntime.disable(sessionRpc)
  return {
    id,
    name,
    uniqueId,
  }
}
