import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { createStringValueResolver } from '../GetConcatenatedStringsFromHeapSnapshotInternal/GetConcatenatedStringsFromHeapSnapshotInternal.ts'

export interface StringLocationGroup {
  readonly string: string | null
  readonly sourceLocation: string | null
  readonly count: number
  readonly stackCounts?: readonly { readonly stack: string; readonly count: number }[]
  readonly locationKind?: 'stack-frame'
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
const stringTypes = new Set(['string', 'concatenated string', 'sliced string'])
const stringEdges = new Set(['first', 'second', 'parent'])

const getStackFrameLocation = (value: string | null): string | undefined => {
  // Only complete error stacks establish a frame. A detached stack fragment or
  // arbitrary text containing a URL does not establish an allocation location.
  if (!value || !/^(?:\[[^\]\r\n]{1,80}\]\s*)?[A-Za-z]*Error(?::|\r?\n|\\n|$)/.test(value)) return undefined
  return /(?:\r?\n|\\n)\s*at (?:[^\r\n]*? \()?((?:[a-zA-Z][a-zA-Z\d+.-]*:(?:\/\/)?|\/)[^()\r\n]*?:\d+:\d+)\)?(?=\r?\n|\\n|$)/.exec(
    value,
  )?.[1]
}

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
  const assignOwners = (stackFramesOnly: boolean) => {
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
        if (stackFramesOnly && (edgeType !== 'internal' || !stringEdges.has(name) || !stringTypes.has(targetType))) continue
        owners[target] = owners[source]
        queue[write++] = target
      }
    }
  }
  assignOwners(false)

  const resolveValue = createStringValueResolver(snapshot, 64 * 1024)
  const retainingAnchorCount = anchors.length
  const stackAnchors: typeof anchors = []
  for (let ordinal = 0; ordinal < nodeCount; ordinal++) {
    if (!reachable[ordinal] || owners[ordinal] !== -1 || !stringTypes.has(nodeType(ordinal))) continue
    const location = getStackFrameLocation(resolveValue(ordinal))
    if (location) stackAnchors.push({ ordinal, location })
  }
  stackAnchors.sort((a, b) => a.location.localeCompare(b.location) || a.ordinal - b.ordinal)
  read = 0
  write = 0
  for (const anchor of stackAnchors) {
    owners[anchor.ordinal] = anchors.length
    anchors.push(anchor)
    queue[write++] = anchor.ordinal
  }
  // Console/native roots have no JS location. Attribute only the stack's own
  // rope/slice components to its first frame, explicitly separate from retainers.
  assignOwners(true)

  // Record complete stack ownership independently from retaining locations.
  // Only graph roots seed this pass: nested prefixes belong to the outer stack.
  const hasStringParent = new Uint8Array(nodeCount)
  const isComponentEdge = (edge: number) => {
    const target = targetOf(edge)
    return (
      validTarget(target) &&
      stringTypes.has(nodeType(target)) &&
      edgeTypes[edges[edge + edgeTypeOffset]] === 'internal' &&
      stringEdges.has(strings[edges[edge + edgeNameOffset]])
    )
  }
  for (let source = 0; source < nodeCount; source++) {
    if (!reachable[source] || !stringTypes.has(nodeType(source))) continue
    for (let edge = offsets[source]; edge < offsets[source + 1]; edge += edgeStride) {
      if (isComponentEdge(edge)) hasStringParent[targetOf(edge)] = 1
    }
  }
  const stackOwners = new Int32Array(nodeCount).fill(-1)
  const stackValues: string[] = []
  const stackIds = new Map<string, number>()
  const stackQueue: number[] = []
  for (let ordinal = 0; ordinal < nodeCount; ordinal++) {
    if (!reachable[ordinal] || hasStringParent[ordinal] || !stringTypes.has(nodeType(ordinal))) continue
    const value = resolveValue(ordinal)
    if (!value || !getStackFrameLocation(value)) continue
    const stack = value
    let id = stackIds.get(stack)
    if (id === undefined) {
      id = stackValues.length
      stackIds.set(stack, id)
      stackValues.push(stack)
    }
    stackOwners[ordinal] = id
    stackQueue.push(ordinal)
  }
  for (let index = 0; index < stackQueue.length; index++) {
    const source = stackQueue[index]
    const owner = stackOwners[source]
    for (let edge = offsets[source]; edge < offsets[source + 1]; edge += edgeStride) {
      if (!isComponentEdge(edge)) continue
      const target = targetOf(edge)
      const previous = stackOwners[target]
      if (previous === -2 || previous === owner) continue
      // A shared component belongs to neither stack exclusively. Propagate that
      // ambiguity to descendants too; each node changes state at most twice.
      stackOwners[target] = previous === -1 ? owner : -2
      stackQueue.push(target)
    }
  }

  const groups = new Map<string, StringLocationGroup>()
  const groupStackCounts = new Map<string, Map<number, number>>()
  for (let ordinal = 0; ordinal < nodeCount; ordinal++) {
    const type = nodeType(ordinal)
    if (!reachable[ordinal] || !stringTypes.has(type)) continue
    const value = resolveValue(ordinal)
    const sourceLocation = owners[ordinal] < 0 ? null : anchors[owners[ordinal]].location
    const locationKind = owners[ordinal] >= retainingAnchorCount ? 'stack-frame' : undefined
    const heapObjectId = String(nodes[ordinal * stride + idOffset])
    // Snapshot placeholders do not establish equal text: preserve identity when
    // slices or unreconstructable ropes have no available value.
    const key = JSON.stringify([value, sourceLocation, value === null ? heapObjectId : null, locationKind ?? null])
    const stackOwner = stackOwners[ordinal]
    if (stackOwner >= 0) {
      let counts = groupStackCounts.get(key)
      if (!counts) {
        counts = new Map()
        groupStackCounts.set(key, counts)
      }
      counts.set(stackOwner, (counts.get(stackOwner) ?? 0) + 1)
    }
    const previous = groups.get(key)
    groups.set(key, {
      string: value,
      sourceLocation,
      ...(locationKind ? { locationKind } : {}),
      count: (previous?.count ?? 0) + 1,
      ...(value === null ? { heapObjectId, stringType: type } : {}),
    })
  }
  return [...groups].map(([key, group]) => {
    const counts = groupStackCounts.get(key)
    if (!counts) return group
    const stackCounts = [...counts].map(([id, count]) => ({ stack: stackValues[id], count })).sort((a, b) => a.stack.localeCompare(b.stack))
    return { ...group, stackCounts }
  })
}
