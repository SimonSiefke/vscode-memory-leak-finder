import { test, expect } from '@jest/globals'
import { writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { compareNamedClosureCountFromHeapSnapshot } from '../src/parts/CompareNamedClosureCount/CompareNamedClosureCount.ts'

const createTestFile = async (fileName: string, content: any): Promise<string> => {
  const tempDir = tmpdir()
  const filePath = join(tempDir, fileName)
  await writeFile(filePath, JSON.stringify(content))
  return filePath
}

const cleanupTestFile = async (filePath: string): Promise<void> => {
  try {
    await unlink(filePath)
  } catch {
    // Ignore cleanup errors
  }
}

test.skip('should return empty array when no closures leaked', async () => {
  const snapshotBefore = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 4,
      edge_count: 4,
    },
    // Closure 1 -> Context 1 (2 edges) -> Closure 1 has contextNodeCount = 2
    // to_node is byte offset: node index * ITEMS_PER_NODE
    // Edges must be ordered by source node: all edges from node 0, then node 1, etc.
    nodes: [
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0) - type=closure(5), id=0, edge_count=1
      3,
      0,
      1,
      30,
      2,
      0,
      0, // Context 1 (node 1) - type=object(3), id=1, edge_count=2
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 2) - type=closure(5), id=2, edge_count=1
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3) - type=object(3), id=3, edge_count=1
    ],
    edges: [
      // Node 0 (Closure 1) edges:
      0,
      3,
      7, // Closure 1 -> Context 1 via context edge (to node 1 = byte offset 7)
      // Node 1 (Context 1) edges:
      2,
      1,
      14, // Context 1 -> property edge (to node 2 = byte offset 14)
      2,
      2,
      21, // Context 1 -> property edge (to node 3 = byte offset 21)
      // Node 2 (Closure 2) edges:
      0,
      3,
      21, // Closure 2 -> Context 2 via context edge (to node 3 = byte offset 21)
      // Node 3 (Context 2) edges: (none, edge_count=1 but that's the incoming edge)
    ],
    strings: ['', 'prop1', 'prop2', 'context'],
    locations: [],
  }

  const snapshotAfter = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 4,
      edge_count: 4,
    },
    // Same structure - no leaks
    nodes: [
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0)
      3,
      0,
      1,
      30,
      2,
      0,
      0, // Context 1 (node 1)
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 2)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3)
    ],
    edges: [
      // Node 0 (Closure 1) edges:
      0,
      3,
      7, // Closure 1 -> Context 1
      // Node 1 (Context 1) edges:
      2,
      1,
      14, // Context 1 -> property
      2,
      2,
      21, // Context 1 -> property
      // Node 2 (Closure 2) edges:
      0,
      3,
      21, // Closure 2 -> Context 2
      // Node 3 (Context 2) edges: (none)
    ],
    strings: ['', 'prop1', 'prop2', 'context'],
    locations: [],
  }

  const pathBefore = await createTestFile('before-snapshot.json', snapshotBefore)
  const pathAfter = await createTestFile('after-snapshot.json', snapshotAfter)

  try {
    const result = await compareNamedClosureCountFromHeapSnapshot(pathBefore, pathAfter)
    expect(result).toEqual([])
  } finally {
    await cleanupTestFile(pathBefore)
    await cleanupTestFile(pathAfter)
  }
})

test.skip('should return leaked closures where contextNodeCount increased', async () => {
  const snapshotBefore = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 4,
      edge_count: 5,
    },
    // Closure 1 -> Context 1 (1 important edge) -> contextNodeCount = 1
    nodes: [
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0) - edge_count=1
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1) - edge_count=1
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 2) - edge_count=1
      3,
      0,
      3,
      30,
      2,
      0,
      0, // Context 2 (node 3) - edge_count=2
    ],
    edges: [
      // Node 0 (Closure 1) edges:
      0,
      3,
      7, // Closure 1 -> Context 1
      // Node 1 (Context 1) edges:
      2,
      1,
      0, // Context 1 -> property edge (prop1, to node 0)
      // Node 2 (Closure 2) edges:
      0,
      3,
      21, // Closure 2 -> Context 2
      // Node 3 (Context 2) edges:
      2,
      1,
      14, // Context 2 -> property edge (prop1, to node 2)
      2,
      2,
      0, // Context 2 -> property edge (prop2, to node 0)
    ],
    strings: ['', 'prop1', 'prop2', 'context'],
    locations: [],
  }

  const snapshotAfter = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 4,
      edge_count: 6,
    },
    // Closure 1 -> Context 1 (now has 2 important edges) -> contextNodeCount = 2 (LEAKED!)
    // Closure 2 -> Context 2 (still 2 edges) -> contextNodeCount = 2 (no leak)
    nodes: [
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0) - edge_count=1
      3,
      0,
      1,
      30,
      2,
      0,
      0, // Context 1 (node 1) - now edge_count=2 (NEW edge added)
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 2) - edge_count=1
      3,
      0,
      3,
      30,
      2,
      0,
      0, // Context 2 (node 3) - still edge_count=2
    ],
    edges: [
      // Node 0 (Closure 1) edges:
      0,
      3,
      7, // Closure 1 -> Context 1
      // Node 1 (Context 1) edges:
      2,
      1,
      0, // Context 1 -> property edge (prop1, to node 0)
      2,
      2,
      14, // Context 1 -> property edge (prop2, to node 2) - NEW!
      // Node 2 (Closure 2) edges:
      0,
      3,
      21, // Closure 2 -> Context 2
      // Node 3 (Context 2) edges:
      2,
      1,
      14, // Context 2 -> property edge (prop1, to node 2)
      2,
      2,
      0, // Context 2 -> property edge (prop2, to node 0)
    ],
    strings: ['', 'prop1', 'prop2', 'context'],
    locations: [],
  }

  const pathBefore = await createTestFile('before-leak.json', snapshotBefore)
  const pathAfter = await createTestFile('after-leak.json', snapshotAfter)

  try {
    const result = await compareNamedClosureCountFromHeapSnapshot(pathBefore, pathAfter)
    expect(result.length).toBeGreaterThan(0)
    // Should have at least one leaked closure
    const leakedClosure = result.find((item) => item.name && item.contextNodeCount > 1)
    expect(leakedClosure).toBeDefined()
    expect(leakedClosure?.contextNodeCount).toBeGreaterThan(1)
  } finally {
    await cleanupTestFile(pathBefore)
    await cleanupTestFile(pathAfter)
  }
})
