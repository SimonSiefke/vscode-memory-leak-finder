import * as Assert from '../Assert/Assert.js'
import * as GetNamedFunctionLocation from '../GetNamedFunctionLocation/GetNamedFunctionLocation.js'

export const getNamedFunctionLocations = async (session, objectIds) => {
  Assert.object(session)
  Assert.array(objectIds)
  const promises = []
  for (const objectId of objectIds) {
    promises.push(GetNamedFunctionLocation.getNamedFunctionLocation(session, objectId))
  }
  const results = await Promise.all(promises)
  return results
}
