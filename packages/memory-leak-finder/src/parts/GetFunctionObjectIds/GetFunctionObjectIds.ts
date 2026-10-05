import type { Dynamic } from '../Types/Types.ts'
import * as Assert from '../Assert/Assert.ts'
import * as GetObjectId from '../GetObjectId/GetObjectId.ts'
export const getFunctionObjectIds = (descriptors: Dynamic) => {
  Assert.array(descriptors)
  const objectIds = descriptors.map(GetObjectId.getObjectId)
  return objectIds
}
