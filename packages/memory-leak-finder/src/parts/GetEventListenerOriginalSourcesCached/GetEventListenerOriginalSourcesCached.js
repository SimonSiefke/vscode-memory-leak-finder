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
    const GetEventListenerOriginalSources = await import('../GetEventListenerOriginalSources/GetEventListenerOriginalSources.js')
    const result = await GetEventListenerOriginalSources.getEventListenerOriginalSources(sorted, sourceMapUrlMap, classNames)
    await JsonFile.writeJson(cachePath, result)
  }
  return JsonFile.readJson(cachePath)
}
