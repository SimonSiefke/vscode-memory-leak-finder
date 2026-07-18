import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { canonicalizeMemoryCityPath } from '../CanonicalizeMemoryCityPath/CanonicalizeMemoryCityPath.ts'
import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
import type { MemoryCityScriptMap } from '../MemoryCityTypes/MemoryCityTypes.ts'

export interface ResolvedMemoryCitySources {
  readonly allocationSources: ReadonlyMap<number, string>
  readonly locationSources: ReadonlyMap<number, string>
}

interface SourcePosition {
  readonly column: number
  readonly fallbackUrl: string
  readonly key: number
  readonly line: number
  readonly origin: 'allocation' | 'location'
  readonly scriptId: number
  readonly sourceMapUrl: string
}

interface OriginalPosition {
  readonly source?: string | null
}

const getSourceMapUrl = (scriptUrl: string, sourceMapUrl: string): string => {
  if (!sourceMapUrl || /^(data:|file:|https?:)/.test(sourceMapUrl)) {
    return sourceMapUrl
  }
  try {
    return new URL(sourceMapUrl, scriptUrl).href
  } catch {
    return sourceMapUrl
  }
}

const getAllocationPositions = (snapshot: Snapshot, scriptMap: MemoryCityScriptMap): SourcePosition[] => {
  const traceFunctionInfos = snapshot.traceFunctionInfos
  const traceTree = snapshot.traceTree
  const functionFields = snapshot.meta.trace_function_info_fields || []
  const traceNodeFields = snapshot.meta.trace_node_fields || []
  if (!traceFunctionInfos || !traceTree || functionFields.length === 0 || traceNodeFields.length === 0) {
    return []
  }
  const functionInfoIndexOffset = traceNodeFields.indexOf('function_info_index')
  const traceIdOffset = traceNodeFields.indexOf('id')
  const traceRecordLength = traceNodeFields.indexOf('children')
  const scriptNameOffset = functionFields.indexOf('script_name')
  const scriptIdOffset = functionFields.indexOf('script_id')
  const lineOffset = functionFields.indexOf('line')
  const columnOffset = functionFields.indexOf('column')
  if (functionInfoIndexOffset === -1 || traceIdOffset === -1 || traceRecordLength <= 0) {
    return []
  }
  const positions: SourcePosition[] = []
  for (let index = 0; index < traceTree.length; index += traceRecordLength) {
    const traceId = traceTree[index + traceIdOffset]
    const functionInfoIndex = traceTree[index + functionInfoIndexOffset]
    const offset = functionInfoIndex * functionFields.length
    const scriptId = traceFunctionInfos[offset + scriptIdOffset]
    const script = scriptMap[String(scriptId)]
    const scriptNameIndex = traceFunctionInfos[offset + scriptNameOffset]
    const fallbackUrl = script?.url || snapshot.strings[scriptNameIndex] || ''
    positions.push({
      column: traceFunctionInfos[offset + columnOffset],
      fallbackUrl,
      key: traceId,
      line: traceFunctionInfos[offset + lineOffset],
      origin: 'allocation',
      scriptId,
      sourceMapUrl: getSourceMapUrl(fallbackUrl, script?.sourceMapUrl || ''),
    })
  }
  return positions
}

const getLocationPositions = (snapshot: Snapshot, scriptMap: MemoryCityScriptMap): SourcePosition[] => {
  const fields = snapshot.meta.location_fields
  const recordLength = fields.length
  const objectIndexOffset = fields.indexOf('object_index')
  const scriptIdOffset = fields.indexOf('script_id')
  const lineOffset = fields.indexOf('line')
  const columnOffset = fields.indexOf('column')
  const nodeFields = snapshot.meta.node_fields
  const nodeFieldCount = nodeFields.length
  const traceNodeIdOffset = nodeFields.indexOf('trace_node_id')
  const positions: SourcePosition[] = []
  for (let index = 0; index < snapshot.locations.length; index += recordLength) {
    const key = snapshot.locations[index + objectIndexOffset] / nodeFieldCount
    if (traceNodeIdOffset !== -1 && snapshot.nodes[key * nodeFieldCount + traceNodeIdOffset] !== 0) {
      continue
    }
    const scriptId = snapshot.locations[index + scriptIdOffset]
    const script = scriptMap[String(scriptId)]
    const fallbackUrl = script?.url || ''
    positions.push({
      column: snapshot.locations[index + columnOffset],
      fallbackUrl,
      key,
      line: snapshot.locations[index + lineOffset],
      origin: 'location',
      scriptId,
      sourceMapUrl: getSourceMapUrl(fallbackUrl, script?.sourceMapUrl || ''),
    })
  }
  return positions
}

const resolveOriginalPositions = async (positions: readonly SourcePosition[]): Promise<ReadonlyMap<SourcePosition, string>> => {
  const sourceMapPositions: Record<string, number[]> = Object.create(null)
  const pointers = new Map<SourcePosition, number>()
  const pointerByPosition = new Map<string, number>()
  for (const position of positions) {
    if (!position.sourceMapUrl) {
      continue
    }
    const values = (sourceMapPositions[position.sourceMapUrl] ||= [])
    const key = `${position.sourceMapUrl}\0${position.line}\0${position.column}`
    let pointer = pointerByPosition.get(key)
    if (pointer === undefined) {
      pointer = values.length / 2
      pointerByPosition.set(key, pointer)
      values.push(position.line, position.column)
    }
    pointers.set(position, pointer)
  }
  const resolved = new Map<SourcePosition, string>()
  if (Object.keys(sourceMapPositions).length > 0) {
    try {
      await using rpc = await LaunchSourceMapWorker.launchSourceMapCoordinator()
      const result = (await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapPositions, true)) as Record<
        string,
        readonly OriginalPosition[]
      >
      for (const position of positions) {
        const pointer = pointers.get(position)
        const original = pointer === undefined ? undefined : result[position.sourceMapUrl]?.[pointer]
        resolved.set(position, canonicalizeMemoryCityPath(original?.source || position.fallbackUrl))
      }
      return resolved
    } catch (error) {
      console.warn('Failed to resolve Memory City source maps', error)
    }
  }
  for (const position of positions) {
    resolved.set(position, canonicalizeMemoryCityPath(position.fallbackUrl))
  }
  return resolved
}

export const resolveMemoryCitySources = async (snapshot: Snapshot, scriptMap: MemoryCityScriptMap): Promise<ResolvedMemoryCitySources> => {
  const allocationPositions = getAllocationPositions(snapshot, scriptMap)
  const locationPositions = getLocationPositions(snapshot, scriptMap)
  const positions = [...allocationPositions, ...locationPositions]
  const resolved = await resolveOriginalPositions(positions)
  const allocationSources = new Map<number, string>()
  const locationSources = new Map<number, string>()
  for (const position of allocationPositions) {
    allocationSources.set(position.key, resolved.get(position) || 'runtime/unattributed/unknown')
  }
  for (const position of locationPositions) {
    locationSources.set(position.key, resolved.get(position) || 'runtime/unattributed/unknown')
  }
  return { allocationSources, locationSources }
}
