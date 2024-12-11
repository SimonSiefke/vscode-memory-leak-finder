import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as EmptyFunctionLocation from '../EmptyFunctionLocation/EmptyFunctionLocation.js'
import * as IsFunctionLocation from '../IsFunctionLocation/IsFunctionLocation.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const getFunctionLocation = async (session, objectId, i) => {
  Assert.object(session)
  Assert.string(objectId)
  if (!objectId) {
    return EmptyFunctionLocation.emptyFunctionLocation
  }
  const s = performance.now()
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId,
    accessorPropertiesOnly: false,
    nonIndexedPropertiesOnly: false,
    generatePreview: false,
    ownProperties: true,
  })
  const e = performance.now()
  if (e - s > 1000) {
    console.log('i', i)
    console.log(fnResult1.internalProperties[0].value)
  }
  // if (fnResult1.result.length >= 7) {
  //   console.log('fn result', fnResult1.result.length)
  // }
  const functionLocation = fnResult1.internalProperties.find(IsFunctionLocation.isFunctionLocation)
  if (!functionLocation) {
    return EmptyFunctionLocation.emptyFunctionLocation
  }
  return functionLocation.value.value
}
