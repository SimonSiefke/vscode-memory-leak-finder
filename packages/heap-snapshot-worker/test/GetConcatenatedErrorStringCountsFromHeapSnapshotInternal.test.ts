import { expect, test } from '@jest/globals'
import {
  getConcatenatedErrorStringCountsFromHeapSnapshotInternal,
  isErrorStackPrefix,
} from '../src/parts/GetConcatenatedErrorStringCountsFromHeapSnapshotInternal/GetConcatenatedErrorStringCountsFromHeapSnapshotInternal.ts'
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

test('recognizes Error-style stack prefixes with actual and escaped newlines', () => {
  expect(isErrorStackPrefix('Error\n    at create (file.js:1:1)')).toBe(true)
  expect(isErrorStackPrefix('TypeError: failed\\n    at run (file.js:2:1)')).toBe(true)
  expect(isErrorStackPrefix('Namespace.CustomError: failed\r\n    at run (file.js:2:1)')).toBe(true)
  expect(isErrorStackPrefix('AggregateError: failed\\r\\n    at run (file.js:2:1)')).toBe(true)
})

test('rejects ordinary messages and values without a first stack frame', () => {
  expect(isErrorStackPrefix('Error handling failed')).toBe(false)
  expect(isErrorStackPrefix('Error: failed')).toBe(false)
  expect(isErrorStackPrefix('Error: failed\\nnot a stack frame')).toBe(false)
  expect(isErrorStackPrefix('NotAnErrorMessage\\n    at run (file.js:2:1)')).toBe(false)
})

test('counts plain, built-in, and custom Error stack ropes', () => {
  const snapshot = createSnapshot([
    { type: 'string', value: 'Error' },
    { type: 'string', value: '\n    at create (file.js:1:1)' },
    { first: 0, second: 1, type: 'concatenated string' },
    { type: 'string', value: 'TypeError: failed' },
    { type: 'string', value: '\\n    at run (file.js:2:1)' },
    { first: 3, second: 4, type: 'concatenated string' },
    { type: 'string', value: 'Namespace.CustomError: failed' },
    { first: 6, second: 1, type: 'concatenated string' },
  ])

  expect(getConcatenatedErrorStringCountsFromHeapSnapshotInternal(snapshot)).toEqual({
    count: 3,
    total: 3,
  })
})

test('reconstructs split Error names and counts each matching nested rope', () => {
  const snapshot = createSnapshot([
    { type: 'string', value: 'My' },
    { type: 'string', value: 'Error' },
    { first: 0, second: 1, type: 'concatenated string' },
    { type: 'string', value: '\\n    at first (file.js:1:1)' },
    { first: 2, second: 3, type: 'concatenated string' },
    { type: 'string', value: '\\n    at second (file.js:2:1)' },
    { first: 4, second: 5, type: 'concatenated string' },
  ])

  expect(getConcatenatedErrorStringCountsFromHeapSnapshotInternal(snapshot)).toEqual({
    count: 2,
    total: 3,
  })
})

test('excludes flat strings, non-stack ropes, and ordinary Error messages', () => {
  const snapshot = createSnapshot([
    { type: 'string', value: 'Error\\n    at flat (file.js:1:1)' },
    { type: 'string', value: 'Error handling failed' },
    { type: 'string', value: ' at somewhere' },
    { first: 1, second: 2, type: 'concatenated string' },
    { type: 'string', value: 'Error: failed' },
    { type: 'string', value: '' },
    { first: 4, second: 5, type: 'concatenated string' },
  ])

  expect(getConcatenatedErrorStringCountsFromHeapSnapshotInternal(snapshot)).toEqual({
    count: 0,
    total: 2,
  })
})

test('handles deeply nested ropes without recursive traversal', () => {
  const depth = 5000
  const errorIndex = depth
  const emptyIndex = depth + 1
  const frameIndex = depth + 2
  const nodes: TestNode[] = []
  for (let index = 0; index < depth; index++) {
    nodes.push({
      first: index === depth - 1 ? errorIndex : index + 1,
      second: index === 0 ? frameIndex : emptyIndex,
      type: 'concatenated string',
    })
  }
  nodes.push({ type: 'string', value: 'Error' }, { type: 'string', value: '' }, { type: 'string', value: '\\n    at deep (file.js:1:1)' })

  expect(getConcatenatedErrorStringCountsFromHeapSnapshotInternal(createSnapshot(nodes))).toEqual({
    count: 1,
    total: depth,
  })
})

test('excludes cyclic and malformed concatenated strings', () => {
  const snapshot = createSnapshot([
    { first: 1, second: 2, type: 'concatenated string' },
    { first: 0, second: 2, type: 'concatenated string' },
    { type: 'string', value: '\\n    at cycle (file.js:1:1)' },
    { second: 2, type: 'concatenated string' },
    { first: 2, type: 'concatenated string' },
    { type: 'object' },
  ])

  expect(getConcatenatedErrorStringCountsFromHeapSnapshotInternal(snapshot)).toEqual({
    count: 0,
    total: 4,
  })
})
