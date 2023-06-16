import * as RemoveObjectId from '../RemoveObjectId/RemoveObjectId.js'

export const removeObjectIds = (objects) => {
  return objects.map(RemoveObjectId.removeObjectId)
}
