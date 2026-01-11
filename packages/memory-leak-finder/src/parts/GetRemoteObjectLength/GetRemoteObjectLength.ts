import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getRemoteObjectLength = async (session: Session, objectId: string, objectGroup: string) => {
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function (){
  const elements = this
  return elements.length
}`,
    objectGroup,
    objectId,
  })
  return fnResult1
}
