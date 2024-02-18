import { DevtoolsProtocolMemory } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const getDomCounters = async (session) => {
  const domCounters = await DevtoolsProtocolMemory.getDomCounters(session, {})
  return domCounters
}
