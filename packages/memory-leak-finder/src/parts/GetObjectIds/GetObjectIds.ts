import type { Dynamic } from '../Types/Types.ts'
import * as GetObjectId from '../GetObjectId/GetObjectId.ts'
export const getObjectIds = (descriptors: Dynamic) => {
  return descriptors.map(GetObjectId.getObjectId)
}
