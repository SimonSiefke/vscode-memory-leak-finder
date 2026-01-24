import { pathToFileURL } from 'node:url'
import { getConfigs } from '../Config/Config.ts'
import { launchExtensionSourceMapWorker } from '../LaunchExtensionSourceMapWorker/LaunchExtensionSourceMapWorker.ts'
import * as Root from '../Root/Root.ts'

interface SourceMapUrlMap {
  [key: string]: number[]
}

const isExtensionFile = (url: string): boolean => {
  return url.includes('ms-vscode.js-debug')
}

const ensureUri = (file: string): string => {
  if (file.startsWith('file://')) {
    return file
  }
  return pathToFileURL(file).toString()
}

/**
 * Cleans the source map URL map by handling extension files separately.
 * Extension files (containing ms-vscode.js-debug) are processed by the extension-source-maps worker,
 * while normal files are processed by the regular source-map-worker.
 */
export const cleanSourceMapUrlMap = async (sourceMapUrlMap: SourceMapUrlMap, platform: string): Promise<SourceMapUrlMap> => {
  const cleanedSourceMapUrlMap: SourceMapUrlMap = Object.create(null)

  let extensionSourceMapWorker: any = null

  const configs = getConfigs(platform)

  for (const [key, value] of Object.entries(sourceMapUrlMap)) {
    if (!key) {
      cleanedSourceMapUrlMap[key] = value
      continue
    }

    if (isExtensionFile(key)) {
      if (!extensionSourceMapWorker) {
        extensionSourceMapWorker = await launchExtensionSourceMapWorker()
      }

      const uri = ensureUri(key) // TODO maybe caller should have alrady ensured uri
      const sourceMapUrl = await extensionSourceMapWorker.invoke('ExtensionSourceMap.resolveExtensionSourceMap', uri, Root.root, configs)

      console.log({ sourceMapUrl })
      if (sourceMapUrl) {
        cleanedSourceMapUrlMap[sourceMapUrl] = value
      } else {
        cleanedSourceMapUrlMap[key] = value
      }
    } else {
      cleanedSourceMapUrlMap[key] = value
    }
  }

  if (extensionSourceMapWorker) {
    await extensionSourceMapWorker[Symbol.asyncDispose]()
  }

  return cleanedSourceMapUrlMap
}
