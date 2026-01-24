import { launchExtensionSourceMapWorker } from '../LaunchExtensionSourceMapWorker/LaunchExtensionSourceMapWorker.ts'
import { launchSourceMapWorker } from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'

interface SourceMapUrlMap {
  [key: string]: number[]
}

const isExtensionFile = (url: string): boolean => {
  return url.includes('ms-vscode.js-debug')
}

/**
 * Cleans the source map URL map by handling extension files separately.
 * Extension files (containing ms-vscode.js-debug) are processed by the extension-source-maps worker,
 * while normal files are processed by the regular source-map-worker.
 */
export const cleanSourceMapUrlMap = async (sourceMapUrlMap: SourceMapUrlMap): Promise<SourceMapUrlMap> => {
  const cleanedSourceMapUrlMap: SourceMapUrlMap = Object.create(null)

  // Launch workers based on the types of files we need to process
  let sourceMapWorker: any = null
  let extensionSourceMapWorker: any = null

  for (const [key, value] of Object.entries(sourceMapUrlMap)) {
    if (!key) {
      cleanedSourceMapUrlMap[key] = value
      continue
    }

    if (isExtensionFile(key)) {
      // Use extension-source-maps worker for extension files
      if (!extensionSourceMapWorker) {
        extensionSourceMapWorker = await launchExtensionSourceMapWorker()
      }

      // Get the source map URL from the extension source maps worker
      const sourceMapUrl = await extensionSourceMapWorker.invoke('ExtensionSourceMap.mapPathToSourceMapUrl', key, process.cwd())

      if (sourceMapUrl) {
        // Add the source map URL to the cleaned map
        cleanedSourceMapUrlMap[sourceMapUrl] = value
      } else {
        // If no source map URL is found, keep the original key
        cleanedSourceMapUrlMap[key] = value
      }
    } else {
      // Use regular source-map-worker for normal files
      if (!sourceMapWorker) {
        sourceMapWorker = await launchSourceMapWorker()
      }

      // For normal files, we keep the original key
      cleanedSourceMapUrlMap[key] = value
    }
  }

  // Clean up workers
  if (sourceMapWorker) {
    await sourceMapWorker[Symbol.asyncDispose]()
  }
  if (extensionSourceMapWorker) {
    await extensionSourceMapWorker[Symbol.asyncDispose]()
  }

  return cleanedSourceMapUrlMap
}
