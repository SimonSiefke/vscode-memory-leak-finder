import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import type { Session } from '../Session/Session.ts'

export const releaseObjectGroup = async (session: Session, objectGroup: string) => {
  await DevtoolsProtocolRuntime.releaseObjectGroup(session, {
    objectGroup,
  })
}
