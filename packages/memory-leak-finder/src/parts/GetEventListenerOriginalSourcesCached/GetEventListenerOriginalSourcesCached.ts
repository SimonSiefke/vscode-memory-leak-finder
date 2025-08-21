import * as CombineEventListenersWithSourceMapResults from '../CombineEventListenersWithSourceMapResults/CombineEventListenersWithSourceMapResults.ts'
import * as Exists from '../Exists/Exists.ts'
import * as GetCleanPositionsMap from '../GetCleanPositionsMap/GetCleanPositionsMap.ts'
import * as GetResolvedSourceMapCachePath from '../GetResolvedSourceMapCachePath/GetResolvedSourceMapCachePath.ts'
import * as GetSourceMapUrlMap from '../GetSourceMapUrlMap/GetSourceMapUrlMap.ts'
import * as Hash from '../Hash/Hash.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as SortEventListenersBySourceMap from '../SortEventListenersBySourceMap/SortEventListenersBySourceMap.ts'

export const getEventListenerOriginalSourcesCached = async (eventListeners, classNames) => {
  const sorted = SortEventListenersBySourceMap.sortEventListenersBySourceMap(eventListeners)
  const sourceMapUrlMap = GetSourceMapUrlMap.getSourceMapUrlMap(sorted)
  const hash = Hash.hash({ ...sourceMapUrlMap, classNames })
  const cachePath = GetResolvedSourceMapCachePath.getResolvedSourceMapCachePath(hash)
  const hasCursorSourceMaps = Object.keys(sourceMapUrlMap).some((url) => url.startsWith('https://cursor-sourcemaps'))
  if (hasCursorSourceMaps) {
    // 403 status
    return eventListeners
  }
  if (!Exists.exists(cachePath)) {
    const result = await GetCleanPositionsMap.getCleanPositionsMap(sourceMapUrlMap, classNames)
    await JsonFile.writeJson(cachePath, result)
  }
  const sourceMapResults = await JsonFile.readJson(cachePath)
  return CombineEventListenersWithSourceMapResults.combineEventListenersWithSourceMapResults(sorted, sourceMapUrlMap, sourceMapResults)
}
