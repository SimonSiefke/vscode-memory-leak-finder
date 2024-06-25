import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PartitionArray from '../PartitionArray/PartitionArray.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

const ArrayChunkSize = 100_000

const isEnumerable = (property) => {
  return property.enumerable
}

const getObjectId = (result) => {
  return result.objectId
}

const getValue = (result) => {
  return result.value
}

const getEnumerableValues = (result) => {
  return result.filter(isEnumerable).map(getValue)
}

export const startTrackingArrays = async (session, objectGroup) => {
  const arrayDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    returnByValue: false,
    objectGroup,
  })
  const arrays = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: arrayDescriptor.objectId,
    objectGroup,
  })
  // partition array into smaller arrays to avoid zlib error
  const smallerArrays = await PartitionArray.partitionArray(session, objectGroup, arrays.objects.objectId, ArrayChunkSize)
  const smallerArrayProperties = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: smallerArrays.objectId,
    ownProperties: true,
  })
  const enumerableObjectIds = getEnumerableValues(smallerArrayProperties.result).map(getObjectId)
  console.log(enumerableObjectIds)
  const fullMap = Object.create(null)
  for (const objectId of enumerableObjectIds) {
    const fnResult3 = await DevtoolsProtocolRuntime.getProperties(session, {
      objectId: objectId,
      generatePreview: false,
      ownProperties: true,
    })
    const enumerableValues = getEnumerableValues(fnResult3.result)
    console.log({ fnResult3: enumerableValues })
  }
  // console.log({ smallerArrays })
  return []
}
