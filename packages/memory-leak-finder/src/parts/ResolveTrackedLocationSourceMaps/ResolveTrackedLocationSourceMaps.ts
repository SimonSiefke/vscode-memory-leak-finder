import { normalize, resolve, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as FindMatchingSourceMap from '../FindMatchingSourceMap/FindMatchingSourceMap.ts'
import * as GetCleanPositionsMap from '../GetCleanPositionsMap/GetCleanPositionsMap.ts'

export interface ScriptMapEntry {
  readonly sourceMapUrl?: string
  readonly url?: string
}

export type ScriptMap = Record<string, ScriptMapEntry>

export interface ResolvedTrackedLocation {
  readonly originalColumn: number | null
  readonly originalLine: number | null
  readonly originalLocation: string | null
  readonly originalName: string | null
  readonly originalSource: string | null
}

const emptyResolvedLocation: ResolvedTrackedLocation = {
  originalColumn: null,
  originalLine: null,
  originalLocation: null,
  originalName: null,
  originalSource: null,
}

const parseLocation = (location: string): { readonly column: number; readonly line: number; readonly urlOrScriptId: string } | undefined => {
  const match = location.match(/^(.+):(\d+):(\d+)$/)
  if (!match) {
    return undefined
  }
  return {
    column: Number.parseInt(match[3], 10),
    line: Number.parseInt(match[2], 10),
    urlOrScriptId: match[1],
  }
}

const normalizeUrl = (url: string): string => {
  try {
    const path = url.startsWith('file://') ? fileURLToPath(url) : url
    if (isAbsolute(path)) {
      return normalize(path)
    }
    return normalize(resolve(path))
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

const getSourceMapUrl = (script: ScriptMapEntry): string => {
  if (script.url && script.sourceMapUrl && isRelativeSourceMap(script.sourceMapUrl)) {
    try {
      return new URL(script.sourceMapUrl, script.url).toString()
    } catch {
      // Fall through to direct or matching source-map lookup.
    }
  }
  if (script.sourceMapUrl) {
    return script.sourceMapUrl
  }
  if (script.url) {
    return FindMatchingSourceMap.findMatchingSourceMap(script.url) || ''
  }
  return ''
}

const findWorkbenchScript = (scriptMap: ScriptMap): ScriptMapEntry | undefined => {
  for (const script of Object.values(scriptMap)) {
    if (script.url?.includes('workbench.desktop.main.js')) {
      return script
    }
  }
  return undefined
}

const findScript = (scriptMap: ScriptMap, urlOrScriptId: string): ScriptMapEntry | undefined => {
  if (urlOrScriptId in scriptMap) {
    return scriptMap[urlOrScriptId]
  }

  const numericScriptId = Number.parseInt(urlOrScriptId, 10)
  if (!Number.isNaN(numericScriptId)) {
    for (const [key, script] of Object.entries(scriptMap)) {
      if (Number.parseInt(key, 10) === numericScriptId) {
        return script
      }
    }
    return findWorkbenchScript(scriptMap)
  }

  const normalizedTarget = normalizeUrl(urlOrScriptId)
  for (const script of Object.values(scriptMap)) {
    if (!script.url) {
      continue
    }
    const normalizedScriptUrl = normalizeUrl(script.url)
    if (script.url === urlOrScriptId || normalizedScriptUrl === normalizedTarget) {
      return script
    }
  }
  return undefined
}

export const resolveTrackedLocationSourceMaps = async (
  locations: readonly string[],
  scriptMap: ScriptMap | undefined,
): Promise<Record<string, ResolvedTrackedLocation>> => {
  const result: Record<string, ResolvedTrackedLocation> = Object.create(null)
  for (const location of locations) {
    result[location] = emptyResolvedLocation
  }
  if (!scriptMap || Object.keys(scriptMap).length === 0) {
    return result
  }

  const sourceMapUrlToPositions: Record<string, number[]> = Object.create(null)
  const pointers: { readonly location: string; readonly sourceMapUrl: string }[] = []

  for (const location of locations) {
    const parsed = parseLocation(location)
    if (!parsed) {
      continue
    }
    const script = findScript(scriptMap, parsed.urlOrScriptId)
    if (!script) {
      continue
    }
    const sourceMapUrl = getSourceMapUrl(script)
    if (!sourceMapUrl) {
      continue
    }
    sourceMapUrlToPositions[sourceMapUrl] ||= []
    sourceMapUrlToPositions[sourceMapUrl].push(parsed.line - 1, parsed.column > 0 ? parsed.column - 1 : 0)
    pointers.push({ location, sourceMapUrl })
  }

  const sourceMapUrls = Object.keys(sourceMapUrlToPositions)
  if (sourceMapUrls.length === 0) {
    return result
  }

  const cleanPositionMap = await GetCleanPositionsMap.getCleanPositionsMap(sourceMapUrlToPositions, true)
  const offsetMap: Record<string, number> = Object.create(null)
  for (const pointer of pointers) {
    const positions = cleanPositionMap[pointer.sourceMapUrl] || []
    const offset = offsetMap[pointer.sourceMapUrl] || 0
    const original = positions[offset]
    offsetMap[pointer.sourceMapUrl] = offset + 1
    if (!original) {
      continue
    }
    const originalColumn = original.column ?? null
    const originalLine = original.line ?? null
    const originalSource = original.source ?? null
    result[pointer.location] = {
      originalColumn,
      originalLine,
      originalLocation: originalSource && originalLine !== null ? `${originalSource}:${originalLine}:${originalColumn ?? 0}` : null,
      originalName: original.name ?? null,
      originalSource,
    }
  }

  return result
}
