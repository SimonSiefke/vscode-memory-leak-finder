import { join } from 'node:path'
import { launchExtensionSourceMapWorker } from '../LaunchExtensionSourceMapWorker/LaunchExtensionSourceMapWorker.ts'
import * as Root from '../Root/Root.ts'

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
      // This will also extract the js-debug version and generate source maps if needed
      const sourceMapUrl = await extensionSourceMapWorker.invoke('ExtensionSourceMap.resolveExtensionSourceMap', key, {
        extensionName: 'vscode-js-debug',
        repoUrl: 'git@github.com:microsoft/vscode-js-debug.git',
        cacheDir: join(Root.root, '.extension-source-maps-cache'),
      })

      if (sourceMapUrl) {
        // Add the source map URL to the cleaned map
        cleanedSourceMapUrlMap[sourceMapUrl] = value
      } else {
        // If no source map URL is found, keep the original key
        cleanedSourceMapUrlMap[key] = value
      }
    } else {
      // For normal files, we keep the original key
      cleanedSourceMapUrlMap[key] = value
    }
  }

  if (extensionSourceMapWorker) {
    await extensionSourceMapWorker[Symbol.asyncDispose]()
  }

  return cleanedSourceMapUrlMap
}
