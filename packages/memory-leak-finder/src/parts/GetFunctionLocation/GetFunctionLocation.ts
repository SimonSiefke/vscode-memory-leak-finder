import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as EmptyFunctionLocation from '../EmptyFunctionLocation/EmptyFunctionLocation.js'
import * as IsFunctionLocation from '../IsFunctionLocation/IsFunctionLocation.js'

export const getFunctionLocation = async (session, objectId) => {
  Assert.object(session)
  Assert.string(objectId)
  if (!objectId) {
    return EmptyFunctionLocation.emptyFunctionLocation
  }
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId,
    accessorPropertiesOnly: false,
    nonIndexedPropertiesOnly: false,
    generatePreview: false,
    ownProperties: true,
  })
  const functionLocation = fnResult1.internalProperties.find(IsFunctionLocation.isFunctionLocation)
  if (!functionLocation) {
    return EmptyFunctionLocation.emptyFunctionLocation
  }
  return functionLocation.value.value
}
