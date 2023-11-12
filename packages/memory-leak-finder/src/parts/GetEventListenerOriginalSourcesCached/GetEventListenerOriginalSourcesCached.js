import { join } from 'node:path'
import * as Exists from '../Exists/Exists.js'
import * as GetResolvedSourceMapCachePath from '../GetResolvedSourceMapCachePath/GetResolvedSourceMapCachePath.js'
import * as GetSourceMapUrlMap from '../GetSourceMapUrlMap/GetSourceMapUrlMap.js'
import * as Hash from '../Hash/Hash.js'
import * as JsonFile from '../JsonFile/JsonFile.js'

export const getEventListenerOriginalSourcesCached = async (eventListeners, classNames) => {
  const map = GetSourceMapUrlMap.getSourceMapUrlMap(eventListeners)
  const hash = Hash.hash({ ...map, classNames })
  const cachePath = GetResolvedSourceMapCachePath.getResolvedSourceMapCachePath(hash)
  if (!Exists.exists(cachePath)) {
    console.log('CACHE MISS', cachePath)
    console.time('get-sources')
    console.log(process.memoryUsage().heapUsed)
    const GetEventListenerOriginalSources = await import('../GetEventListenerOriginalSources/GetEventListenerOriginalSources.js')
    const result = await GetEventListenerOriginalSources.getEventListenerOriginalSources(eventListeners, classNames)
    await JsonFile.writeJson(cachePath, result)
    await JsonFile.writeJson(join(cachePath + '-source.json'), map)
    console.timeEnd('get-sources')
    console.log(process.memoryUsage().heapUsed)
  } else {
    console.log('CACHE HIT', cachePath)
  }
  return JsonFile.readJson(cachePath)
}
