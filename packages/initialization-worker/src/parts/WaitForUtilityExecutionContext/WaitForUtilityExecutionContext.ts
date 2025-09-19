import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

const waitForEventInternal = (sessionRpc): Promise<any> => {
  const { resolve, promise } = Promise.withResolvers<any>()
  const cleanup = (value) => {
    resolve(value)
  }
  const handleExecutionContextCreated = (event) => {
    const { params } = event
    const { context } = params
    const { name, id, uniqueId } = context
    if (name === 'utility') {
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

export const waitForUtilityExecutionContext = async (sessionRpc) => {
  const eventPromise = waitForEventInternal(sessionRpc)
  await DevtoolsProtocolRuntime.enable(sessionRpc)
  const { name, id, uniqueId } = await eventPromise
  await DevtoolsProtocolRuntime.disable(sessionRpc)
  return {
    name,
    id,
    uniqueId,
  }
}
