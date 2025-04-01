import * as FilterBySubType from '../FilterBySubType/FilterBySubType.js'
import * as GetObjects from '../GetObjects/GetObjects.js'
import * as GetPropertyValues from '../GetPropertyValues/GetPropertyValues.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getSubTypeCount = async (session, objectGroup, subType) => {
  const objects = await GetObjects.getObjects(session, objectGroup)
  const values = await GetPropertyValues.getPropertyValues(session, objectGroup, objects.objectId)
  const filtered = FilterBySubType.filterBySubType(values, subType)
  const count = filtered.length
  return count
}
