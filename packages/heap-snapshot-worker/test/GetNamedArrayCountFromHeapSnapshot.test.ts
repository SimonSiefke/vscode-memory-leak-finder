import { test, expect } from '@jest/globals'
import { getNamedArrayCountFromHeapSnapshot } from '../src/parts/GetNamedArrayCountFromHeapSnapshot/GetNamedArrayCountFromHeapSnapshot.ts'
import * as HeapSnapshotState from '../src/parts/HeapSnapshotState/HeapSnapshotState.ts'

test('should count arrays with location information from closures', async () => {
  const snapshotId = 'test-snapshot-1'
  const ITEMS_PER_NODE = 7
  const mockHeapSnapshot = {
    snapshot: {
      meta: {
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
          ],
        ],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
    },
    // nodes: [type, name, id, self_size, edge_count, trace_node_id, detachedness]
    // Node 0: Closure 1 - type=closure(5), id=0, edge_count=1 (has context edge)
    // Node 1: Context object 1 - type=object(3), name=''(empty), id=1, edge_count=2 (references arrays)
    // Node 2: Array 1 - type=object(3), name=Array(0), id=2
    // Node 3: Array 2 - type=object(3), name=Array(0), id=3
    // Node 4: Closure 2 - type=closure(5), id=4, edge_count=1 (has context edge)
    // Node 5: Context object 2 - type=object(3), name=''(empty), id=5, edge_count=1 (references array)
    // Node 6: Array 3 - type=object(3), name=Array(0), id=6
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 - type=closure(5), id=0, edge_count=1
      3, 0, 1, 30, 2, 0, 0, // Context 1 - type=object(3), name=''(0), id=1, edge_count=2
      3, 0, 2, 100, 0, 0, 0, // Array 1 - type=object(3), name=Array(0), id=2
      3, 0, 3, 200, 0, 0, 0, // Array 2 - type=object(3), name=Array(0), id=3
      5, 0, 4, 50, 1, 0, 0, // Closure 2 - type=closure(5), id=4, edge_count=1
      3, 0, 5, 30, 1, 0, 0, // Context 2 - type=object(3), name=''(0), id=5, edge_count=1
      3, 0, 6, 150, 0, 0, 0, // Array 3 - type=object(3), name=Array(0), id=6
    ]),
    // edges: [type, name_or_index, to_node]
    // to_node is byte offset: node index * ITEMS_PER_NODE
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1 via 'context' edge (type=0=context, name='context'(3), to node 1 = byte offset 7)
      2, 1, 14, // Context 1 -> Array 1 via 'myArray' property (type=2=property, name='myArray'(1), to node 2 = byte offset 14)
      2, 2, 21, // Context 1 -> Array 2 via 'items' property (type=2=property, name='items'(2), to node 3 = byte offset 21)
      0, 3, 35, // Closure 2 -> Context 2 via 'context' edge (type=0=context, name='context'(3), to node 5 = byte offset 35)
      2, 1, 42, // Context 2 -> Array 3 via 'myArray' property (type=2=property, name='myArray'(1), to node 6 = byte offset 42)
    ]),
    strings: ['Array', 'myArray', 'items', 'context'],
    // locations: [object_index, script_id, line, column]
    // Location for Closure 1: object_index=0 (0/7), script_id=1, line=10, column=5
    // Location for Closure 2: object_index=4 (28/7), script_id=2, line=15, column=8
    locations: new Uint32Array([
      0, 1, 10, 5, // object_index=0 (Closure 1), script_id=1, line=10, column=5
      28, 2, 15, 8, // object_index=4 (Closure 2, 4*7=28), script_id=2, line=15, column=8
    ]),
  }

  const scriptMap = {
    1: { url: 'file:///test1.js', sourceMapUrl: 'file:///test1.js.map' },
    2: { url: 'file:///test2.js', sourceMapUrl: 'file:///test2.js.map' },
  }

  HeapSnapshotState.set(snapshotId, mockHeapSnapshot)

  try {
    const result = await getNamedArrayCountFromHeapSnapshot(snapshotId, scriptMap)

    // Filter out entries with name "context" as they're not real array names
    const filteredResult = result.filter((item) => item.name !== 'context')
    expect(filteredResult).toHaveLength(2)

    // Check 'myArray' - should have 2 arrays with 2 locations (from Closure 1 and Closure 2)
    const myArrayResult = filteredResult.find((item) => item.name === 'myArray')
    expect(myArrayResult).toBeDefined()
    expect(myArrayResult?.count).toBe(2)
    expect(myArrayResult?.locations).toHaveLength(2)
    expect(myArrayResult?.locations).toEqual(
      expect.arrayContaining([
        {
          scriptId: 1,
          line: 10,
          column: 5,
          url: 'file:///test1.js',
          sourceMapUrl: 'file:///test1.js.map',
        },
        {
          scriptId: 2,
          line: 15,
          column: 8,
          url: 'file:///test2.js',
          sourceMapUrl: 'file:///test2.js.map',
        },
      ]),
    )

    // Check 'items' - should have 1 array with 1 location (from Closure 1)
    const itemsResult = filteredResult.find((item) => item.name === 'items')
    expect(itemsResult).toBeDefined()
    expect(itemsResult?.count).toBe(1)
    expect(itemsResult?.locations).toHaveLength(1)
    expect(itemsResult?.locations[0]).toEqual({
      scriptId: 1,
      line: 10,
      column: 5,
      url: 'file:///test1.js',
      sourceMapUrl: 'file:///test1.js.map',
    })
  } finally {
    HeapSnapshotState.dispose(snapshotId)
  }
})

test('should handle arrays without locations (fallback)', async () => {
  const snapshotId = 'test-snapshot-2'
  const mockHeapSnapshot = {
    snapshot: {
      meta: {
        node_types: [['object', 'string', 'closure']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['property', 'context']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
    },
    nodes: new Uint32Array([
      3, 1, 0, 50, 2, 0, 0, // Source object
      3, 0, 1, 100, 0, 0, 0, // Array 1
      3, 0, 2, 200, 0, 0, 0, // Array 2
    ]),
    edges: new Uint32Array([
      1, 1, 7, // property edge to Array 1 (byte offset 7)
      1, 1, 7, // property edge to Array 1 (duplicate)
      1, 2, 14, // property edge to Array 2 (byte offset 14)
    ]),
    strings: ['Array', 'myArray', 'items'],
    locations: new Uint32Array([]), // Empty locations array - no closures
  }

  HeapSnapshotState.set(snapshotId, mockHeapSnapshot)

  try {
    const result = await getNamedArrayCountFromHeapSnapshot(snapshotId)

    expect(result).toHaveLength(2)

    // Should have count but empty locations array (no closures found)
    const myArrayResult = result.find((item) => item.name === 'myArray')
    expect(myArrayResult).toBeDefined()
    expect(myArrayResult?.count).toBe(2)
    expect(myArrayResult?.locations).toEqual([])

    const itemsResult = result.find((item) => item.name === 'items')
    expect(itemsResult).toBeDefined()
    expect(itemsResult?.count).toBe(1)
    expect(itemsResult?.locations).toEqual([])
  } finally {
    HeapSnapshotState.dispose(snapshotId)
  }
})

test('should handle arrays without trace_node_id', async () => {
  const snapshotId = 'test-snapshot-3'
  const mockHeapSnapshot = {
    snapshot: {
      meta: {
        node_types: [['object', 'string']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['property']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
    },
    nodes: new Uint32Array([
      3, 1, 0, 50, 2, 0, 0, // Source object
      3, 0, 1, 100, 0, 0, 0, // Array with trace_node_id=0 (no location)
      3, 0, 2, 200, 0, 1, 0, // Array with trace_node_id=1 (has location)
    ]),
    edges: new Uint32Array([
      2, 1, 7, // property edge to Array 1 (byte offset 7)
      2, 1, 14, // property edge to Array 2 (byte offset 14)
    ]),
    strings: ['Array', 'myArray', 'source'],
    locations: new Uint32Array([
      14, 1, 10, 5, // object_index=2 (14/7), script_id=1, line=10, column=5
    ]),
  }

  const scriptMap = {
    1: { url: 'file:///test.js', sourceMapUrl: '' },
  }

  HeapSnapshotState.set(snapshotId, mockHeapSnapshot)

  try {
    const result = await getNamedArrayCountFromHeapSnapshot(snapshotId, scriptMap)

    expect(result).toHaveLength(1)

    const myArrayResult = result[0]
    expect(myArrayResult.name).toBe('myArray')
    expect(myArrayResult.count).toBe(2)
    // Should have one location (the one with trace_node_id)
    expect(myArrayResult.locations).toHaveLength(1)
    expect(myArrayResult.locations[0]).toEqual({
      scriptId: 1,
      line: 10,
      column: 5,
      url: 'file:///test.js',
      sourceMapUrl: '',
    })
  } finally {
    HeapSnapshotState.dispose(snapshotId)
  }
})

test('should group arrays by name and collect unique locations', async () => {
  const snapshotId = 'test-snapshot-4'
  const mockHeapSnapshot = {
    snapshot: {
      meta: {
        node_types: [['object', 'string']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['property']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
    },
    // Multiple arrays with same name but different locations
    nodes: new Uint32Array([
      3, 1, 0, 50, 4, 0, 0, // Source object
      3, 0, 1, 100, 0, 1, 0, // Array 1 - trace_node_id=1
      3, 0, 2, 200, 0, 1, 0, // Array 2 - trace_node_id=1 (same location)
      3, 0, 3, 150, 0, 2, 0, // Array 3 - trace_node_id=2 (different location)
      3, 0, 4, 180, 0, 1, 0, // Array 4 - trace_node_id=1 (same as first)
    ]),
    edges: new Uint32Array([
      2, 1, 7, // myArray -> Array 1 (byte offset 7)
      2, 1, 14, // myArray -> Array 2 (byte offset 14)
      2, 1, 21, // myArray -> Array 3 (byte offset 21)
      2, 1, 28, // myArray -> Array 4 (byte offset 28)
    ]),
    strings: ['Array', 'myArray', 'source'],
    locations: new Uint32Array([
      7, 1, 10, 5, // object_index=1 (7/7), script_id=1, line=10, column=5
      14, 2, 15, 8, // object_index=2 (14/7), script_id=2, line=15, column=8
    ]),
  }

  const scriptMap = {
    1: { url: 'file:///test1.js', sourceMapUrl: '' },
    2: { url: 'file:///test2.js', sourceMapUrl: '' },
  }

  HeapSnapshotState.set(snapshotId, mockHeapSnapshot)

  try {
    const result = await getNamedArrayCountFromHeapSnapshot(snapshotId, scriptMap)

    expect(result).toHaveLength(1)

    const myArrayResult = result[0]
    expect(myArrayResult.name).toBe('myArray')
    expect(myArrayResult.count).toBe(4) // All 4 arrays
    // Should have 2 unique locations
    expect(myArrayResult.locations).toHaveLength(2)
    expect(myArrayResult.locations).toEqual(
      expect.arrayContaining([
        {
          scriptId: 1,
          line: 10,
          column: 5,
          url: 'file:///test1.js',
          sourceMapUrl: '',
        },
        {
          scriptId: 2,
          line: 15,
          column: 8,
          url: 'file:///test2.js',
          sourceMapUrl: '',
        },
      ]),
    )
  } finally {
    HeapSnapshotState.dispose(snapshotId)
  }
})

test('should work without scriptMap', async () => {
  const snapshotId = 'test-snapshot-5'
  const mockHeapSnapshot = {
    snapshot: {
      meta: {
        node_types: [['object', 'string']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['property']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
    },
    nodes: new Uint32Array([
      3, 1, 0, 50, 1, 0, 0, // Source object
      3, 0, 1, 100, 0, 1, 0, // Array 1
    ]),
    edges: new Uint32Array([
      2, 1, 7, // property edge to Array 1 (byte offset 7)
    ]),
    strings: ['Array', 'myArray', 'source'],
    locations: new Uint32Array([
      7, 1, 10, 5, // object_index=1 (7/7), script_id=1, line=10, column=5
    ]),
  }

  HeapSnapshotState.set(snapshotId, mockHeapSnapshot)

  try {
    const result = await getNamedArrayCountFromHeapSnapshot(snapshotId)

    expect(result).toHaveLength(1)

    const myArrayResult = result[0]
    expect(myArrayResult.name).toBe('myArray')
    expect(myArrayResult.count).toBe(1)
    expect(myArrayResult.locations).toHaveLength(1)
    // Without scriptMap, url and sourceMapUrl should be empty strings
    expect(myArrayResult.locations[0]).toEqual({
      scriptId: 1,
      line: 10,
      column: 5,
      url: '',
      sourceMapUrl: '',
    })
  } finally {
    HeapSnapshotState.dispose(snapshotId)
  }
})

test('should sort results by count descending', async () => {
  const snapshotId = 'test-snapshot-6'
  const mockHeapSnapshot = {
    snapshot: {
      meta: {
        node_types: [['object', 'string']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['property']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
    },
    nodes: new Uint32Array([
      3, 2, 0, 50, 4, 0, 0, // Source object
      3, 0, 1, 100, 0, 1, 0, // Array 1
      3, 0, 2, 200, 0, 1, 0, // Array 2
      3, 0, 3, 150, 0, 1, 0, // Array 3
      3, 0, 4, 180, 0, 1, 0, // Array 4
    ]),
    edges: new Uint32Array([
      2, 1, 7, // myArray -> Array 1 (byte offset 7)
      2, 1, 14, // myArray -> Array 2 (byte offset 14)
      2, 1, 21, // myArray -> Array 3 (byte offset 21)
      2, 2, 28, // items -> Array 4 (byte offset 28)
    ]),
    strings: ['Array', 'myArray', 'items', 'source'],
    locations: new Uint32Array([
      7, 1, 10, 5, // object_index=1 (7/7)
    ]),
  }

  const scriptMap = {
    1: { url: 'file:///test.js', sourceMapUrl: '' },
  }

  HeapSnapshotState.set(snapshotId, mockHeapSnapshot)

  try {
    const result = await getNamedArrayCountFromHeapSnapshot(snapshotId, scriptMap)

    expect(result).toHaveLength(2)
    // Results should be sorted by count descending
    expect(result[0].count).toBeGreaterThanOrEqual(result[1].count)
    expect(result[0].name).toBe('myArray')
    expect(result[0].count).toBe(3)
    expect(result[1].name).toBe('items')
    expect(result[1].count).toBe(1)
  } finally {
    HeapSnapshotState.dispose(snapshotId)
  }
})
