import * as CombineEventListenersWithSourceMapResults from '../CombineEventListenersWithSourceMapResults/CombineEventListenersWithSourceMapResults.js'
import * as Exists from '../Exists/Exists.js'
import * as GetResolvedSourceMapCachePath from '../GetResolvedSourceMapCachePath/GetResolvedSourceMapCachePath.js'
import * as GetSourceMapUrlMap from '../GetSourceMapUrlMap/GetSourceMapUrlMap.js'
import * as Hash from '../Hash/Hash.js'
import * as JsonFile from '../JsonFile/JsonFile.js'
import * as SortEventListenersBySourceMap from '../SortEventListenersBySourceMap/SortEventListenersBySourceMap.js'

export const getEventListenerOriginalSourcesCached = async (eventListeners, classNames) => {
  const sorted = SortEventListenersBySourceMap.sortEventListenersBySourceMap(eventListeners)
  const sourceMapUrlMap = GetSourceMapUrlMap.getSourceMapUrlMap(sorted)
  const hash = Hash.hash({ ...sourceMapUrlMap, classNames })
  const cachePath = GetResolvedSourceMapCachePath.getResolvedSourceMapCachePath(hash)
  if (!Exists.exists(cachePath)) {
    const GetCleanPositionsMap = await import('../GetCleanPositionsMap/GetCleanPositionsMap.js')
    const result = await GetCleanPositionsMap.getCleanPositionsMap(sourceMapUrlMap, classNames)
    await JsonFile.writeJson(cachePath, result)
  }
  const sourceMapResults = await JsonFile.readJson(cachePath)
  return CombineEventListenersWithSourceMapResults.combineEventListenersWithSourceMapResults(sorted, sourceMapUrlMap, sourceMapResults)
}
