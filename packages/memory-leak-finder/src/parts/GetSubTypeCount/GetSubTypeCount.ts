import * as FilterBySubType from '../FilterBySubType/FilterBySubType.ts'
import * as GetObjects from '../GetObjects/GetObjects.ts'
import * as GetPropertyValues from '../GetPropertyValues/GetPropertyValues.ts'
import type { Session } from '../Session/Session.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getSubTypeCount = async (session: Session, objectGroup, subType) => {
  const objects = await GetObjects.getObjects(session, objectGroup)
  const values = await GetPropertyValues.getPropertyValues(session, objectGroup, objects.objectId)
  const filtered = FilterBySubType.filterBySubType(values, subType)
  const count = filtered.length
  return count
}
