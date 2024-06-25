import * as GetObjectId from '../GetObjectId/GetObjectId.js'

export const getObjectIds = (descriptors) => {
  return descriptors.map(GetObjectId.getObjectId)
}
