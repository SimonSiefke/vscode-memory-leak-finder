import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { createStringValueResolver } from '../GetConcatenatedStringsFromHeapSnapshotInternal/GetConcatenatedStringsFromHeapSnapshotInternal.ts'

export interface StringLocationGroup {
  readonly string: string | null
  readonly sourceLocation: string | null
  readonly count: number
  readonly heapObjectId?: string
  readonly stringType?: string
}

export type StringLocationScriptMap = Readonly<Record<string, { readonly url?: string }>>

const metadataEdges = new Set([
  'map',
  'shared',
  'code',
  'native_context',
  'scope_info',
  'feedback_cell',
  'feedback_vector',
  'prototype_or_initial_map',
])
const prototypeEdges = new Set(['__proto__', 'prototype', 'constructor'])

export const getStringsWithLocations = (snapshot: Snapshot, scripts: StringLocationScriptMap): readonly StringLocationGroup[] => {
  const { nodes, edges, strings, meta } = snapshot
  const fields = meta.node_fields
  const stride = fields.length
  const typeOffset = fields.indexOf('type')
  const nameOffset = fields.indexOf('name')
  const idOffset = fields.indexOf('id')
  const edgeCountOffset = fields.indexOf('edge_count')
  const edgeFields = meta.edge_fields
  const edgeStride = edgeFields.length
  const edgeTypeOffset = edgeFields.indexOf('type')
  const edgeNameOffset = edgeFields.indexOf('name_or_index')
  const targetOffset = edgeFields.indexOf('to_node')
  if (
    !stride ||
    !edgeStride ||
    [typeOffset, nameOffset, idOffset, edgeCountOffset, edgeTypeOffset, edgeNameOffset, targetOffset].some((offset) => offset < 0)
  )
    return []
  const types = meta.node_types[typeOffset]
  const edgeTypes = meta.edge_types[edgeTypeOffset]
  const nodeCount = nodes.length / stride
  const offsets = new Uint32Array(nodeCount + 1)
  for (let ordinal = 0; ordinal < nodeCount; ordinal++)
    offsets[ordinal + 1] = offsets[ordinal] + nodes[ordinal * stride + edgeCountOffset] * edgeStride
  const nodeType = (ordinal: number) => types[nodes[ordinal * stride + typeOffset]]
  const isStrong = (source: number, edge: number) => {
    const type = edgeTypes[edges[edge + edgeTypeOffset]]
    return type !== 'weak' && (type !== 'shortcut' || source === 0)
  }
  const targetOf = (edge: number) => edges[edge + targetOffset] / stride
  const validTarget = (target: number) => Number.isInteger(target) && target >= 0 && target < nodeCount
  const reachable = new Uint8Array(nodeCount)
  const queue = new Uint32Array(nodeCount)
  let read = 0
  let write = nodeCount ? 1 : 0
  if (nodeCount) reachable[0] = 1
  while (read < write) {
    const source = queue[read++]
    for (let edge = offsets[source]; edge < offsets[source + 1]; edge += edgeStride) {
      const target = targetOf(edge)
      if (!isStrong(source, edge) || !validTarget(target) || reachable[target]) continue
      reachable[target] = 1
      queue[write++] = target
    }
  }

  const locationFields = meta.location_fields
  const locationStride = locationFields.length
  const objectOffset = locationFields.indexOf('object_index')
  const scriptOffset = locationFields.indexOf('script_id')
  const lineOffset = locationFields.indexOf('line')
  const columnOffset = locationFields.indexOf('column')
  const anchors: { ordinal: number; location: string }[] = []
  if (locationStride && [objectOffset, scriptOffset, lineOffset, columnOffset].every((offset) => offset >= 0)) {
    for (let index = 0; index < snapshot.locations.length; index += locationStride) {
      const ordinal = snapshot.locations[index + objectOffset] / stride
      if (!validTarget(ordinal) || !reachable[ordinal] || nodeType(ordinal) === 'code' || nodeType(ordinal) === 'synthetic') continue
      const scriptId = snapshot.locations[index + scriptOffset]
      const source = scripts[String(scriptId)]?.url || String(scriptId)
      const line = snapshot.locations[index + lineOffset] + 1
      const column = snapshot.locations[index + columnOffset] + 1
      if (line > 0x7fffffff || column > 0x7fffffff) continue
      anchors.push({ ordinal, location: `${source}:${line}:${column}` })
    }
  }
  anchors.sort((a, b) => a.location.localeCompare(b.location) || a.ordinal - b.ordinal)
  const owners = new Int32Array(nodeCount).fill(-1)
  read = 0
  write = 0
  for (let index = 0; index < anchors.length; index++) {
    const { ordinal } = anchors[index]
    if (owners[ordinal] !== -1) continue
    owners[ordinal] = index
    queue[write++] = ordinal
  }
  // Multi-source BFS is equivalent to a reverse search from each string, without
  // rescanning the heap for every string. Sorted anchors break equal-distance ties.
  while (read < write) {
    const source = queue[read++]
    for (let edge = offsets[source]; edge < offsets[source + 1]; edge += edgeStride) {
      const target = targetOf(edge)
      if (!isStrong(source, edge) || !validTarget(target) || !reachable[target] || owners[target] !== -1) continue
      const targetType = nodeType(target)
      if (targetType === 'synthetic' || targetType === 'code') continue
      const edgeType = edgeTypes[edges[edge + edgeTypeOffset]]
      const name = strings[edges[edge + edgeNameOffset]]
      if ((edgeType === 'internal' && metadataEdges.has(name)) || (edgeType === 'property' && prototypeEdges.has(name))) continue
      owners[target] = owners[source]
      queue[write++] = target
    }
  }

  const resolveValue = createStringValueResolver(snapshot, 64 * 1024)
  const stringTypes = new Set(['string', 'concatenated string', 'sliced string'])
  const groups = new Map<string, StringLocationGroup>()
  for (let ordinal = 0; ordinal < nodeCount; ordinal++) {
    const type = nodeType(ordinal)
    if (!reachable[ordinal] || !stringTypes.has(type)) continue
    const value = resolveValue(ordinal)
    const sourceLocation = owners[ordinal] < 0 ? null : anchors[owners[ordinal]].location
    const heapObjectId = String(nodes[ordinal * stride + idOffset])
    // Snapshot placeholders do not establish equal text: preserve identity when
    // slices or unreconstructable ropes have no available value.
    const key = JSON.stringify([value, sourceLocation, value === null ? heapObjectId : null])
    const previous = groups.get(key)
    groups.set(key, {
      string: value,
      sourceLocation,
      count: (previous?.count ?? 0) + 1,
      ...(value === null ? { heapObjectId, stringType: type } : {}),
    })
  }
  return [...groups.values()]
}
