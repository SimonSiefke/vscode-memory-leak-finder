import type { Session } from '../Session/Session.ts'
import * as FindMatchingSourceMap from '../FindMatchingSourceMap/FindMatchingSourceMap.ts'
import * as GetCleanPositionsMap from '../GetCleanPositionsMap/GetCleanPositionsMap.ts'
import { fileURLToPath } from 'node:url'

export interface TrackedFunctionResult {
  readonly functionName: string
  readonly callCount: number
}

interface ParsedFunctionName {
  readonly name: string
  readonly url: string | null
  readonly line: number | null
  readonly column: number | null
}

const parseFunctionName = (functionName: string): ParsedFunctionName => {
  // Format: "functionName (url:line)" or "functionName (url:line:column)" or "functionName (scriptId:line:column)"
  const match = functionName.match(/^(.+?)\s*\((.+?):(\d+)(?::(\d+))?\)$/)
  if (match) {
    const name = match[1]
    const urlOrScriptId = match[2]
    const line = Number.parseInt(match[3], 10)
    const column = match[4] ? Number.parseInt(match[4], 10) : null
    return {
      column,
      line,
      name,
      url: urlOrScriptId,
    }
  }
  // No location info, just function name
  return {
    column: null,
    line: null,
    name: functionName,
    url: null,
  }
}

const normalizeUrl = (url: string): string => {
  try {
    if (url.startsWith('file://')) {
      return fileURLToPath(url)
    }
    return url
  } catch {
    return url
  }
}

const isRelativeSourceMap = (sourceMapUrl: string): boolean => {
  return (
    !sourceMapUrl.startsWith('http://') &&
    !sourceMapUrl.startsWith('https://') &&
    !sourceMapUrl.startsWith('file://') &&
    !sourceMapUrl.startsWith('data:')
  )
}

const getSourceMapUrl = (script: { readonly url?: string; readonly sourceMapUrl?: string }): string => {
  if (script.url && script.sourceMapUrl && isRelativeSourceMap(script.sourceMapUrl)) {
    try {
      return new URL(script.sourceMapUrl, script.url).toString()
    } catch {
      // If URL construction fails, try to find matching source map
    }
  }
  let sourceMapUrl = script.sourceMapUrl || ''
  // If no source map URL was found, try to find a matching .js.map file
  if (!sourceMapUrl && script.url) {
    const matchingSourceMap = FindMatchingSourceMap.findMatchingSourceMap(script.url)
    if (matchingSourceMap) {
      sourceMapUrl = matchingSourceMap
    }
  }
  return sourceMapUrl
}

const findScript = (
  scriptMap: Record<string, { readonly url?: string; readonly sourceMapUrl?: string }>,
  urlOrScriptId: string,
): { readonly url?: string; readonly sourceMapUrl?: string } | null => {
  // First try to find by scriptId (if urlOrScriptId is a scriptId key in the map)
  if (urlOrScriptId in scriptMap) {
    return scriptMap[urlOrScriptId]
  }
  // Then try to find by URL (normalize both for comparison)
  const normalizedTarget = normalizeUrl(urlOrScriptId)
  for (const script of Object.values(scriptMap)) {
    if (script.url) {
      const normalizedScriptUrl = normalizeUrl(script.url)
      if (normalizedScriptUrl === normalizedTarget || script.url === urlOrScriptId) {
        return script
      }
    }
  }
  return null
}

export const compareTrackedFunctions = async (
  before:
    | Record<string, number>
    | {
        readonly trackedFunctions: Record<string, number>
        readonly scriptMap?: Record<string, { readonly url?: string; readonly sourceMapUrl?: string }>
      },
  after:
    | Record<string, number>
    | {
        readonly trackedFunctions: Record<string, number>
        readonly scriptMap?: Record<string, { readonly url?: string; readonly sourceMapUrl?: string }>
      },
  _context: Session,
): Promise<readonly TrackedFunctionResult[]> => {
  // Handle both old format (Record<string, number>) and new format (object with trackedFunctions and scriptMap)
  const beforeFunctions =
    typeof before === 'object' && before !== null && 'trackedFunctions' in before
      ? before.trackedFunctions
      : (before as Record<string, number>)
  const afterData =
    typeof after === 'object' && after !== null && 'trackedFunctions' in after
      ? after
      : { trackedFunctions: after as Record<string, number>, scriptMap: undefined }
  const afterFunctions = afterData.trackedFunctions
  const scriptMap = afterData.scriptMap

  const results: TrackedFunctionResult[] = []

  // Get all unique function names from both before and after
  const allFunctionNames = new Set([...Object.keys(beforeFunctions), ...Object.keys(afterFunctions)])

  // Calculate call counts for each function
  for (const functionName of allFunctionNames) {
    const beforeCount = beforeFunctions[functionName] || 0
    const afterCount = afterFunctions[functionName] || 0
    const callCount = afterCount - beforeCount

    if (callCount > 0) {
      results.push({
        functionName,
        callCount,
      })
    }
  }

  // Sort by call count descending (highest first)
  results.sort((a, b) => b.callCount - a.callCount)

  // If we have a scriptMap, resolve source maps for the results
  if (scriptMap && Object.keys(scriptMap).length > 0) {
    console.log(`[CompareTrackedFunctions] scriptMap has ${Object.keys(scriptMap).length} entries`)
    const sourceMapUrlToPositions: Record<string, number[]> = Object.create(null)
    const positionPointers: { index: number; sourceMapUrl: string; parsed: ParsedFunctionName }[] = []

    // Collect positions for source map resolution
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const parsed = parseFunctionName(result.functionName)

      if (parsed.url && parsed.line !== null) {
        const script = findScript(scriptMap, parsed.url)
        if (script) {
          const sourceMapUrl = getSourceMapUrl(script)
          if (!sourceMapUrl) {
            console.log(`[CompareTrackedFunctions] No source map URL found for ${parsed.url}`)
            continue
          }
          if (!sourceMapUrlToPositions[sourceMapUrl]) {
            sourceMapUrlToPositions[sourceMapUrl] = []
          }
          // Use 0-based line/column for source map (they're 1-based in the functionName)
          const line = parsed.line - 1
          const column = parsed.column !== null ? parsed.column - 1 : 0
          sourceMapUrlToPositions[sourceMapUrl].push(line, column)
          positionPointers.push({ index: i, sourceMapUrl, parsed })
        } else {
          console.log(`[CompareTrackedFunctions] Script not found in scriptMap for ${parsed.url}`)
        }
      }
    }

    // Resolve original positions using source-map-worker
    const sourceMapUrls = Object.keys(sourceMapUrlToPositions)
    console.log(`[CompareTrackedFunctions] Resolving ${sourceMapUrls.length} source maps for ${positionPointers.length} positions`)
    if (sourceMapUrls.length > 0) {
      try {
        const classNames = true
        const cleanPositionMap = await GetCleanPositionsMap.getCleanPositionsMap(sourceMapUrlToPositions, classNames)
        const offsetMap: Record<string, number> = Object.create(null)

        for (const pointer of positionPointers) {
          const positions = cleanPositionMap[pointer.sourceMapUrl] || []
          const offset = offsetMap[pointer.sourceMapUrl] || 0
          const original = positions[offset]
          offsetMap[pointer.sourceMapUrl] = offset + 1

          if (original) {
            const result = results[pointer.index]
            const parsed = pointer.parsed
            let newFunctionName = parsed.name

            // Build the original location string
            if (original.source && original.line !== null && original.column !== null) {
              newFunctionName = `${parsed.name} (${original.source}:${original.line}:${original.column})`
            } else if (original.source && original.line !== null) {
              newFunctionName = `${parsed.name} (${original.source}:${original.line})`
            } else if (original.source) {
              newFunctionName = `${parsed.name} (${original.source})`
            }

            results[pointer.index] = {
              ...result,
              functionName: newFunctionName,
            }
          }
        }
      } catch (error) {
        console.log({ error })
        // ignore sourcemap resolution errors
      }
    }
  }

  return results
}
