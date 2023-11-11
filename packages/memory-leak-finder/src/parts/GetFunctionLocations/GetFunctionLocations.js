import * as Assert from '../Assert/Assert.js'
import * as GetFunctionLocation from '../GetFunctionLocation/GetFunctionLocation.js'

export const getFunctionLocations = async (session, objectIds) => {
  Assert.object(session)
  Assert.array(objectIds)
  const promises = []
  for (const objectId of objectIds) {
    promises.push(GetFunctionLocation.getFunctionLocation(session, objectId))
  }
  const results = await Promise.all(promises)
  return results
}
