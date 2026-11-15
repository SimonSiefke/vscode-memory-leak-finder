import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

interface ResolveFrame {
  readonly nodeIndex: number
  readonly stage: 0 | 1 | 2
}

interface StringChildren {
  readonly first: Int32Array
  readonly second: Int32Array
}

const getStringChildren = (
  snapshot: Snapshot,
  concatenatedStringTypeIndex: number,
  itemsPerNode: number,
  itemsPerEdge: number,
  typeFieldIndex: number,
  edgeCountFieldIndex: number,
  edgeTypeFieldIndex: number,
  edgeNameFieldIndex: number,
  edgeToNodeFieldIndex: number,
  edgeTypes: readonly string[],
): StringChildren => {
  const { edges, nodes, strings } = snapshot
  const nodeCount = Math.floor(nodes.length / itemsPerNode)
  const first = new Int32Array(nodeCount)
  const second = new Int32Array(nodeCount)
  first.fill(-1)
  second.fill(-1)

  let edgeOffset = 0
  for (let nodeIndex = 0, nodeOffset = 0; nodeOffset < nodes.length; nodeIndex++, nodeOffset += itemsPerNode) {
    const edgeCount = nodes[nodeOffset + edgeCountFieldIndex]
    if (nodes[nodeOffset + typeFieldIndex] === concatenatedStringTypeIndex) {
      for (let localEdgeIndex = 0; localEdgeIndex < edgeCount; localEdgeIndex++) {
        const edgeIndex = (edgeOffset + localEdgeIndex) * itemsPerEdge
        if (edgeTypes[edges[edgeIndex + edgeTypeFieldIndex]] !== 'internal') {
          continue
        }
        const edgeName = strings[edges[edgeIndex + edgeNameFieldIndex]]
        const targetNodeIndex = Math.floor(edges[edgeIndex + edgeToNodeFieldIndex] / itemsPerNode)
        if (targetNodeIndex < 0 || targetNodeIndex >= nodeCount) {
          continue
        }
        if (edgeName === 'first') {
          first[nodeIndex] = targetNodeIndex
        } else if (edgeName === 'second') {
          second[nodeIndex] = targetNodeIndex
        }
      }
    }
    edgeOffset += edgeCount
  }

  return {
    first,
    second,
  }
}

const resolveString = (
  rootNodeIndex: number,
  snapshot: Snapshot,
  stringTypeIndex: number,
  concatenatedStringTypeIndex: number,
  itemsPerNode: number,
  typeFieldIndex: number,
  nameFieldIndex: number,
  children: StringChildren,
  cache: Map<number, string | null>,
  maximumLength = Number.POSITIVE_INFINITY,
): string | null => {
  const { nodes, strings } = snapshot
  const visiting = new Set<number>()
  const stack: ResolveFrame[] = [
    {
      nodeIndex: rootNodeIndex,
      stage: 0,
    },
  ]

  while (stack.length > 0) {
    const frame = stack.pop()!
    const { nodeIndex, stage } = frame

    if (stage === 0) {
      if (cache.has(nodeIndex)) {
        continue
      }
      if (visiting.has(nodeIndex)) {
        cache.set(nodeIndex, null)
        continue
      }

      const nodeOffset = nodeIndex * itemsPerNode
      if (nodeOffset < 0 || nodeOffset >= nodes.length) {
        cache.set(nodeIndex, null)
        continue
      }

      const nodeType = nodes[nodeOffset + typeFieldIndex]
      if (nodeType === stringTypeIndex) {
        const value = strings[nodes[nodeOffset + nameFieldIndex]]
        cache.set(nodeIndex, typeof value === 'string' ? value : null)
        continue
      }
      if (nodeType !== concatenatedStringTypeIndex || children.first[nodeIndex] < 0 || children.second[nodeIndex] < 0) {
        cache.set(nodeIndex, null)
        continue
      }

      visiting.add(nodeIndex)
      stack.push({
        nodeIndex,
        stage: 1,
      })
      stack.push({
        nodeIndex: children.first[nodeIndex],
        stage: 0,
      })
      continue
    }

    if (cache.has(nodeIndex)) {
      visiting.delete(nodeIndex)
      continue
    }

    const firstValue = cache.get(children.first[nodeIndex])
    if (firstValue === undefined || firstValue === null) {
      cache.set(nodeIndex, null)
      visiting.delete(nodeIndex)
      continue
    }

    if (stage === 1) {
      stack.push({
        nodeIndex,
        stage: 2,
      })
      stack.push({
        nodeIndex: children.second[nodeIndex],
        stage: 0,
      })
      continue
    }

    const secondValue = cache.get(children.second[nodeIndex])
    cache.set(
      nodeIndex,
      secondValue === undefined || secondValue === null || firstValue.length + secondValue.length > maximumLength
        ? null
        : `${firstValue}${secondValue}`,
    )
    visiting.delete(nodeIndex)
  }

  return cache.get(rootNodeIndex) ?? null
}

export const createStringValueResolver = (
  snapshot: Snapshot,
  maximumLength = Number.POSITIVE_INFINITY,
): ((nodeIndex: number) => string | null) => {
  const { meta } = snapshot
  const { edge_fields, edge_types, node_fields, node_types } = meta
  const {
    ITEMS_PER_EDGE,
    ITEMS_PER_NODE,
    edgeCountFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    edgeTypeFieldIndex,
    nameFieldIndex,
    typeFieldIndex,
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)
  const types = node_types[typeFieldIndex] ?? []
  const concatenatedStringTypeIndex = types.indexOf('concatenated string')
  const stringTypeIndex = types.indexOf('string')
  if (
    stringTypeIndex < 0 ||
    ITEMS_PER_NODE <= 0 ||
    ITEMS_PER_EDGE <= 0 ||
    typeFieldIndex < 0 ||
    nameFieldIndex < 0 ||
    edgeCountFieldIndex < 0 ||
    edgeTypeFieldIndex < 0 ||
    edgeNameFieldIndex < 0 ||
    edgeToNodeFieldIndex < 0
  ) {
    return () => null
  }

  const children = getStringChildren(
    snapshot,
    concatenatedStringTypeIndex,
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    typeFieldIndex,
    edgeCountFieldIndex,
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    edge_types[edgeTypeFieldIndex],
  )
  const cache = new Map<number, string | null>()
  return (nodeIndex) =>
    resolveString(
      nodeIndex,
      snapshot,
      stringTypeIndex,
      concatenatedStringTypeIndex,
      ITEMS_PER_NODE,
      typeFieldIndex,
      nameFieldIndex,
      children,
      cache,
      maximumLength,
    )
}

export const getConcatenatedStringsFromHeapSnapshotInternal = (snapshot: Snapshot): readonly string[] => {
  const fields = snapshot.meta.node_fields
  const typeOffset = fields.indexOf('type')
  const nameOffset = fields.indexOf('name')
  const types = snapshot.meta.node_types[typeOffset]
  const concatenatedType = types?.indexOf('concatenated string') ?? -1
  if (fields.length === 0 || typeOffset < 0 || concatenatedType < 0) return []
  const resolveValue = createStringValueResolver(snapshot)
  const values: string[] = []
  for (let offset = 0; offset < snapshot.nodes.length; offset += fields.length) {
    if (snapshot.nodes[offset + typeOffset] !== concatenatedType) continue
    const value = resolveValue(offset / fields.length) ?? snapshot.strings[snapshot.nodes[offset + nameOffset]]
    if (typeof value === 'string') values.push(value)
  }
  return values
}
