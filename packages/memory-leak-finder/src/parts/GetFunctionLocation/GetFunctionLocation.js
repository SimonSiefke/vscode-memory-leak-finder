import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

const isFunctionLocation = (internalProperty) => {
  return internalProperty.name === '[[FunctionLocation]]'
}

export const getFunctionLocation = async (session, objectId) => {
  // console.log({ objectId })
  if (typeof objectId !== 'string') {
    console.log({ objectId })
  }
  Assert.object(session)
  Assert.string(objectId)
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId,
    accessorPropertiesOnly: false,
    nonIndexedPropertiesOnly: false,
    generatePreview: false,
    ownProperties: true,
  })
  const functionLocation = fnResult1.internalProperties.find(isFunctionLocation)
  if (!functionLocation) {
    return undefined
  }
  return functionLocation.value
}
