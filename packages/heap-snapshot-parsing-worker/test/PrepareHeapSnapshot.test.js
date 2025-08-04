import { expect, test } from '@jest/globals'
import { unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseFromFile } from '../src/parts/ParseFromFile/ParseFromFile.js'

test('prepareHeapSnapshot - parses simple heap snapshot', async () => {
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
      node_count: 1,
      edge_count: 0,
    },
    nodes: [0, 0, 1, 0, 0, 0, 0],
    edges: [],
    locations: [],
    strings: ['', 'root'],
  }

  // Write to a temporary file
  const tmpFile = join(tmpdir(), `test-heap-snapshot-${Date.now()}.json`)
  writeFileSync(tmpFile, JSON.stringify(heapSnapshotData))

  try {
    const result = await parseFromFile(tmpFile)

    expect(result).toHaveProperty('metaData')
    expect(result).toHaveProperty('nodes')
    expect(result).toHaveProperty('edges')
    expect(result).toHaveProperty('locations')

    expect(result.nodes).toBeInstanceOf(Uint32Array)
    expect(result.edges).toBeInstanceOf(Uint32Array)
    expect(result.locations).toBeInstanceOf(Uint32Array)

    expect(result.nodes.length).toBe(7) // 1 node * 7 fields
    expect(result.edges.length).toBe(0) // 0 edges
    expect(result.locations.length).toBe(0) // 0 locations
  } finally {
    unlinkSync(tmpFile)
  }
})
