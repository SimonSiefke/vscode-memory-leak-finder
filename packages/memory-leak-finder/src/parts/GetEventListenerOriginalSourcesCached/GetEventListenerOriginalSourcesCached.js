import * as Exists from '../Exists/Exists.js'
import * as GetResolvedSourceMapCachePath from '../GetResolvedSourceMapCachePath/GetResolvedSourceMapCachePath.js'
import * as GetSourceMapUrlMap from '../GetSourceMapUrlMap/GetSourceMapUrlMap.js'
import * as Hash from '../Hash/Hash.js'
import * as JsonFile from '../JsonFile/JsonFile.js'

export const getEventListenerOriginalSourcesCached = async (eventListeners) => {
  const map = GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)
  console.log(map)
  const hash = Hash.hash(map)
  const cachePath = GetResolvedSourceMapCachePath.getResolvedSourceMapCachePath(hash)
  if (!Exists.exists(cachePath)) {
    const GetEventListenerOriginalSources = await import('../GetEventListenerOriginalSources/GetEventListenerOriginalSources.js')
    const result = await GetEventListenerOriginalSources.getEventListenerOriginalSources(eventListeners)
    await JsonFile.writeJson(cachePath, result)
  } else {
    console.log('use cache')
  }
  return JsonFile.readJson(cachePath)
}
