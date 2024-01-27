import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as GetNamedFunctionLocation from '../GetNamedFunctionLocation/GetNamedFunctionLocation.js'

setInterval(() => {
  console.log('heap' + process.memoryUsage().heapUsed)
}, 1000)

export const getNamedFunctionLocations = async (session, objectIds, scriptMap, includeSourceMap) => {
  Assert.object(session)
  Assert.array(objectIds)
  Assert.object(scriptMap)
  const promises = Arrays.contextMap(objectIds, GetNamedFunctionLocation.getNamedFunctionLocation, session, scriptMap, includeSourceMap)
  const results = await Promise.all(promises)
  return results
}
