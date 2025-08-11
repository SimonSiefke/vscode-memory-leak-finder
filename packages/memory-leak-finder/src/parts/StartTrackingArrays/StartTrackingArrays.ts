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
    expression: PrototypeExpression.Array,
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
  const fullMap = Object.create(null)
  // for (const objectId of enumerableObjectIds) {
  //   const fnResult3 = await DevtoolsProtocolRuntime.getProperties(session, {
  //     objectId: objectId,
  //     generatePreview: false,
  //     ownProperties: true,
  //   })
  //   const enumerableValueObjectIds = getEnumerableValues(fnResult3.result).map(getObjectId).slice(0, 10)
  //   const subProperties = await Promise.all(
  //     enumerableValueObjectIds.map(async (objectId) => {
  //       const fnResult4 = await DevtoolsProtocolRuntime.getProperties(session, {
  //         objectId: objectId,
  //         generatePreview: false,
  //         ownProperties: true,
  //         // nonIndexedPropertiesOnly: true,
  //       })
  //       console.log({ fnResult4: fnResult4.internalProperties })
  //       return fnResult4
  //     }),
  //   )
  //   // console.log({ fnResult3: enumerableValues })
  // }
  return []
}
