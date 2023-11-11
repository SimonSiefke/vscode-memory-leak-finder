import * as Assert from '../Assert/Assert.js'
import * as GetObjectId from '../GetObjectId/GetObjectId.js'

export const getFunctionObjectIds = (descriptors) => {
  Assert.array(descriptors)
  const objectIds = descriptors.map(GetObjectId.getObjectId)
  return objectIds
}
