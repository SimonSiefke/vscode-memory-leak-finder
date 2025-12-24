import { DevtoolsProtocolMemory } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import type { Session } from '../Session/Session.ts'

export const getDomCounters = async (session: Session) => {
  const domCounters = await DevtoolsProtocolMemory.getDomCounters(session, {})
  return domCounters
}
