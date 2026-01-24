import * as MapPathToSourceMapUrl from '../MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'
import * as ParseSourceLocation from '../ParseSourceLocation/ParseSourceLocation.ts'
import * as Root from '../Root/Root.ts'
import * as GenerateExtensionSourceMaps from '../GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'
import * as ExtractJsDebugVersion from '../ExtractJsDebugVersion/ExtractJsDebugVersion.ts'
import * as ResolveOriginalPositions from '../ResolveOriginalPositions/ResolveOriginalPositions.ts'
import type { PositionPointer } from '../PositionPointer/PositionPointer.ts'
import { join } from 'node:path'

interface ResolveResult {
  originalUrl?: string | null
  originalLine?: number | null
  originalColumn?: number | null
  originalName?: string | null
  originalSource?: string | null
  originalLocation?: string | null
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
    const jsDebugVersion = ExtractJsDebugVersion.extractJsDebugVersion(parsed.url)
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

  await ResolveOriginalPositions.resolveOriginalPositionsToResults(results, sourceMapUrlToPositions, positionPointers)

  return results
}
