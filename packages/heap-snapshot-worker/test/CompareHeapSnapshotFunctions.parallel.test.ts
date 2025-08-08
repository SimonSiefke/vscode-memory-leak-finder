import { test, expect } from '@jest/globals'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'
import { compareHeapSnapshotFunctions } from '../src/parts/CompareHeapSnapshotsFunctions/CompareHeapSnapshotsFunctions.js'

const createTestSnapshot = (path, size = 'small') => {
  const smallSnapshot = {
    snapshot: {
      meta: {
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [
          [
            'hidden',
            'array',
            'string',
            'object',
            'code',
            'closure',
            'regexp',
            'number',
            'native',
            'synthetic',
            'concatenated string',
            'sliced string',
            'symbol',
            'bigint',
            'object shape',
          ],
          [],
          ['', 'GCRetainer', 'HTMLDocument', 'HTMLBodyElement'],
        ],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak'], [], []],
        trace_function_info_fields: [],
        trace_node_fields: [],
        sample_fields: [],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 2,
      edge_count: 1,
      trace_function_count: 0,
    },
    nodes: [1, 0, 1, 8, 1, 0, 0, 3, 1, 2, 16, 0, 0, 0],
    edges: [2, 0, 7],
    trace_function_infos: [],
    trace_tree: [],
    samples: [],
    locations: [0, 0, 1, 1],
  }

  writeFileSync(path, JSON.stringify(smallSnapshot))
}

test('compareHeapSnapshotFunctions - should work with parallel processing enabled', async () => {
  const tmpDir = tmpdir()
  const snapshot1 = join(tmpDir, 'test-snapshot-parallel-1.json')
  const snapshot2 = join(tmpDir, 'test-snapshot-parallel-2.json')

  createTestSnapshot(snapshot1)
  createTestSnapshot(snapshot2)

  const result = await compareHeapSnapshotFunctions(snapshot1, snapshot2, true)
  expect(Array.isArray(result)).toBe(true)
})

test('compareHeapSnapshotFunctions - should work with parallel processing disabled', async () => {
  const tmpDir = tmpdir()
  const snapshot1 = join(tmpDir, 'test-snapshot-sequential-1.json')
  const snapshot2 = join(tmpDir, 'test-snapshot-sequential-2.json')

  createTestSnapshot(snapshot1)
  createTestSnapshot(snapshot2)

  const result = await compareHeapSnapshotFunctions(snapshot1, snapshot2, false)
  expect(Array.isArray(result)).toBe(true)
})
