import { expect, test } from '@jest/globals'
import { getDomTimerCountFromHeapSnapshot } from '../src/parts/GetDomTimerCountFromHeapSnapshot/GetDomTimerCountFromHeapSnapshot.js'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

test('should count DOM timers from heap snapshot file', async () => {
  // Create a temporary heap snapshot file
  const tempDir = tmpdir()
  const tempFile = join(tempDir, 'test-heap-snapshot.json')

  const heapSnapshotData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 3,
      edge_count: 0,
      extra_native_bytes: 0,
    },
    nodes: [3, 1, 1, 32, 0, 0, 0, 8, 1, 2, 64, 0, 0, 0, 3, 3, 3, 48, 0, 0, 0], // DOMTimer (object), DOMTimer (native), regular objects
    edges: [],
    locations: [],
    strings: ['', 'DOMTimer', 'regular'],
  }

  await writeFile(tempFile, JSON.stringify(heapSnapshotData))

  try {
    const result = await getDomTimerCountFromHeapSnapshot(tempFile)
    expect(result).toEqual(2) // 2 DOMTimer objects
  } finally {
    // Clean up
    try {
      await writeFile(tempFile, '') // Clear the file
    } catch (error) {
      // Ignore cleanup errors
    }
  }
})
