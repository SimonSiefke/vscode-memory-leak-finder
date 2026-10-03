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

const computeReferenceDominators = (outgoing: readonly (readonly { readonly to: number }[])[]): readonly number[] => {
  const nodeCount = outgoing.length
  const predecessors = Array.from({ length: nodeCount }, () => [] as number[])
  for (let source = 0; source < nodeCount; source++) {
    for (const edge of outgoing[source]) {
      predecessors[edge.to].push(source)
    }
  }
  const allNodes = new Set(Array.from({ length: nodeCount }, (_, index) => index))
  const dominatorSets = Array.from({ length: nodeCount }, (_, index) => (index === 0 ? new Set([0]) : new Set(allNodes)))
  let changed = true
  while (changed) {
    changed = false
    for (let node = 1; node < nodeCount; node++) {
      const [first, ...rest] = predecessors[node]
      const next = new Set(dominatorSets[first])
      for (const predecessor of rest) {
        for (const candidate of next) {
          if (!dominatorSets[predecessor].has(candidate)) {
            next.delete(candidate)
          }
        }
      }
      next.add(node)
      if (next.size !== dominatorSets[node].size || [...next].some((candidate) => !dominatorSets[node].has(candidate))) {
        dominatorSets[node] = next
        changed = true
      }
    }
  }
  return dominatorSets.map((dominators, node) => {
    if (node === 0) {
      return 0
    }
    const strictDominators = [...dominators].filter((candidate) => candidate !== node)
    return strictDominators.find((candidate) =>
      strictDominators.every((other) => other === candidate || !dominatorSets[other].has(candidate)),
    )!
  })
}

test('matches a reference implementation across deterministic cyclic graphs', () => {
  let seed = 0x12345678
  const random = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 0x100000000
  }
  for (let iteration = 0; iteration < 100; iteration++) {
    const nodeCount = 10
    const outgoing = Array.from({ length: nodeCount }, () => [] as Array<{ to: number }>)
    for (let node = 1; node < nodeCount; node++) {
      outgoing[node - 1].push({ to: node })
    }
    for (let source = 0; source < nodeCount; source++) {
      for (let target = 0; target < nodeCount; target++) {
        if (source !== target && random() < 0.2) {
          outgoing[source].push({ to: target })
        }
      }
    }
    const snapshot = createSnapshot(new Array(nodeCount).fill(1), outgoing)
    expect([...computeMemoryCityDominators(snapshot).dominators]).toEqual(computeReferenceDominators(outgoing))
  }
})
