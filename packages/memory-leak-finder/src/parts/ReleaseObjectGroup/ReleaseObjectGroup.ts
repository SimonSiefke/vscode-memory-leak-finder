import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const releaseObjectGroup = async (session: Session, objectGroup: string) => {
  await DevtoolsProtocolRuntime.releaseObjectGroup(session, {
    objectGroup,
  })
}
