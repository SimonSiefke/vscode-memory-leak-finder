import { join } from 'node:path'
import * as ExtractJsDebugVersion from '../ExtractJsDebugVersion/ExtractJsDebugVersion.ts'
import * as GenerateExtensionSourceMaps from '../GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'
import * as MapPathToSourceMapUrl from '../MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'
import * as Root from '../Root/Root.ts'

/**
 * Resolves an extension source map URL, handling js-debug version extraction
 * and source map generation if needed.
 *
 * This function:
 * 1. Extracts the js-debug version from the path (if applicable)
 * 2. Generates source maps for that version if they don't exist
 * 3. Returns the source map URL
 */
export const resolveExtensionSourceMap = async (path: string, root?: string): Promise<string | null> => {
  const rootPath = root || Root.root

  // Extract js-debug version from the path
  const jsDebugVersion = ExtractJsDebugVersion.extractJsDebugVersion(path)

  // Generate source maps if this is a js-debug extension and version was found
  if (jsDebugVersion) {
    const cacheDir = join(rootPath, '.extension-source-maps-cache')
    console.log(`[resolveExtensionSourceMap] Generating source maps for js-debug version ${jsDebugVersion}...`)
    try {
      await GenerateExtensionSourceMaps.generateExtensionSourceMaps({
        cacheDir,
        extensionName: 'vscode-js-debug',
        repoUrl: 'git@github.com:microsoft/vscode-js-debug.git',
        version: jsDebugVersion,
      })
    } catch (error) {
      console.log(`[resolveExtensionSourceMap] Failed to generate source maps for js-debug ${jsDebugVersion}:`, error)
      // Continue anyway - might have partial source maps
    }
  }

  // Now resolve the source map URL with the version (if any)
  return MapPathToSourceMapUrl.mapPathToSourceMapUrl(path, rootPath, jsDebugVersion ?? undefined)
}
