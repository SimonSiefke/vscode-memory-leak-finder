import * as Assert from '../Assert/Assert.ts'
import * as GetObjectId from '../GetObjectId/GetObjectId.ts'

export const getFunctionObjectIds = (descriptors) => {
  Assert.array(descriptors)
  const objectIds = descriptors.map(GetObjectId.getObjectId)
  return objectIds
}
