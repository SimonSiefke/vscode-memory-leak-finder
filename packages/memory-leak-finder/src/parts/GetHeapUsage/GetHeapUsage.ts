import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getHeapUsage = async (session) => {
  const heapUsage = await DevtoolsProtocolRuntime.getHeapUsage(session, {})
  return heapUsage
}
