import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

interface SessionRpc {
  on(event: string, listener: (event: { params: { context: { id: number; name: string; uniqueId: string } } }) => void): void
}

interface ExecutionContext {
  id: number
  name: string
  uniqueId: string
}

const waitForEventInternal = (sessionRpc: SessionRpc): Promise<ExecutionContext> => {
  const { promise, resolve } = Promise.withResolvers<ExecutionContext>()
  const cleanup = (value: ExecutionContext) => {
    // TODO remove event listener
    resolve(value)
  }
  const handleExecutionContextCreated = (event: { params: { context: { id: number; name: string; uniqueId: string } } }) => {
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

export const waitForUtilityExecutionContext = async (sessionRpc: SessionRpc): Promise<ExecutionContext> => {
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
