import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as GetNamedFunctionLocation from '../GetNamedFunctionLocation/GetNamedFunctionLocation.js'

export const getNamedFunctionLocations = async (session, objectIds, scriptMap) => {
  Assert.object(session)
  Assert.array(objectIds)
  const promises = Arrays.contextMap(objectIds, GetNamedFunctionLocation.getNamedFunctionLocation, session, scriptMap)
  const results = await Promise.all(promises)
  return results
}
