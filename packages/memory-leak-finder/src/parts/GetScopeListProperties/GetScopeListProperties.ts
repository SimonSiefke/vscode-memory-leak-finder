import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getScopeListProperties = async (session, objectId) => {
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objectId,
    ownProperties: true,
    generatePreview: false,
  })
  return fnResult1
}
