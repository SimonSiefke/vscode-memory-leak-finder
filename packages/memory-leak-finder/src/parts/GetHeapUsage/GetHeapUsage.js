import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const getHeapUsage = async (session) => {
  const heapUsage = await DevtoolsProtocolRuntime.getHeapUsage(session, {})
  return heapUsage
}
