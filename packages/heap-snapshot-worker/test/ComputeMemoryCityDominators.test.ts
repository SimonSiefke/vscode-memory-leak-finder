import { expect, test } from '@jest/globals'
import { computeMemoryCityDominators } from '../src/parts/ComputeMemoryCityDominators/ComputeMemoryCityDominators.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

const EdgeType = {
  property: 0,
  shortcut: 1,
  weak: 2,
} as const

const createSnapshot = (
  sizes: readonly number[],
  outgoing: readonly (readonly { readonly to: number; readonly type?: number }[])[],
): Snapshot => {
  const nodeFieldCount = 5
  const nodes: number[] = []
  const edges: number[] = []
  for (let ordinal = 0; ordinal < sizes.length; ordinal++) {
    const nodeEdges = outgoing[ordinal] || []
    nodes.push(0, 0, ordinal * 2 + 1, sizes[ordinal], nodeEdges.length)
    for (const edge of nodeEdges) {
      edges.push(edge.type ?? EdgeType.property, 0, edge.to * nodeFieldCount)
    }
  }
  return {
    edge_count: edges.length / 3,
    edges: Uint32Array.from(edges),
    extra_native_bytes: 0,
    locations: new Uint32Array(),
    meta: {
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['property', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      node_types: [['hidden']],
    },
    node_count: sizes.length,
    nodes: Uint32Array.from(nodes),
    strings: [''],
  }
}

test('computes dominators and retained sizes for a chain above 4 GiB', () => {
  const snapshot = createSnapshot([0, 3_000_000_000, 3_000_000_000], [[{ to: 1 }], [{ to: 2 }], []])
  const result = computeMemoryCityDominators(snapshot)
  expect([...result.dominators]).toEqual([0, 0, 1])
  expect(result.retainedSizes[0]).toBe(6_000_000_000)
  expect(result.retainedSizes[1]).toBe(6_000_000_000)
  expect(result.retainedSizes[2]).toBe(3_000_000_000)
})

test('a diamond is dominated by the common root', () => {
  const snapshot = createSnapshot([0, 10, 20, 30], [[{ to: 1 }, { to: 2 }], [{ to: 3 }], [{ to: 3 }], []])
  const result = computeMemoryCityDominators(snapshot)
  expect(result.dominators[3]).toBe(0)
  expect(result.retainedSizes[1]).toBe(10)
  expect(result.retainedSizes[2]).toBe(20)
  expect(result.retainedSizes[0]).toBe(60)
})

test('handles cycles, ignored weak edges, non-root shortcuts, and orphans', () => {
  const snapshot = createSnapshot(
    [0, 10, 20, 30, 40],
    [
      [
        { to: 1, type: EdgeType.shortcut },
        { to: 3, type: EdgeType.weak },
      ],
      [{ to: 2 }, { to: 4, type: EdgeType.shortcut }],
      [{ to: 1 }],
      [],
      [],
    ],
  )
  const result = computeMemoryCityDominators(snapshot)
  expect(result.dominators[1]).toBe(0)
  expect(result.dominators[2]).toBe(1)
  expect(result.dominators[3]).toBe(0)
  expect(result.dominators[4]).toBe(0)
  expect(result.retainedSizes[0]).toBe(100)
})
