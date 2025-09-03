import type { CompareResult } from '../CompareHeapSnapshotsFunctionsInternal2/CompareHeapSnapshotsFunctionsInternal2.ts'
import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readdir, readFile } from 'node:fs/promises'
import { getSourceMapWorkerPath } from '../SourceMapWorkerPath/SourceMapWorkerPath.ts'

export interface ScriptInfo {
  readonly url?: string
  readonly sourceMapUrl?: string
}

export const addOriginalSources = async (items: readonly CompareResult[]): Promise<readonly any[]> => {
  let scriptMap: Record<number, ScriptInfo> | undefined
  // Always attempt to load script maps from disk
  try {
    const thisDir: string = dirname(fileURLToPath(import.meta.url))
    const packageDir: string = resolve(thisDir, '../../..')
    const repoRoot: string = resolve(packageDir, '../..')
    const scriptMapsDir: string = join(repoRoot, '.vscode-script-maps')
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
            if (!existing) {
              mergedMap[numericKey] = value
            } else {
              if (!existing.sourceMapUrl && value.sourceMapUrl) {
                mergedMap[numericKey] = value
              }
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

  const enriched: CompareResult[] = items.slice()
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
      item.sourceMapUrl = script.sourceMapUrl
      if (item.url) {
        item.sourceLocation = `${item.url}:${item.line}:${item.column}`
      }
      if (script.sourceMapUrl) {
        if (!sourceMapUrlToPositions[script.sourceMapUrl]) {
          sourceMapUrlToPositions[script.sourceMapUrl] = []
        }
        sourceMapUrlToPositions[script.sourceMapUrl].push(item.line, item.column)
        positionPointers.push({ index: i, sourceMapUrl: script.sourceMapUrl })
      }
    }
  }

  const sourceMapUrls = Object.keys(sourceMapUrlToPositions)
  if (sourceMapUrls.length === 0) {
    return enriched
  }

  try {
    const sourceMapWorkerPath: string = getSourceMapWorkerPath()

    const rpc = await NodeWorkerRpcParent.create({
      stdio: 'inherit',
      path: sourceMapWorkerPath,
      commandMap: {},
    })
    const extendedOriginalNames = true
    const cleanPositionMap = await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapUrlToPositions, extendedOriginalNames)
    await rpc.dispose()

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
