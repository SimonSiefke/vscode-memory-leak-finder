import * as GetObjectId from '../GetObjectId/GetObjectId.ts'

export const getObjectIds = (descriptors) => {
  return descriptors.map(GetObjectId.getObjectId)
}
