import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.ts'
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
  const existing = ExecutionContextState.getAll()
  for (const item of existing) {
    // @ts-ignore
    if (item.name === 'utility') {
      return item
    }
  }
  const eventPromise = waitForEventInternal(sessionRpc)

  await Promise.all([DevtoolsProtocolRuntime.enable(sessionRpc), DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc)])
  const { name, id, uniqueId } = await eventPromise
  // TODO can disable runtime now
  return {
    name,
    id,
    uniqueId,
  }
}
