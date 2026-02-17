import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { cleanSourceMapUrlMap } from '../CleanSourceMapUrlMap/CleanSourceMapUrlMap.ts'
import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.ts'
import * as Hash from '../Hash/Hash.ts'
import { launchSourceMapWorker } from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.ts'
import { root } from '../Root/Root.ts'
import { getOriginalPositions } from '../GetOriginalPositions/GetOriginalPositions.ts'

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

const getExtensionSourceMapDir = (sourceMapUrl: string): string | null => {
  if (!sourceMapUrl.includes('.extension-source-maps-cache')) {
    return null
  }
  try {
    const sourceMapPath = fileURLToPath(sourceMapUrl)
    // Get the directory containing the source map file
    // This allows relative paths in the source map to resolve correctly
    return dirname(sourceMapPath)
  } catch {
    return null
  }
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
    const cleanPositions = await getOriginalPositions(sourceMapWorker, key, value, classNames)
    cleanPositionMap[key] = cleanPositions
  }
  const finalResult = reverseCleanSourceMapUrlMap(cleanPositionMap, reverseMap)
  return finalResult
}
