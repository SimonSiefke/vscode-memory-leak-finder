import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const releaseObjectGroup = async (session, objectGroup) => {
  await DevtoolsProtocolRuntime.releaseObjectGroup(session, {
    objectGroup,
  })
}
