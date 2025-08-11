import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const releaseObjectGroup = async (session, objectGroup) => {
  await DevtoolsProtocolRuntime.releaseObjectGroup(session, {
    objectGroup,
  })
}
