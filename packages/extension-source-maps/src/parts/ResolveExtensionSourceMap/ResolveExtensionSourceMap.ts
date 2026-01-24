import { fileURLToPath } from 'node:url'
import * as ExtractJsDebugVersion from '../ExtractJsDebugVersion/ExtractJsDebugVersion.ts'
import * as GenerateExtensionSourceMaps from '../GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'
import * as MapPathToSourceMapUrl from '../MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'
import * as Root from '../Root/Root.ts'
import * as Assert from '@lvce-editor/assert'

interface ResolveExtensionSourceMapConfig {
  readonly extensionName: string
  readonly repoUrl: string
  readonly cacheDir: string
  readonly platform: string
  readonly buildScript: readonly string[]
  readonly moditications: readonly any[]
}

/**
 * Resolves an extension source map URL, handling js-debug version extraction
 * and source map generation if needed.
 *
 * This function:
 * 1. Extracts the js-debug version from the path (if applicable)
 * 2. Generates source maps for that version if they don't exist
 * 3. Returns the source map URL
 */
export const resolveExtensionSourceMap = async (
  path: string,
  root: string,
  configs: readonly ResolveExtensionSourceMapConfig[],
): Promise<string> => {
  Assert.string(path)
  Assert.string(root)
  Assert.array(configs)

  // Convert file:// URLs to paths (but not filenames that happen to start with "file:")
  // file:// URLs have at least 3 slashes (file:///) or a path after file:/
  // A filename like "file:name.js" should not be converted
  // Handle both file:// and file:/ formats (file:/ is not standard but may appear)
  let normalizedPath = path
  if (path.startsWith('file://')) {
    try {
      normalizedPath = fileURLToPath(path)
    } catch {
      // If conversion fails, keep the original path
    }
  } else if (path.startsWith('file:/') && path.length > 7) {
    // Handle non-standard file:/ format by converting to file:///
    // file:/path -> file:///path
    const standardizedUrl = 'file://' + path.slice(5) // Remove 'file:' and add 'file://'
    try {
      normalizedPath = fileURLToPath(standardizedUrl)
    } catch {
      // If conversion fails, keep the original path
    }
  }

  // Extract js-debug version from the path
  const jsDebugVersion = ExtractJsDebugVersion.extractJsDebugVersion(normalizedPath)

  // Generate source maps if this is a js-debug extension and version was found
  if (jsDebugVersion) {
    const config = configs.find((c) => c.extensionName === 'vscode-js-debug')
    if (!config) {
      console.log(`[resolveExtensionSourceMap] No configuration found for vscode-js-debug.`)
      return ''
    }
    const cacheDir = config.cacheDir
    console.log(`[resolveExtensionSourceMap] Generating source maps for ${config.extensionName} version ${jsDebugVersion}...`)
    try {
      await GenerateExtensionSourceMaps.generateExtensionSourceMaps({
        cacheDir,
        extensionName: config.extensionName,
        repoUrl: config.repoUrl,
        version: jsDebugVersion,
        buildScript: config.buildScript,
        platform: config.platform,
        modifications: config.moditications,
      })
    } catch (error) {
      console.log(`[resolveExtensionSourceMap] Failed to generate source maps for ${config.extensionName} ${jsDebugVersion}:`, error)
      // Continue anyway - might have partial source maps
    }
  }

  // Now resolve the source map URL with the version (if any)
  return MapPathToSourceMapUrl.mapPathToSourceMapUrl(normalizedPath, root, jsDebugVersion)
}
