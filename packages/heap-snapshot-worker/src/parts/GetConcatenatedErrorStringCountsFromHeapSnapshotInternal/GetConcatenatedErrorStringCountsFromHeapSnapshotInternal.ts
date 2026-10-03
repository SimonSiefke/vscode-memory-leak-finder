import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface ConcatenatedErrorStringCounts {
  readonly count: number
  readonly total: number
}

interface PrefixFrame {
  readonly nodeIndex: number
  readonly stage: 0 | 1 | 2
}

interface StringChildren {
  readonly first: Int32Array
  readonly second: Int32Array
}

const MaxPrefixLength = 512

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
        const edgeType = edgeTypes[edges[edgeIndex + edgeTypeFieldIndex]]
        if (edgeType !== 'internal') {
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

const getPrefix = (
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
  const stack: PrefixFrame[] = [
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
        cache.set(nodeIndex, typeof value === 'string' ? value.slice(0, MaxPrefixLength) : null)
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

    const firstPrefix = cache.get(children.first[nodeIndex])
    if (firstPrefix === undefined || firstPrefix === null) {
      cache.set(nodeIndex, null)
      visiting.delete(nodeIndex)
      continue
    }

    if (stage === 1) {
      if (firstPrefix.length >= MaxPrefixLength) {
        cache.set(nodeIndex, firstPrefix)
        visiting.delete(nodeIndex)
        continue
      }
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

    const secondPrefix = cache.get(children.second[nodeIndex])
    if (secondPrefix === undefined || secondPrefix === null) {
      cache.set(nodeIndex, null)
    } else {
      cache.set(nodeIndex, `${firstPrefix}${secondPrefix}`.slice(0, MaxPrefixLength))
    }
    visiting.delete(nodeIndex)
  }

  return cache.get(rootNodeIndex) ?? null
}

const getLineSeparator = (value: string): { readonly index: number; readonly length: number } | undefined => {
  const separators = ['\r\n', '\n', '\\r\\n', '\\n']
  let result: { readonly index: number; readonly length: number } | undefined
  for (const separator of separators) {
    const index = value.indexOf(separator)
    if (index < 0 || (result && result.index <= index)) {
      continue
    }
    result = {
      index,
      length: separator.length,
    }
  }
  return result
}

const errorNamePattern = /^(?:Error|(?:[A-Za-z_$][A-Za-z0-9_$]*\.)*[A-Za-z_$][A-Za-z0-9_$]*Error)(?::[^\r\n]*)?$/
const stackFramePattern = /^\s+at\b/

export const isErrorStackPrefix = (value: string): boolean => {
  const separator = getLineSeparator(value)
  if (!separator) {
    return false
  }
  const firstLine = value.slice(0, separator.index)
  const secondLine = value.slice(separator.index + separator.length)
  return errorNamePattern.test(firstLine) && stackFramePattern.test(secondLine)
}

export const getConcatenatedErrorStringCountsFromHeapSnapshotInternal = (snapshot: Snapshot): ConcatenatedErrorStringCounts => {
  const { meta, nodes } = snapshot
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
    return {
      count: 0,
      total: 0,
    }
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
  const prefixCache = new Map<number, string | null>()
  let count = 0
  let total = 0

  for (let nodeIndex = 0, nodeOffset = 0; nodeOffset < nodes.length; nodeIndex++, nodeOffset += ITEMS_PER_NODE) {
    if (nodes[nodeOffset + typeFieldIndex] !== concatenatedStringTypeIndex) {
      continue
    }
    total++
    const prefix = getPrefix(
      nodeIndex,
      snapshot,
      stringTypeIndex,
      concatenatedStringTypeIndex,
      ITEMS_PER_NODE,
      typeFieldIndex,
      nameFieldIndex,
      children,
      prefixCache,
    )
    if (prefix !== null && isErrorStackPrefix(prefix)) {
      count++
    }
  }

  return {
    count,
    total,
  }
}
