import { test, expect } from '@jest/globals'
import { getArraysByClosureLocationFromHeapSnapshotCommand } from '../src/parts/GetArraysByClosureLocationFromHeapSnapshotCommand/GetArraysByClosureLocationFromHeapSnapshotCommand.js'
import * as HeapSnapshotState from '../src/parts/HeapSnapshotState/HeapSnapshotState.js'

test('should get arrays by closure location', async () => {
  // Mock heap snapshot data
  const mockHeapSnapshot = {
    snapshot: {
      meta: {
        data: {
          meta: {
            node_types: [['object', 'string', 'number']],
            node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
            edge_types: [['property', 'element']],
            edge_fields: ['type', 'name_or_index', 'to_node'],
            location_fields: ['object_index', 'script_id', 'line', 'column'],
          },
        },
      },
    },
    nodes: new Uint32Array([
      0, 0, 1, 100, 1, 1, 0, // Array 1
      0, 0, 2, 200, 1, 2, 0, // Array 2
    ]),
    edges: new Uint32Array([
      0, 0, 0, // property edge to Array 1
      0, 0, 1, // property edge to Array 2
    ]),
    strings: ['Array', 'items'],
    locations: new Uint32Array([
      7, 1, 10, 5, // object_index = 1, script_id = 1, line = 10, column = 5
      14, 2, 15, 8, // object_index = 2, script_id = 2, line = 15, column = 8
    ]),
  }

  // Mock script map
  const scriptMap = {
    1: { url: 'file:///test1.js', sourceMapUrl: '' },
    2: { url: 'file:///test2.js', sourceMapUrl: '' },
  }

  // Set up the heap snapshot state
  const snapshotId = 'test-snapshot'
  HeapSnapshotState.set(snapshotId, mockHeapSnapshot)

  try {
    const result = await getArraysByClosureLocationFromHeapSnapshotCommand(snapshotId, scriptMap)

    expect(result).toHaveLength(2)
    
    // First group should be location 1 with 1 array
    const firstGroup = result[0]
    expect(firstGroup.locationKey).toBe('1:10:5')
    expect(firstGroup.count).toBe(1)
    expect(firstGroup.totalSize).toBe(100)
    expect(firstGroup.locationInfo).toEqual({
      scriptId: 1,
      line: 10,
      column: 5,
      url: 'file:///test1.js',
      sourceMapUrl: '',
    })

    // Second group should be location 2 with 1 array
    const secondGroup = result[1]
    expect(secondGroup.locationKey).toBe('2:15:8')
    expect(secondGroup.count).toBe(1)
    expect(secondGroup.totalSize).toBe(200)
    expect(secondGroup.locationInfo).toEqual({
      scriptId: 2,
      line: 15,
      column: 8,
      url: 'file:///test2.js',
      sourceMapUrl: '',
    })
  } finally {
    // Clean up
    HeapSnapshotState.dispose(snapshotId)
  }
}) 