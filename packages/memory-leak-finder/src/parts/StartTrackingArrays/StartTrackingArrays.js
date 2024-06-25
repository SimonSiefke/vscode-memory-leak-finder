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
    expression: PrototypeExpression.Function,
    returnByValue: false,
    objectGroup,
  })
  const arrays = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: arrayDescriptor.objectId,
    objectGroup,
  })
  // partition array into smaller arrays to avoid zlib error
  // const smallerArrays = await PartitionArray.partitionArray(session, objectGroup, arrays.objects.objectId, ArrayChunkSize)
  const smallerArrayProperties = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: arrays.objects.objectId,
    ownProperties: true,
  })
  const enumerableObjectIds = getEnumerableValues(smallerArrayProperties.result).map(getObjectId)
  const subProperties = await Promise.all(
    enumerableObjectIds.map(async (objectId) => {
      const fnResult4 = await DevtoolsProtocolRuntime.getProperties(session, {
        objectId: objectId,
        generatePreview: false,
        ownProperties: true,
        // nonIndexedPropertiesOnly: true,
      })
      console.log(JSON.stringify(fnResult4, null, 2))
      return fnResult4
    }),
  )

  // const fullMap = Object.create(null)
  // for (const objectId of enumerableObjectIds) {
  //   const fnResult3 = await DevtoolsProtocolRuntime.getProperties(session, {
  //     objectId: objectId,
  //     generatePreview: false,
  //     ownProperties: true,
  //   })
  //   const enumerableValueObjectIds = getEnumerableValues(fnResult3.result).map(getObjectId).slice(0, 10)

  //   // console.log({ fnResult3: enumerableValues })
  // }
  return []
}
