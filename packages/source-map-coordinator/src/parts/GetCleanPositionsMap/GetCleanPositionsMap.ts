import { cleanSourceMapUrlMap } from '../CleanSourceMapUrlMap/CleanSourceMapUrlMap.ts'
import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.ts'
import * as Hash from '../Hash/Hash.ts'
import { launchSourceMapWorker } from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.ts'

interface SourceMapUrlMap {
  [key: string]: number[]
}

interface CleanPositionMap {
  [key: string]: any[]
}

// TODO maybe there is a better way to do this. but the caller providers the source map url
// that it gets from the file. that gets converted to a different source map url, for example
// in .extension-source-maps-cache. But to keep the order of items correct, the caller needs
// to get the same source map urls back that it passed in, even though that might not be the
// real source map urls that were used to get the original positions
const reverseCleanSourceMapUrlMap = (cleanPositionsMap: any, reverseMap: any): any => {
  const result = Object.create(null)
  for (const [key, value] of Object.entries(cleanPositionsMap)) {
    const originalKey = reverseMap[key] || key
    result[originalKey] = value
  }
  return result
}

export const getCleanPositionsMap = async (sourceMapUrlMap: SourceMapUrlMap, classNames: boolean): Promise<CleanPositionMap> => {
  const platform = process.platform
  const { cleanedSourceMapUrlMap, reverseMap } = await cleanSourceMapUrlMap(sourceMapUrlMap, platform)
  await using sourceMapWorker = await launchSourceMapWorker()
  const cleanPositionMap: CleanPositionMap = Object.create(null)
  for (const [key, value] of Object.entries(cleanedSourceMapUrlMap)) {
    if (!key) {
      cleanPositionMap[key] = []
      continue
    }
    const hash = Hash.hash(key)
    const sourceMap = await LoadSourceMap.loadSourceMap(key, hash)
    const originalPositions = await sourceMapWorker.invoke('SourceMap.getCleanPositionsMap2', sourceMap, value, classNames, hash, key)
    const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
    cleanPositionMap[key] = cleanPositions
  }
  const finalResult = reverseCleanSourceMapUrlMap(cleanPositionMap, reverseMap)
  console.log(reverseMap)
  console.log(finalResult)
  return finalResult
}
