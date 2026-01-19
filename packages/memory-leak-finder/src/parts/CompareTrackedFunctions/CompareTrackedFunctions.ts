import type { Session } from '../Session/Session.ts'
import * as FindMatchingSourceMap from '../FindMatchingSourceMap/FindMatchingSourceMap.ts'
import * as GetCleanPositionsMap from '../GetCleanPositionsMap/GetCleanPositionsMap.ts'
import { fileURLToPath } from 'node:url'
import { normalize, resolve, isAbsolute } from 'node:path'

export interface TrackedFunctionResult {
  readonly functionName: string
  readonly callCount: number
  readonly originalLocation?: string | null
  readonly originalLine?: number | null
  readonly originalColumn?: number | null
  readonly originalSource?: string | null
}

interface ParsedFunctionName {
  readonly name: string
  readonly url: string | null
  readonly line: number | null
  readonly column: number | null
}

const parseFunctionName = (functionName: string): ParsedFunctionName => {
  // Format: "functionName (url:line)" or "functionName (url:line:column)" or "functionName (scriptId:line:column)"
  // Handle both formats: with column and without column (backward compatibility)
  const match = functionName.match(/^(.+?)\s*\((.+?):(\d+)(?::(\d+))?\)$/)
  if (match) {
    const name = match[1]
    const urlOrScriptId = match[2]
    const line = Number.parseInt(match[3], 10)
    // If column is missing, default to 0 (we always need column for source map resolution)
    const column = match[4] ? Number.parseInt(match[4], 10) : 0
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
    let path: string
    if (url.startsWith('file://')) {
      path = fileURLToPath(url)
    } else {
      path = url
    }
    // Normalize the path (resolve relative paths, normalize separators, etc.)
    try {
      if (isAbsolute(path)) {
        // For absolute paths, just normalize (don't resolve)
        return normalize(path)
      } else {
        // For relative paths, resolve then normalize
        return normalize(resolve(path))
      }
    } catch {
      // If anything fails, just normalize
      return normalize(path)
    }
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

const convertScriptIdToUrl = (
  scriptMap: Record<string, { readonly url?: string; readonly sourceMapUrl?: string }>,
  scriptId: string,
): string | null => {
  // Try to find script by scriptId and return its URL
  if (scriptId in scriptMap) {
    return scriptMap[scriptId].url || null
  }
  // Try parsing as numeric scriptId
  const numericScriptId = Number.parseInt(scriptId, 10)
  if (!Number.isNaN(numericScriptId)) {
    if (String(numericScriptId) in scriptMap) {
      return scriptMap[String(numericScriptId)].url || null
    }
    // Also check if any key in scriptMap is a number that matches
    for (const key of Object.keys(scriptMap)) {
      const keyNum = Number.parseInt(key, 10)
      if (!Number.isNaN(keyNum) && keyNum === numericScriptId) {
        return scriptMap[key].url || null
      }
    }
  }
  return null
}

const findScript = (
  scriptMap: Record<string, { readonly url?: string; readonly sourceMapUrl?: string }>,
  urlOrScriptId: string,
): { readonly url?: string; readonly sourceMapUrl?: string } | null => {
  // First try to find by scriptId (if urlOrScriptId is a scriptId key in the map)
  // Check both string and numeric versions of the key
  if (urlOrScriptId in scriptMap) {
    return scriptMap[urlOrScriptId]
  }
  // Try parsing as numeric scriptId and check both string and number keys
  const numericScriptId = Number.parseInt(urlOrScriptId, 10)
  if (!Number.isNaN(numericScriptId)) {
    if (String(numericScriptId) in scriptMap) {
      return scriptMap[String(numericScriptId)]
    }
    // Also check if any key in scriptMap is a number that matches
    for (const key of Object.keys(scriptMap)) {
      const keyNum = Number.parseInt(key, 10)
      if (!Number.isNaN(keyNum) && keyNum === numericScriptId) {
        return scriptMap[key]
      }
    }
  }
  // Then try to find by URL (normalize both for comparison)
  const normalizedTarget = normalizeUrl(urlOrScriptId)
  for (const [key, script] of Object.entries(scriptMap)) {
    if (script.url) {
      const normalizedScriptUrl = normalizeUrl(script.url)
      // Compare normalized paths, and also try direct comparison
      if (
        normalizedScriptUrl === normalizedTarget ||
        script.url === urlOrScriptId ||
        normalizeUrl(script.url) === normalizeUrl(urlOrScriptId)
      ) {
        return script
      }
      // Also try comparing just the filename and path segments
      // This handles cases where paths might have different prefixes but same relative structure
      try {
        const targetParts = normalizedTarget.split(/[/\\]/)
        const scriptParts = normalizedScriptUrl.split(/[/\\]/)
        // Compare from the end (filename) backwards
        if (targetParts.length > 0 && scriptParts.length > 0) {
          const targetFilename = targetParts[targetParts.length - 1]
          const scriptFilename = scriptParts[scriptParts.length - 1]
          if (targetFilename === scriptFilename && targetFilename) {
            // If filenames match, check if the last few path segments match
            // Look for workbench.desktop.main.js specifically and match more segments
            const isWorkbenchFile = targetFilename === 'workbench.desktop.main.js'
            const segmentsToCheck = isWorkbenchFile
              ? Math.min(5, targetParts.length, scriptParts.length)
              : Math.min(3, targetParts.length, scriptParts.length)
            let segmentsMatch = true
            for (let i = 1; i <= segmentsToCheck; i++) {
              if (targetParts[targetParts.length - i] !== scriptParts[scriptParts.length - i]) {
                segmentsMatch = false
                break
              }
            }
            if (segmentsMatch) {
              return script
            }
          }
        }
      } catch {
        // Ignore errors in path comparison
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
      // Store original column from parsed result before we potentially modify it
      const originalColumn = parsed.column

      // Process functions with location info
      if (parsed.url && parsed.line !== null) {
        // Try to find the script - findScript handles both scriptId and URL lookups
        let script = findScript(scriptMap, parsed.url)
        let actualUrl = parsed.url

        // If not found and parsed.url looks like a scriptId (numeric), try converting to URL first
        // This helps when the scriptId format doesn't match the scriptMap key format
        if (!script) {
          const numericScriptId = Number.parseInt(parsed.url, 10)
          if (!Number.isNaN(numericScriptId)) {
            // It's a scriptId, try to convert to URL and lookup again
            const convertedUrl = convertScriptIdToUrl(scriptMap, parsed.url)
            if (convertedUrl) {
              actualUrl = convertedUrl
              script = findScript(scriptMap, convertedUrl)
            }
          }
        } else if (script.url) {
          // If we found the script and it has a URL, use that URL
          actualUrl = script.url
        }

        // Update functionName to show URL with line and column if we have a URL
        // Always include column in the functionName format: (url:line:column)
        // Use the original column from parsing - it was tracked, so we have it
        if (actualUrl && script) {
          // The column was tracked and is in the original functionName, use it directly
          const column = originalColumn !== null ? originalColumn : 0
          // Always update to ensure URL format with column is shown
          results[i].functionName = `${parsed.name} (${actualUrl}:${parsed.line}:${column})`
        }

        if (script) {
          const sourceMapUrl = getSourceMapUrl(script)
          if (!sourceMapUrl) {
            console.log(`[CompareTrackedFunctions] No source map URL found for ${parsed.url}`)
            // Keep the minified location in functionName, no originalLocation
            continue
          }
          if (!sourceMapUrlToPositions[sourceMapUrl]) {
            sourceMapUrlToPositions[sourceMapUrl] = []
          }
          // Use 0-based line/column for source map (they're 1-based in the functionName)
          // Always use both line and column (column defaults to 0 in 0-based if missing)
          const line = parsed.line - 1
          // parsed.column is already defaulted to 0 (1-based) in parsing if missing, so convert to 0-based
          // If it's 0 (1-based), use 0 (0-based) - start of line
          const column = parsed.column !== null && parsed.column > 0 ? parsed.column - 1 : 0
          sourceMapUrlToPositions[sourceMapUrl].push(line, column)
          positionPointers.push({ index: i, sourceMapUrl, parsed })
        } else {
          console.log(`[CompareTrackedFunctions] Script not found in scriptMap for ${parsed.url}`)
          // Keep the minified location in functionName, no originalLocation
        }
      } else {
        // Function without location info - log for debugging
        // Note: We can't resolve these without location info, but they should have been tracked with location
        console.log(
          `[CompareTrackedFunctions] Function "${parsed.name}" has no location info - this should not happen if tracking is working correctly`,
        )
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

          const result = results[pointer.index]
          const parsed = pointer.parsed

          // Keep functionName with minified location, add originalLocation separately
          // Always include both line and column in originalLocation format: <file>:<line>:<column>
          let originalLocation: string | null = null
          let originalLine: number | null = null
          let originalColumn: number | null = null
          let originalSource: string | null = null
          if (original) {
            // Set individual fields
            originalLine = original.line ?? null
            originalColumn = original.column ?? null
            originalSource = original.source ?? null

            // Build the original location string - always include both line and column when we have source and line
            if (original.source && original.line !== null) {
              // Always include column (default to 0 if not available)
              const column = original.column !== null ? original.column : 0
              originalLocation = `${original.source}:${original.line}:${column}`
            }
            // If we don't have both source and line, don't set originalLocation (keep it null)
            // This ensures originalLocation always follows the format <file>:<line>:<column>
          }

          results[pointer.index] = {
            ...result,
            originalLocation,
            originalLine,
            originalColumn,
            originalSource,
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
