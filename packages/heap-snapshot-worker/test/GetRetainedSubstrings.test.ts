import { expect, test } from '@jest/globals'
import { getRetainedSubstrings } from '../src/parts/GetRetainedSubstrings/GetRetainedSubstrings.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

interface TestNode {
  type: string
  name?: string
  size?: number
  edges?: readonly [string, string | number, number][]
}

const fixture = (items: readonly TestNode[]): Snapshot => {
  const strings: string[] = []
  const intern = (value: string): number => {
    let index = strings.indexOf(value)
    if (index < 0) {
      index = strings.length
      strings.push(value)
    }
    return index
  }
  const nodeTypes = ['synthetic', 'object', 'string', 'sliced string', 'concatenated string']
  const edgeTypes = ['property', 'element', 'internal', 'weak', 'shortcut', 'hidden']
  const edges: number[] = []
  const nodes: number[] = []
  for (const [index, item] of items.entries()) {
    nodes.push(nodeTypes.indexOf(item.type), intern(item.name || ''), index * 2 + 1, item.size || 0, item.edges?.length || 0)
    for (const [type, name, target] of item.edges || []) {
      edges.push(edgeTypes.indexOf(type), typeof name === 'string' ? intern(name) : name, target * 5)
    }
  }
  return {
    edge_count: edges.length / 3,
    edges: Uint32Array.from(edges),
    extra_native_bytes: 0,
    locations: new Uint32Array(),
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      node_types: [nodeTypes],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [edgeTypes],
      location_fields: [],
    },
    node_count: items.length,
    nodes: Uint32Array.from(nodes),
    strings,
  }
}

const sharedParent = (): TestNode[] => [
  { type: 'synthetic', edges: [['property', 'cache', 1]] },
  {
    type: 'object',
    name: 'Cache',
    edges: [
      ['element', 0, 2],
      ['element', 1, 3],
    ],
  },
  { type: 'sliced string', name: 'short slice', size: 32, edges: [['internal', 'parent', 4]] },
  { type: 'sliced string', name: 'another slice', size: 32, edges: [['internal', 'parent', 4]] },
  { type: 'string', name: 'large parent', size: 1024 * 1024 },
]

test('counts a shared parent once and reports shortest retaining paths to both slices', () => {
  const report = getRetainedSubstrings(fixture(sharedParent()))
  expect(report).toMatchObject({
    parentBytes: 1048576,
    exclusivelyRetainedBytes: 1048576,
    parentCount: 1,
    sliceCount: 2,
    parentsTruncated: false,
  })
  expect(report.parents[0]).toMatchObject({ parentNodeId: 9, exclusivelyRetained: true, sliceCount: 2, parentBytes: 1048576 })
  expect(report.parents[0].examples.map((example) => example.path.map((segment) => segment.property))).toEqual([
    ['cache', '[0]'],
    ['cache', '[1]'],
  ])
  expect(report.parents[0].examples.every((example) => !example.pathTruncated)).toBe(true)
})

test('separates independently retained parents, even through a longer cyclic path', () => {
  const nodes = sharedParent()
  nodes[1].edges = [...nodes[1].edges!, ['property', 'other', 5]]
  nodes.push({
    type: 'object',
    edges: [
      ['property', 'parent', 4],
      ['property', 'cycle', 1],
    ],
  })
  const report = getRetainedSubstrings(fixture(nodes))
  expect(report.exclusivelyRetainedBytes).toBe(0)
  expect(report.parentBytes).toBe(1048576)
  expect(report.parents[0].exclusivelyRetained).toBe(false)
})

test('ignores weak and non-root shortcut references as independent paths', () => {
  const nodes = sharedParent()
  nodes[1].edges = [...nodes[1].edges!, ['weak', 'weakParent', 4], ['shortcut', 'shortcutParent', 4]]
  expect(getRetainedSubstrings(fixture(nodes)).exclusivelyRetainedBytes).toBe(1048576)
  nodes[0].edges = [...nodes[0].edges!, ['shortcut', 'rootShortcut', 4]]
  expect(getRetainedSubstrings(fixture(nodes)).exclusivelyRetainedBytes).toBe(0)
})

test('ignores unreachable or weak-only slices and parents below 64 KiB', () => {
  const nodes = sharedParent()
  nodes[0].edges = [['weak', 'cache', 1]]
  expect(getRetainedSubstrings(fixture(nodes)).parentCount).toBe(0)
  nodes[0].edges = [['property', 'cache', 1]]
  nodes[4].size = 65535
  expect(getRetainedSubstrings(fixture(nodes)).parentCount).toBe(0)
  nodes[4].size = 65536
  expect(getRetainedSubstrings(fixture(nodes)).parentCount).toBe(1)
})

test('resolves shared slice chains and rejects cycles, missing parents, and ropes', () => {
  const nodes = sharedParent()
  nodes[2].edges = [['internal', 'parent', 3]]
  expect(getRetainedSubstrings(fixture(nodes)).sliceCount).toBe(2)
  nodes[3].edges = [['internal', 'parent', 2]]
  expect(getRetainedSubstrings(fixture(nodes)).parentCount).toBe(0)
  nodes[3].edges = []
  expect(getRetainedSubstrings(fixture(nodes)).parentCount).toBe(0)
  nodes[3].edges = [['internal', 'parent', 4]]
  nodes[4].type = 'concatenated string'
  expect(getRetainedSubstrings(fixture(nodes)).parentCount).toBe(0)
})

test('handles an empty snapshot', () => {
  expect(getRetainedSubstrings(fixture([]))).toMatchObject({ parentCount: 0, exclusivelyRetainedBytes: 0, parents: [] })
})

test('bounds parent details and examples without truncating totals', () => {
  const nodes: TestNode[] = [{ type: 'synthetic', edges: [] }]
  const roots: [string, string, number][] = []
  for (let index = 0; index < 60; index++) {
    const parent = nodes.length
    nodes.push({ type: 'string', size: 65536 + index })
    for (let slice = 0; slice < 10; slice++) {
      roots.push(['property', `slice${index}-${slice}`, nodes.length])
      nodes.push({ type: 'sliced string', name: 'x'.repeat(200), edges: [['internal', 'parent', parent]] })
    }
  }
  nodes[0].edges = roots
  const report = getRetainedSubstrings(fixture(nodes))
  expect(report).toMatchObject({ parentCount: 60, sliceCount: 600, parentsTruncated: true, exclusivelyRetainedBytes: 60 * 65536 + 1770 })
  expect(report.parents).toHaveLength(50)
  expect(report.parents[0].parentBytes).toBe(65595)
  expect(report.parents[0].examples).toHaveLength(8)
  expect(report.parents[0].examples[0].name).toHaveLength(80)
})

test('handles deep slice chains iteratively and flags truncated retaining paths', () => {
  const nodes: TestNode[] = [{ type: 'synthetic', edges: [['property', 'first', 1]] }]
  for (let index = 1; index <= 10000; index++) {
    nodes.push({ type: 'sliced string', edges: [['internal', 'parent', index + 1]] })
  }
  nodes.push({ type: 'string', size: 1048576 })
  const report = getRetainedSubstrings(fixture(nodes))
  expect(report.sliceCount).toBe(10000)
  // The first eight examples have short paths; isolate the deepest slice via a long object chain.
  for (let index = 1; index < 10000; index++) nodes[index].type = 'object'
  nodes[10000].name = 'deep slice'
  const deep = getRetainedSubstrings(fixture(nodes)).parents[0].examples[0]
  expect(deep.pathTruncated).toBe(true)
  expect(deep.path).toHaveLength(32)
})

test('rejects unsupported metadata explicitly', () => {
  const snapshot = fixture([])
  expect(() => getRetainedSubstrings({ ...snapshot, meta: { ...snapshot.meta, node_fields: [] } })).toThrow('missing node field type')
  expect(() => getRetainedSubstrings({ ...snapshot, meta: { ...snapshot.meta, edge_fields: [] } })).toThrow('missing edge field type')
})
