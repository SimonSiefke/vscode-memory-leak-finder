import { test, expect } from '@jest/globals'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

test('prepareHeapSnapshot - integration test with parsing worker', async () => {
  // Create a minimal heap snapshot file
  const heapSnapshotData = {
    snapshot: {
      meta: {
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 2,
      edge_count: 1,
    },
    nodes: [0, 0, 1, 24, 1, 0, 0, 3, 1, 2, 32, 0, 0, 0], // 2 nodes with 7 fields each
    edges: [2, 1, 7], // 1 edge with 3 fields
    locations: [0, 1, 42, 5], // 1 location with 4 fields
    strings: ['', 'root', 'test'],
  }

  // Write to a temporary file
  const tmpFile = join(tmpdir(), `test-heap-snapshot-integration-${Date.now()}.json`)
  writeFileSync(tmpFile, JSON.stringify(heapSnapshotData))

  try {
    // Test using the parsing worker
    const result = await prepareHeapSnapshot(tmpFile)

    // Verify the structure
    expect(result).toHaveProperty('metaData')
    expect(result).toHaveProperty('nodes')
    expect(result).toHaveProperty('edges')
    expect(result).toHaveProperty('locations')

    // Verify types (zero-copy transfer should preserve typed arrays)
    expect(result.nodes.constructor.name).toBe('Uint32Array')
    expect(result.edges.constructor.name).toBe('Uint32Array')
    expect(result.locations.constructor.name).toBe('Uint32Array')

    // Verify data integrity
    expect(result.nodes.length).toBe(14) // 2 nodes * 7 fields
    expect(result.edges.length).toBe(3) // 1 edge * 3 fields
    expect(result.locations.length).toBe(4) // 1 location * 4 fields

    // Verify metadata
    expect(result.metaData.data.node_count).toBe(2)
    expect(result.metaData.data.edge_count).toBe(1)
  } finally {
    unlinkSync(tmpFile)
  }
}, 10000) // 10 second timeout for worker creation
