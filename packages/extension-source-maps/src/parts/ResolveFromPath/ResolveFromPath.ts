import * as MapPathToSourceMapUrl from '../MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'
import * as ParseSourceLocation from '../ParseSourceLocation/ParseSourceLocation.ts'
import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
import * as Root from '../Root/Root.ts'
import * as NormalizeSourcePath from '../NormalizeSourcePath/NormalizeSourcePath.ts'
import * as GenerateExtensionSourceMaps from '../GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'
import { join } from 'node:path'

interface OriginalPosition {
  column?: number | null
  line?: number | null
  name?: string | null
  source?: string | null
}

interface CleanPositionMap {
  [key: string]: OriginalPosition[]
}

interface ResolveResult {
  originalUrl?: string | null
  originalLine?: number | null
  originalColumn?: number | null
  originalName?: string | null
  originalSource?: string | null
  originalLocation?: string | null
}

const JS_DEBUG_EXTENSION_PATH_REGEX = /\.vscode-extensions\/ms-vscode\.js-debug\/(.+)$/

/**
 * Extract js-debug version from a path
 * Example: .vscode-extensions/ms-vscode.js-debug-1.105.0/dist/extension.js -> 1.105.0
 */
const extractJsDebugVersion = (path: string): string | null => {
  const match = path.match(JS_DEBUG_EXTENSION_PATH_REGEX)
  if (!match) {
    return null
  }
  
  // The path after .vscode-extensions/ms-vscode.js-debug/
  const relativePath = match[1]
  
  // Extract version from path like: 1.105.0/dist/extension.js
  // or from directory name like: ms-vscode.js-debug-1.105.0/dist/extension.js
  const versionMatch = relativePath.match(/^(\d+\.\d+\.\d+)/)
  if (versionMatch) {
    return versionMatch[1]
  }
  
  // Try to extract from directory name pattern: ms-vscode.js-debug-1.105.0
  const dirMatch = path.match(/\.vscode-extensions\/ms-vscode\.js-debug-(\d+\.\d+\.\d+)/)
  if (dirMatch) {
    return dirMatch[1]
  }
  
  return null
}

export const resolveFromPath = async (uris: readonly string[]): Promise<readonly ResolveResult[]> => {
  const rootPath = Root.root
  const results: ResolveResult[] = new Array(uris.length).fill({})

  // Parse each URI and collect positions for source maps
  const sourceMapUrlToPositions: Record<string, number[]> = Object.create(null)
  const positionPointers: { index: number; sourceMapUrl: string }[] = []

  // Track js-debug versions that need source maps generated
  const jsDebugVersionsToGenerate = new Set<string>()

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i]
    console.log('[resolveFromPath] Processing URI:', uri)
    const parsed = ParseSourceLocation.parseSourceLocation(uri)
    console.log('[resolveFromPath] Parsed:', parsed)

    if (!parsed) {
      continue
    }

    // Extract js-debug version from the path
    const jsDebugVersion = extractJsDebugVersion(parsed.url)
    if (jsDebugVersion) {
      jsDebugVersionsToGenerate.add(jsDebugVersion)
    }

    const sourceMapUrl = MapPathToSourceMapUrl.mapPathToSourceMapUrl(parsed.url, rootPath, jsDebugVersion ?? undefined)
    console.log('[resolveFromPath] sourceMapUrl:', sourceMapUrl)

    if (!sourceMapUrl) {
      continue
    }

    if (!sourceMapUrlToPositions[sourceMapUrl]) {
      sourceMapUrlToPositions[sourceMapUrl] = []
    }

    sourceMapUrlToPositions[sourceMapUrl].push(parsed.line, parsed.column)
    positionPointers.push({ index: i, sourceMapUrl })
  }

  // Generate source maps for js-debug extensions if needed
  if (jsDebugVersionsToGenerate.size > 0) {
    const cacheDir = join(rootPath, '.extension-source-maps-cache')
    for (const version of jsDebugVersionsToGenerate) {
      console.log(`[resolveFromPath] Generating source maps for js-debug version ${version}...`)
      try {
        await GenerateExtensionSourceMaps.generateExtensionSourceMaps({
          cacheDir,
          extensionName: 'vscode-js-debug',
          repoUrl: 'git@github.com:microsoft/vscode-js-debug.git',
          version,
        })
      } catch (error) {
        console.log(`[resolveFromPath] Failed to generate source maps for js-debug ${version}:`, error)
      }
    }
  }

  // Resolve original positions using source-map-worker
  const sourceMapUrls = Object.keys(sourceMapUrlToPositions)
  console.log('[resolveFromPath] sourceMapUrls:', sourceMapUrls)
  if (sourceMapUrls.length === 0) {
    return results
  }

  try {
    console.log('[resolveFromPath] Launching source map worker...')
    await using rpc = await LaunchSourceMapWorker.launchSourceMapWorker()
    console.log('[resolveFromPath] Source map worker launched')
    const extendedOriginalNames = true
    const cleanPositionMap: CleanPositionMap = await rpc.invoke(
      'SourceMap.getCleanPositionsMap',
      sourceMapUrlToPositions,
      extendedOriginalNames,
    )
    console.log('[resolveFromPath] cleanPositionMap:', cleanPositionMap)

    // Apply original positions to results
    const offsetMap: Record<string, number> = Object.create(null)
    for (const pointer of positionPointers) {
      const positions = cleanPositionMap[pointer.sourceMapUrl] || []
      const offset = offsetMap[pointer.sourceMapUrl] || 0
      const original = positions[offset]
      offsetMap[pointer.sourceMapUrl] = offset + 1

      if (original) {
        const normalizedSource = NormalizeSourcePath.normalizeSourcePath(original.source ?? null)
        results[pointer.index] = {
          originalUrl: normalizedSource,
          originalLine: original.line ?? null,
          originalColumn: original.column ?? null,
          originalName: original.name ?? null,
          originalSource: normalizedSource,
          originalLocation:
            normalizedSource && original.line !== null && original.column !== null
              ? `${normalizedSource}:${original.line}:${original.column}`
              : null,
        }
      }
    }
  } catch (error) {
    console.log({ error })
    // ignore sourcemap resolution errors
  }

  return results
}
