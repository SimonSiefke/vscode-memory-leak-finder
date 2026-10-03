import type { Session } from '../Session/Session.ts'
import type { ScriptMap } from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import * as ResolveTrackedLocationSourceMaps from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'

export interface TrackedFunctionResult {
  readonly delta: number
  readonly functionName: string
  readonly originalColumn?: number | null
  readonly originalLine?: number | null
  readonly originalLocation?: string | null
  readonly originalName?: string | null
  readonly originalSource?: string | null
  readonly totalCount: number
}

interface ParsedFunctionName {
  readonly column: number | null
  readonly line: number | null
  readonly name: string
  readonly url: string | null
}

type TrackedFunctionsInput =
  | Record<string, number>
  | {
      readonly scriptMap?: ScriptMap
      readonly trackedFunctions: Record<string, number>
    }

const SCRIPT_ID_PATTERN = /^\d+:\d+:\d+$/
const FUNCTION_NAME_LOCATION_PATTERN = /^(.+?)\s*\((.+?):(\d+)(?::(\d+))?\)$/

const parseFunctionName = (functionName: string): ParsedFunctionName => {
  const matchWithName = functionName.match(FUNCTION_NAME_LOCATION_PATTERN)
  if (matchWithName) {
    return {
      column: matchWithName[4] ? Number.parseInt(matchWithName[4], 10) : 0,
      line: Number.parseInt(matchWithName[3], 10),
      name: matchWithName[1],
      url: matchWithName[2],
    }
  }
  const matchScriptIdOnly = functionName.match(SCRIPT_ID_PATTERN)
  if (matchScriptIdOnly) {
    const [scriptId, line, column] = functionName.split(':')
    return {
      column: Number.parseInt(column, 10),
      line: Number.parseInt(line, 10),
      name: functionName,
      url: scriptId,
    }
  }
  return {
    column: null,
    line: null,
    name: functionName,
    url: null,
  }
}

const getLocation = (parsed: ParsedFunctionName): string | undefined => {
  if (!parsed.url || parsed.line === null || parsed.column === null) {
    return undefined
  }
  return `${parsed.url}:${parsed.line}:${parsed.column}`
}

const getDisplayName = (functionName: string, parsed: ParsedFunctionName, originalName: string | null): string => {
  const name = originalName || (parsed.name === functionName && SCRIPT_ID_PATTERN.test(parsed.name) ? 'anonymous' : parsed.name)
  if (!parsed.url || parsed.line === null || parsed.column === null) {
    return name
  }
  return `${name} (${parsed.url}:${parsed.line}:${parsed.column})`
}

const hasTrackedFunctions = (
  value: TrackedFunctionsInput,
): value is Extract<TrackedFunctionsInput, { readonly trackedFunctions: Record<string, number> }> => {
  return 'trackedFunctions' in value
}

export const compareTrackedFunctions = async (
  before: TrackedFunctionsInput,
  after: TrackedFunctionsInput,
  _context: Session,
): Promise<readonly TrackedFunctionResult[]> => {
  const beforeFunctions = hasTrackedFunctions(before) ? before.trackedFunctions : before
  const afterData = hasTrackedFunctions(after) ? after : { scriptMap: undefined, trackedFunctions: after }
  const afterFunctions = afterData.trackedFunctions
  const allFunctionNames = new Set([...Object.keys(beforeFunctions), ...Object.keys(afterFunctions)])
  const parsedByFunctionName = new Map<string, ParsedFunctionName>()
  const locations: string[] = []
  const results: TrackedFunctionResult[] = []

  for (const functionName of allFunctionNames) {
    const beforeCount = beforeFunctions[functionName] || 0
    const afterCount = afterFunctions[functionName] || 0
    const delta = afterCount - beforeCount
    if (delta <= 0) {
      continue
    }
    const parsed = parseFunctionName(functionName)
    const location = getLocation(parsed)
    parsedByFunctionName.set(functionName, parsed)
    if (location) {
      locations.push(location)
    }
    results.push({
      delta,
      functionName,
      totalCount: afterCount,
    })
  }

  const uniqueLocations = [...new Set(locations)]
  const resolvedLocations = await ResolveTrackedLocationSourceMaps.resolveTrackedLocationSourceMaps(uniqueLocations, afterData.scriptMap)

  return results
    .map((result) => {
      const parsed = parsedByFunctionName.get(result.functionName)
      const location = parsed ? getLocation(parsed) : undefined
      const resolved = location ? resolvedLocations[location] : undefined
      if (!parsed || !resolved) {
        return result
      }
      return {
        ...result,
        functionName: getDisplayName(result.functionName, parsed, resolved.originalName),
        originalColumn: resolved.originalColumn,
        originalLine: resolved.originalLine,
        originalLocation: resolved.originalLocation,
        originalName: resolved.originalName,
        originalSource: resolved.originalSource,
      }
    })
    .toSorted((a, b) => b.delta - a.delta)
}
