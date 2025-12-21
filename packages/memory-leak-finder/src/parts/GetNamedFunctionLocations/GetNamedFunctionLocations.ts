import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'
import * as GetNamedFunctionLocation from '../GetNamedFunctionLocation/GetNamedFunctionLocation.ts'

export const getNamedFunctionLocations = async (session, objectIds, scriptMap, includeSourceMap) => {
  Assert.object(session)
  Assert.array(objectIds)
  Assert.object(scriptMap)
  const promises = Arrays.contextMap(objectIds, GetNamedFunctionLocation.getNamedFunctionLocation, session, scriptMap, includeSourceMap)
  const results = await Promise.all(promises)
  return results
}
