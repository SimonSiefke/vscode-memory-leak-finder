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
    cache.set(nodeIndex, secondValue === undefined || secondValue === null ? null : `${firstValue}${secondValue}`)
    visiting.delete(nodeIndex)
  }

  return cache.get(rootNodeIndex) ?? null
}

export const getConcatenatedStringsFromHeapSnapshotInternal = (snapshot: Snapshot): readonly string[] => {
  const { meta, nodes, strings } = snapshot
  const { edge_fields, edge_types, node_fields, node_types } = meta
  const {
    ITEMS_PER_EDGE,
    ITEMS_PER_NODE,
    edgeCountFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    edgeTypeFieldIndex,
    nameFieldIndex,
    nodeTypes,
    typeFieldIndex,
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)
  const concatenatedStringTypeIndex = nodeTypes.indexOf('concatenated string')
  const stringTypeIndex = nodeTypes.indexOf('string')
  if (
    concatenatedStringTypeIndex < 0 ||
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
    return []
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
    edge_types[0],
  )
  const cache = new Map<number, string | null>()
  const concatenatedStrings: string[] = []
  for (let nodeIndex = 0, nodeOffset = 0; nodeOffset < nodes.length; nodeIndex++, nodeOffset += ITEMS_PER_NODE) {
    if (nodes[nodeOffset + typeFieldIndex] !== concatenatedStringTypeIndex) {
      continue
    }
    const value = resolveString(
      nodeIndex,
      snapshot,
      stringTypeIndex,
      concatenatedStringTypeIndex,
      ITEMS_PER_NODE,
      typeFieldIndex,
      nameFieldIndex,
      children,
      cache,
    )
    if (value !== null) {
      concatenatedStrings.push(value)
      continue
    }
    const fallbackValue = strings[nodes[nodeOffset + nameFieldIndex]]
    if (typeof fallbackValue === 'string') {
      concatenatedStrings.push(fallbackValue)
    }
  }
  return concatenatedStrings
}
