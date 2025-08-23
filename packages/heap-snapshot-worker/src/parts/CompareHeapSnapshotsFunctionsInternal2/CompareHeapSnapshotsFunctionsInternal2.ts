import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getUniqueLocationMap2 } from '../GetUniqueLocationMap2/GetUniqueLocationMap2.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { UniqueLocation, UniqueLocationMap } from '../UniqueLocationMap/UniqueLocationMap.ts'

const emptyItem = {
  count: 0,
}

export interface CompareResult {
  readonly column: number
  readonly count: number
  readonly delta: number
  readonly line: number
  readonly scriptId: number
  readonly name: string
  readonly url?: string
  readonly sourceMapUrl?: string
  readonly originalSource?: string | null
  readonly originalUrl?: string | null
  readonly originalLine?: number | null
  readonly originalColumn?: number | null
  readonly originalName?: string | null
}

interface UniqueLocationWithDelta extends UniqueLocation {
  readonly delta: number
}

const getNewItems = (map1: UniqueLocationMap, map2: UniqueLocationMap, minCount: number): readonly UniqueLocationWithDelta[] => {
  const newitems: UniqueLocationWithDelta[] = []
  for (const key of Object.keys(map2)) {
    const oldItem = map1[key] || emptyItem
    const newItem = map2[key]
    const delta = newItem.count - oldItem.count
    if (delta > 0 && newItem.count >= minCount) {
      newitems.push({ ...newItem, delta })
    }
  }
  return newitems
}

const formatUniqueLocations = (
  uniqueItems: readonly UniqueLocationWithDelta[],
  locations: Uint32Array,
  itemsPerLocation: number,
  scriptIdOffset: number,
  lineOffset: number,
  columnOffset: number,
  objectIndexOffset: number,
  nodes: Uint32Array,
  nodeNameOffset: number,
  strings: readonly string[],
): readonly CompareResult[] => {
  return uniqueItems.map((newItem: UniqueLocationWithDelta) => {
    const scriptId = locations[newItem.index * itemsPerLocation + scriptIdOffset]
    const line = locations[newItem.index * itemsPerLocation + lineOffset]
    const column = locations[newItem.index * itemsPerLocation + columnOffset]
    const nodeIndex = locations[newItem.index * itemsPerLocation + objectIndexOffset]
    const nodeNameIndex = nodes[nodeIndex + nodeNameOffset]
    const nodeName = strings[nodeNameIndex] || 'anonymous'

    return {
      column,
      count: newItem.count,
      delta: newItem.delta,
      line,
      scriptId,
      name: nodeName,
    }
  })
}

export interface CompareFunctionsOptions {
  readonly minCount?: number
  readonly scriptMap?: Record<number, { readonly url?: string; readonly sourceMapUrl?: string }>
}

export const compareHeapSnapshotFunctionsInternal2 = async (
  before: Snapshot,
  after: Snapshot,
  options: CompareFunctionsOptions,
): Promise<readonly CompareResult[]> => {
  const minCount = options.minCount || 0
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset, objectIndexOffset } = getLocationFieldOffsets(
    after.meta.location_fields,
  )
  const nodeNameOffset = after.meta.node_fields.indexOf('name')
  const map1 = getUniqueLocationMap2(before)
  const map2 = getUniqueLocationMap2(after)
  const newItems = getNewItems(map1, map2, minCount)
  const formattedItems = formatUniqueLocations(
    newItems,
    after.locations,
    itemsPerLocation,
    scriptIdOffset,
    lineOffset,
    columnOffset,
    objectIndexOffset,
    after.nodes,
    nodeNameOffset,
    after.strings,
  )
  // Enrich with script url and original positions if a scriptMap is provided
  let scriptMap = options.scriptMap
  // If no scriptMap provided, try to load from .vscode-script-maps directory
  if (!scriptMap) {
    try {
      const pathMod = await import('node:path')
      const urlMod = await import('node:url')
      const fsPromises = await import('node:fs/promises')
      const thisDir: string = pathMod.dirname(urlMod.fileURLToPath(import.meta.url))
      const packageDir: string = pathMod.resolve(thisDir, '../../..')
      const repoRoot: string = pathMod.resolve(packageDir, '../..')
      const scriptMapsDir: string = pathMod.join(repoRoot, '.vscode-script-maps')
      const entries = await fsPromises.readdir(scriptMapsDir, { withFileTypes: true })
      const mergedMap: Record<number, { readonly url?: string; readonly sourceMapUrl?: string }> = Object.create(null)
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          const fullPath = pathMod.join(scriptMapsDir, entry.name)
          try {
            const content = await fsPromises.readFile(fullPath, 'utf8')
            const parsed = JSON.parse(content) as Record<number, { readonly url?: string; readonly sourceMapUrl?: string }>
            for (const [key, value] of Object.entries(parsed)) {
              const numericKey = Number(key)
              const existing = mergedMap[numericKey]
              if (!existing) {
                mergedMap[numericKey] = value
              } else {
                // prefer entry with a defined sourceMapUrl
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
  }
  let enriched: CompareResult[] = formattedItems.slice()
  if (scriptMap) {
    // Attach url and sourceMapUrl
    const sourceMapUrlToPositions: Record<string, number[]> = Object.create(null)
    const positionPointers: { index: number; sourceMapUrl: string }[] = []
    for (let i = 0; i < enriched.length; i++) {
      const item = enriched[i]
      const script = scriptMap[item.scriptId]
      if (script) {
        ;(item as any).url = script.url
        ;(item as any).sourceMapUrl = script.sourceMapUrl
        if (script.sourceMapUrl) {
          if (!sourceMapUrlToPositions[script.sourceMapUrl]) {
            sourceMapUrlToPositions[script.sourceMapUrl] = []
          }
          sourceMapUrlToPositions[script.sourceMapUrl].push(item.line, item.column)
          positionPointers.push({ index: i, sourceMapUrl: script.sourceMapUrl })
        }
      }
    }
    // Resolve original positions via source-map worker
    const sourceMapUrls = Object.keys(sourceMapUrlToPositions)
    if (sourceMapUrls.length > 0) {
      try {
        // Lazy import to avoid cost if not needed
        const rpcMod = await import('@lvce-editor/rpc')
        const pathMod = await import('node:path')
        const urlMod = await import('node:url')
        const thisDir: string = pathMod.dirname(urlMod.fileURLToPath(import.meta.url))
        const packageDir: string = pathMod.resolve(thisDir, '../../..')
        const sourceMapWorkerPath: string = pathMod.resolve(
          packageDir,
          '../source-map-worker/src/sourceMapWorkerMain.ts',
        )
        const rpc = await rpcMod.NodeWorkerRpcParent.create({
          stdio: 'inherit',
          path: sourceMapWorkerPath,
          commandMap: {},
        })
        const cleanPositionMap = await rpc.invoke(
          'SourceMap.getCleanPositionsMap',
          sourceMapUrlToPositions,
          false,
        )
        await rpc.dispose()
        // Map results back to items
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
          }
        }
      } catch {
        // ignore sourcemap resolution errors and return basic results
      }
    }
  }
  const sorted = enriched.toSorted((a, b) => b.count - a.count)
  return sorted
}
