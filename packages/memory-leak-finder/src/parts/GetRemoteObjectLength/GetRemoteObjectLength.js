import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const getRemoteObjectLength = async (session, objectId, objectGroup) => {
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
