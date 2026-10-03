import { buildRetainerGraph } from '../GetRetainerRiverAnalysis/GetRetainerRiverAnalysis.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

const MissingNode = 0xffffffff

export interface PromiseRetainerPathSegment {
  readonly edgeType: string
  readonly property: string
  readonly sourceName: string
  readonly sourceType: string
  readonly targetName: string
  readonly targetType: string
}

export interface PendingPromiseRetainer {
  readonly count: number
  readonly path: readonly PromiseRetainerPathSegment[]
  readonly promises: readonly { readonly heapObjectId: string; readonly retainedBytes: number }[]
  readonly retainedBytes: number
}

export interface PendingPromiseRetainerReport {
  readonly isLeak: boolean
  readonly retainers: readonly PendingPromiseRetainer[]
  readonly summary: { readonly pendingPromises: number; readonly retainedBytes: number; readonly retainingPaths: number }
}

export const getPendingPromiseRetainers = (
  snapshot: Snapshot,
  beforeHeapObjectIds: readonly string[],
  afterHeapObjectIds: readonly string[],
  minimumCount = 1,
): PendingPromiseRetainerReport => {
  const nodeFields = snapshot.meta.node_fields
  const edgeFields = snapshot.meta.edge_fields
  const nodeFieldCount = nodeFields.length
  const edgeFieldCount = edgeFields.length
  const idOffset = nodeFields.indexOf('id')
  const nameOffset = nodeFields.indexOf('name')
  const typeOffset = nodeFields.indexOf('type')
  const edgeNameOffset = edgeFields.indexOf('name_or_index')
  const edgeTypeOffset = edgeFields.indexOf('type')
  const nodeTypes = snapshot.meta.node_types[0] || []
  const edgeTypes = snapshot.meta.edge_types[0] || []
  const beforeIds = new Set(beforeHeapObjectIds)
  const afterIds = new Set(afterHeapObjectIds.filter((id) => !beforeIds.has(id)))
  const ordinalById = new Map<string, number>()
  for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
    const offset = ordinal * nodeFieldCount
    const id = String(snapshot.nodes[offset + idOffset])
    if (
      afterIds.has(id) &&
      nodeTypes[snapshot.nodes[offset + typeOffset]] === 'object' &&
      snapshot.strings[snapshot.nodes[offset + nameOffset]] === 'Promise'
    ) {
      ordinalById.set(id, ordinal)
    }
  }
  const graph = buildRetainerGraph(snapshot)
  const getNodeName = (ordinal: number): string => snapshot.strings[snapshot.nodes[ordinal * nodeFieldCount + nameOffset]] || '(anonymous)'
  const getNodeType = (ordinal: number): string => nodeTypes[snapshot.nodes[ordinal * nodeFieldCount + typeOffset]] || 'unknown'
  const groups = new Map<
    string,
    { path: readonly PromiseRetainerPathSegment[]; promises: Array<{ heapObjectId: string; retainedBytes: number }> }
  >()
  for (const [heapObjectId, ordinal] of ordinalById) {
    if (!graph.reachable[ordinal]) {
      continue
    }
    const ordinals: number[] = []
    let current = ordinal
    while (current !== MissingNode) {
      ordinals.push(current)
      if (current === 0) {
        break
      }
      current = graph.parent[current]
    }
    ordinals.reverse()
    const path: PromiseRetainerPathSegment[] = []
    for (let index = 1; index < ordinals.length; index++) {
      const source = ordinals[index - 1]
      const target = ordinals[index]
      const edgeIndex = graph.parentEdge[target]
      const edgeOffset = edgeIndex * edgeFieldCount
      const edgeType = edgeTypes[snapshot.edges[edgeOffset + edgeTypeOffset]] || 'unknown'
      const nameOrIndex = snapshot.edges[edgeOffset + edgeNameOffset]
      const property = edgeType === 'element' || edgeType === 'hidden' ? `[${nameOrIndex}]` : snapshot.strings[nameOrIndex] || edgeType
      path.push({
        edgeType,
        property,
        sourceName: getNodeName(source),
        sourceType: getNodeType(source),
        targetName: getNodeName(target),
        targetType: getNodeType(target),
      })
    }
    const key = JSON.stringify(
      path.map((segment) => [
        segment.edgeType,
        segment.edgeType === 'element' || segment.edgeType === 'hidden' ? '[]' : segment.property,
        segment.sourceName,
        segment.targetName,
      ]),
    )
    const group = groups.get(key) || { path, promises: [] }
    group.promises.push({ heapObjectId, retainedBytes: Math.round(graph.retainedSizes[ordinal]) })
    groups.set(key, group)
  }
  const retainers = [...groups.values()]
    .map((group): PendingPromiseRetainer => ({
      count: group.promises.length,
      path: group.path,
      promises: group.promises,
      retainedBytes: group.promises.reduce((total, promise) => total + promise.retainedBytes, 0),
    }))
    .filter((group) => group.count >= minimumCount)
    .sort((a, b) => b.retainedBytes - a.retainedBytes || b.count - a.count)
  return {
    isLeak: retainers.length > 0,
    retainers,
    summary: {
      pendingPromises: retainers.reduce((total, group) => total + group.count, 0),
      retainedBytes: retainers.reduce((total, group) => total + group.retainedBytes, 0),
      retainingPaths: retainers.length,
    },
  }
}
