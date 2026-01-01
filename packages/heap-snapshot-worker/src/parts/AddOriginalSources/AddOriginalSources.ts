import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CompareResult } from '../CompareHeapSnapshotsFunctionsInternal2/CompareHeapSnapshotsFunctionsInternal2.ts'
import * as FindMatchingSourceMap from '../FindMatchingSourceMap/FindMatchingSourceMap.ts'
import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
import { root } from '../Root/Root.ts'

export interface ScriptInfo {
  readonly sourceMapUrl?: string
  readonly url?: string
}

const isRelativeSourceMap = (sourceMapUrl) => {
  if (sourceMapUrl.startsWith('file://')) {
    return false
  }
  if (sourceMapUrl.startsWith('data:')) {
    return false
  }
  if (sourceMapUrl.startsWith('http://')) {
    return false
  }
  if (sourceMapUrl.startsWith('https://')) {
    return false
  }
  return true
}

const getSourceMapUrl = (script: ScriptInfo): string => {
  if (script.url && script.sourceMapUrl && isRelativeSourceMap(script.sourceMapUrl)) {
    return new URL(script.sourceMapUrl, script.url).toString()
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

export const addOriginalSources = async (items: readonly CompareResult[]): Promise<readonly any[]> => {
  let scriptMap: Record<number, ScriptInfo> | undefined
  // Always attempt to load script maps from disk
  try {
    const scriptMapsDir: string = join(root, '.vscode-script-maps')
    const entries = await readdir(scriptMapsDir, { withFileTypes: true })
    const mergedMap: Record<number, ScriptInfo> = Object.create(null)
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const fullPath = join(scriptMapsDir, entry.name)
        try {
          const content = await readFile(fullPath, 'utf8')
          const parsed = JSON.parse(content) as Record<number, ScriptInfo>
          for (const [key, value] of Object.entries(parsed)) {
            const numericKey = Number(key)
            const existing = mergedMap[numericKey]
            if (existing) {
              if (!existing.sourceMapUrl && value.sourceMapUrl) {
                mergedMap[numericKey] = value
              }
            } else {
              mergedMap[numericKey] = value
            }
          }
        } catch {
          // ignore invalid files
        }
      }
    }
    scriptMap = mergedMap
  } catch {
    // ignore if directory not found
  }

  const enriched: CompareResult[] = [...items]
  if (!scriptMap) {
    return enriched
  }

  const sourceMapUrlToPositions: Record<string, number[]> = Object.create(null)
  const positionPointers: { index: number; sourceMapUrl: string }[] = []

  for (let i = 0; i < enriched.length; i++) {
    const item = enriched[i] as any
    const script = scriptMap[item.scriptId]
    if (script) {
      item.url = script.url
      const sourceMapUrl = getSourceMapUrl(script)
      item.sourceMapUrl = sourceMapUrl
      if (item.url) {
        item.sourceLocation = `${item.url}:${item.line}:${item.column}`
      }
      if (sourceMapUrl) {
        if (!sourceMapUrlToPositions[sourceMapUrl]) {
          sourceMapUrlToPositions[sourceMapUrl] = []
        }
        sourceMapUrlToPositions[sourceMapUrl].push(item.line, item.column)
        positionPointers.push({ index: i, sourceMapUrl: sourceMapUrl })
      }
    }
  }

  const sourceMapUrls = Object.keys(sourceMapUrlToPositions)
  if (sourceMapUrls.length === 0) {
    return enriched
  }

  try {
    await using rpc = await LaunchSourceMapWorker.launchSourceMapWorker()
    const extendedOriginalNames = true
    const cleanPositionMap = await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapUrlToPositions, extendedOriginalNames)
    const offsetMap: Record<string, number> = Object.create(null)
    for (const pointer of positionPointers) {
      const positions = cleanPositionMap[pointer.sourceMapUrl] || []
      const offset = offsetMap[pointer.sourceMapUrl] || 0
      const original = positions[offset]
      offsetMap[pointer.sourceMapUrl] = offset + 1
      if (original) {
        const target = enriched[pointer.index] as any
        target.originalSource = original.source ?? null
        target.originalUrl = original.source ?? null
        target.originalLine = original.line ?? null
        target.originalColumn = original.column ?? null
        target.originalName = original.name ?? null
        if (target.originalUrl && target.originalLine !== null && target.originalColumn !== null) {
          target.originalLocation = `${target.originalUrl}:${target.originalLine}:${target.originalColumn}`
        }
      }
    }
  } catch (error) {
    console.log({ error })
    // ignore sourcemap resolution errors
  }

  return enriched
}
