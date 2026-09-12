import { expect, test } from '@jest/globals'
import { getConcatenatedStringsFromHeapSnapshotInternal } from '../src/parts/GetConcatenatedStringsFromHeapSnapshotInternal/GetConcatenatedStringsFromHeapSnapshotInternal.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

interface TestNode {
  readonly first?: number
  readonly second?: number
  readonly type: 'concatenated string' | 'object' | 'string'
  readonly value?: string
}

const createSnapshot = (testNodes: readonly TestNode[]): Snapshot => {
  const nodeTypes = ['hidden', 'string', 'object', 'concatenated string']
  const strings: string[] = []
  const stringIndices = new Map<string, number>()
  const getStringIndex = (value: string): number => {
    const existing = stringIndices.get(value)
    if (existing !== undefined) {
      return existing
    }
    const index = strings.length
    strings.push(value)
    stringIndices.set(value, index)
    return index
  }

  const nodes: number[] = []
  const edges: number[] = []
  for (let index = 0; index < testNodes.length; index++) {
    const node = testNodes[index]
    const nodeEdges = [
      ...(node.first === undefined ? [] : [{ name: 'first', target: node.first }]),
      ...(node.second === undefined ? [] : [{ name: 'second', target: node.second }]),
    ]
    const name = node.type === 'concatenated string' ? '(concatenated string)' : (node.value ?? node.type)
    nodes.push(nodeTypes.indexOf(node.type), getStringIndex(name), index * 2 + 1, 0, nodeEdges.length, 0, 0)
    for (const edge of nodeEdges) {
      edges.push(3, getStringIndex(edge.name), edge.target * 7)
    }
  }

  return {
    edge_count: edges.length / 3,
    edges: new Uint32Array(edges),
    extra_native_bytes: 0,
    locations: new Uint32Array(),
    meta: {
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal']],
      location_fields: [],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [nodeTypes],
    },
    node_count: testNodes.length,
    nodes: new Uint32Array(nodes),
    strings,
  }
}

test('reconstructs every concatenated string, including nested and repeated values', () => {
  const snapshot = createSnapshot([
    { type: 'string', value: 'hello' },
    { type: 'string', value: ' ' },
    { type: 'string', value: 'world' },
    { first: 0, second: 1, type: 'concatenated string' },
    { first: 3, second: 2, type: 'concatenated string' },
    { first: 0, second: 1, type: 'concatenated string' },
  ])

  expect(getConcatenatedStringsFromHeapSnapshotInternal(snapshot)).toEqual(['hello ', 'hello world', 'hello '])
})

test('uses the heap snapshot name when a concatenated string cannot be reconstructed', () => {
  const snapshot = createSnapshot([
    { first: 1, second: 2, type: 'concatenated string' },
    { first: 0, second: 2, type: 'concatenated string' },
    { type: 'string', value: 'value' },
    { first: 2, type: 'concatenated string' },
    { second: 2, type: 'concatenated string' },
    { first: 2, second: 5, type: 'concatenated string' },
    { type: 'object' },
  ])

  expect(getConcatenatedStringsFromHeapSnapshotInternal(snapshot)).toEqual([
    '(concatenated string)',
    '(concatenated string)',
    '(concatenated string)',
    '(concatenated string)',
    '(concatenated string)',
  ])
})

test('handles deeply nested concatenated strings without recursion', () => {
  const depth = 5000
  const valueIndex = depth
  const emptyIndex = depth + 1
  const nodes: TestNode[] = []
  for (let index = 0; index < depth; index++) {
    nodes.push({
      first: index === depth - 1 ? valueIndex : index + 1,
      second: emptyIndex,
      type: 'concatenated string',
    })
  }
  nodes.push({ type: 'string', value: 'value' }, { type: 'string', value: '' })

  const result = getConcatenatedStringsFromHeapSnapshotInternal(createSnapshot(nodes))
  expect(result).toHaveLength(depth)
  expect(result.every((value) => value === 'value')).toBe(true)
})
