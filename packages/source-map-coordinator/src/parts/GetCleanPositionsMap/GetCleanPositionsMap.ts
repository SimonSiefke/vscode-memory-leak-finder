import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.ts'
import * as Hash from '../Hash/Hash.ts'
import { launchSourceMapWorker } from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.ts'
import { launchExtensionSourceMapWorker } from '../LaunchExtensionSourceMapWorker/LaunchExtensionSourceMapWorker.ts'
import { cleanSourceMapUrlMap } from '../CleanSourceMapUrlMap/CleanSourceMapUrlMap.ts'

interface SourceMapUrlMap {
  [key: string]: number[]
}

interface CleanPositionMap {
  [key: string]: any[]
}

export const getCleanPositionsMap = async (sourceMapUrlMap: SourceMapUrlMap, classNames: boolean): Promise<CleanPositionMap> => {
  // Clean the source map URL map to handle extension files separately
  const cleanedSourceMapUrlMap = await cleanSourceMapUrlMap(sourceMapUrlMap)

  const cleanPositionMap: CleanPositionMap = Object.create(null)

  // Launch workers based on the types of files we need to process
  let sourceMapWorker: any = null
  let extensionSourceMapWorker: any = null

  for (const [key, value] of Object.entries(cleanedSourceMapUrlMap)) {
    if (!key) {
      cleanPositionMap[key] = []
      continue
    }

    const hash = Hash.hash(key)

    // Check if this is an extension file (source map URL from extension-source-maps worker)
    // Extension source map URLs will contain the cache directory name
    const isExtensionSourceMap = key.includes('.extension-source-maps-cache')

    if (isExtensionSourceMap) {
      // Use extension-source-maps worker for extension source maps
      if (!extensionSourceMapWorker) {
        extensionSourceMapWorker = await launchExtensionSourceMapWorker()
      }

      const sourceMap = await LoadSourceMap.loadSourceMap(key, hash)
      const originalPositions = await extensionSourceMapWorker.invoke(
        'SourceMap.getCleanPositionsMap2',
        sourceMap,
        value,
        classNames,
        hash,
        key,
      )
      const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
      cleanPositionMap[key] = cleanPositions
    } else {
      // Use regular source-map-worker for normal files
      if (!sourceMapWorker) {
        sourceMapWorker = await launchSourceMapWorker()
      }

      const sourceMap = await LoadSourceMap.loadSourceMap(key, hash)
      const originalPositions = await sourceMapWorker.invoke('SourceMap.getCleanPositionsMap2', sourceMap, value, classNames, hash, key)
      const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
      cleanPositionMap[key] = cleanPositions
    }
  }

  // Clean up workers
  if (sourceMapWorker) {
    await sourceMapWorker[Symbol.asyncDispose]()
  }
  if (extensionSourceMapWorker) {
    await extensionSourceMapWorker[Symbol.asyncDispose]()
  }

  return cleanPositionMap
}
