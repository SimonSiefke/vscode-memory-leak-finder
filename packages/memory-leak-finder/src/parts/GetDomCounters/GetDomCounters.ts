import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolMemory } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getDomCounters = async (session: Session) => {
  const domCounters = await DevtoolsProtocolMemory.getDomCounters(session, {})
  return domCounters
}
