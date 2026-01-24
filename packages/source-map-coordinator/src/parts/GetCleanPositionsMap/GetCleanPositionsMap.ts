import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.ts'
import * as Hash from '../Hash/Hash.ts'
import { launchSourceMapWorker } from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.ts'
import { launchExtensionSourceMapWorker } from '../LaunchExtensionSourceMapWorker/LaunchExtensionSourceMapWorker.ts'

interface SourceMapUrlMap {
  [key: string]: number[]
}

interface CleanPositionMap {
  [key: string]: any[]
}

const isExtensionFile = (url: string): boolean => {
  return url.includes('/ms-vscode.js-debug') || url.includes('/github.copilot-chat')
}

export const getCleanPositionsMap = async (sourceMapUrlMap: SourceMapUrlMap, classNames: boolean): Promise<CleanPositionMap> => {
  const cleanPositionMap: CleanPositionMap = Object.create(null)
  
  // Launch workers based on the types of files we need to process
  let sourceMapWorker: any = null
  let extensionSourceMapWorker: any = null
  
  for (const [key, value] of Object.entries(sourceMapUrlMap)) {
    if (!key) {
      cleanPositionMap[key] = []
      continue
    }
    
    const hash = Hash.hash(key)
    
    if (isExtensionFile(key)) {
      // Use extension-source-maps worker for extension files
      if (!extensionSourceMapWorker) {
        extensionSourceMapWorker = await launchExtensionSourceMapWorker()
      }
      
      // Get the source map URL from the extension source maps worker
      const sourceMapUrl = await extensionSourceMapWorker.invoke('ExtensionSourceMap.mapPathToSourceMapUrl', key, process.cwd())
      
      if (sourceMapUrl) {
        const sourceMap = await LoadSourceMap.loadSourceMap(sourceMapUrl, hash)
        const originalPositions = await extensionSourceMapWorker.invoke('SourceMap.getCleanPositionsMap2', sourceMap, value, classNames, hash, key)
        const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
        cleanPositionMap[key] = cleanPositions
      } else {
        cleanPositionMap[key] = []
      }
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
