import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as IsFunctionLocation from '../IsFunctionLocation/IsFunctionLocation.js'

const emptyFunctionLocation = {
  scriptId: '',
  lineNumber: 0,
  columnNumber: 0,
  name: '',
}

export const getNamedFunctionLocation = async (session, objectId) => {
  Assert.object(session)
  Assert.string(objectId)
  if (!objectId) {
    return {
      ...emptyFunctionLocation,
      objectId,
    }
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
    return {
      ...emptyFunctionLocation,
      objectId,
    }
  }
  console.log({ functionLocation: functionLocation.value })
  return {
    ...functionLocation.value.value,
    objectId,
  }
}
