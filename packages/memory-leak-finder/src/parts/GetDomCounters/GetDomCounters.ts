import { DevtoolsProtocolMemory } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getDomCounters = async (session) => {
  const domCounters = await DevtoolsProtocolMemory.getDomCounters(session, {})
  return domCounters
}
