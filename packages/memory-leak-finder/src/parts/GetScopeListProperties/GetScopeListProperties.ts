import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getScopeListProperties = async (session: Session, objectId) => {
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    generatePreview: false,
    objectId: objectId,
    ownProperties: true,
  })
  return fnResult1
}
