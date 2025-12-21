import { expect, test } from '@jest/globals'
import { parseFromJson } from '../src/parts/ParseFromJson/ParseFromJson.ts'

test('prepareHeapSnapshot - parses simple heap snapshot', async () => {
  // Create a minimal heap snapshot data
  const heapSnapshotData = {
    edges: [],
    locations: [],
    nodes: [0, 0, 1, 0, 0, 0, 0],
    snapshot: {
      edge_count: 0,
      meta: {
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
      },
      node_count: 1,
    },
    strings: ['', 'root'],
  }
  const result = await parseFromJson(heapSnapshotData)

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
})

test('prepareHeapSnapshot - parses strings when parseStrings is true', async () => {
  // Create a minimal heap snapshot file with strings
  const heapSnapshotData = {
    edges: [],
    locations: [],
    nodes: [0, 0, 1, 0, 0, 0, 0],
    snapshot: {
      edge_count: 0,
      meta: {
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
      },
      node_count: 1,
    },
    strings: ['', 'root', 'test', 'hello world'],
  }

  const result = await parseFromJson(heapSnapshotData, { parseStrings: true })

  expect(result).toHaveProperty('metaData')
  expect(result).toHaveProperty('nodes')
  expect(result).toHaveProperty('edges')
  expect(result).toHaveProperty('locations')
  expect(result).toHaveProperty('strings')

  expect(result.nodes).toBeInstanceOf(Uint32Array)
  expect(result.edges).toBeInstanceOf(Uint32Array)
  expect(result.locations).toBeInstanceOf(Uint32Array)
  expect(Array.isArray(result.strings)).toBe(true)

  expect(result.nodes.length).toBe(7) // 1 node * 7 fields
  expect(result.edges.length).toBe(0) // 0 edges
  expect(result.locations.length).toBe(0) // 0 locations
  expect(result.strings).toEqual(['', 'root', 'test', 'hello world'])
})

test('prepareHeapSnapshot - parses special strings', async () => {
  // Create a minimal heap snapshot file with strings
  const heapSnapshotData = {
    edges: [],
    locations: [],
    nodes: [0, 0, 1, 0, 0, 0, 0],
    snapshot: {
      edge_count: 0,
      meta: {
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
      },
      node_count: 1,
    },
    strings: ['get webUtils', 'get noDeprecation', 'set noDeprecation', '<symbol nodejs.util.inspect.custom>'],
  }

  const result = await parseFromJson(heapSnapshotData, { parseStrings: true })

  expect(result).toHaveProperty('metaData')
  expect(result).toHaveProperty('nodes')
  expect(result).toHaveProperty('edges')
  expect(result).toHaveProperty('locations')
  expect(result).toHaveProperty('strings')

  expect(result.nodes).toBeInstanceOf(Uint32Array)
  expect(result.edges).toBeInstanceOf(Uint32Array)
  expect(result.locations).toBeInstanceOf(Uint32Array)
  expect(Array.isArray(result.strings)).toBe(true)

  expect(result.nodes.length).toBe(7) // 1 node * 7 fields
  expect(result.edges.length).toBe(0) // 0 edges
  expect(result.locations.length).toBe(0) // 0 locations
  expect(result.strings).toEqual(['get webUtils', 'get noDeprecation', 'set noDeprecation', '<symbol nodejs.util.inspect.custom>'])
})

test('prepareHeapSnapshot - does not parse strings when parseStrings is false', async () => {
  // Create a minimal heap snapshot file with strings
  const heapSnapshotData = {
    edges: [],
    locations: [],
    nodes: [0, 0, 1, 0, 0, 0, 0],
    snapshot: {
      edge_count: 0,
      meta: {
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
      },
      node_count: 1,
    },
    strings: ['', 'root', 'test'],
  }

  const result = await parseFromJson(heapSnapshotData, { parseStrings: false })

  expect(result).toHaveProperty('metaData')
  expect(result).toHaveProperty('nodes')
  expect(result).toHaveProperty('edges')
  expect(result).toHaveProperty('locations')
  expect(result).toHaveProperty('strings')

  expect(result.nodes).toBeInstanceOf(Uint32Array)
  expect(result.edges).toBeInstanceOf(Uint32Array)
  expect(result.locations).toBeInstanceOf(Uint32Array)

  expect(result.nodes.length).toBe(7) // 1 node * 7 fields
  expect(result.edges.length).toBe(0) // 0 edges
  expect(result.locations.length).toBe(0) // 0 locations
  expect(result.strings).toEqual([])
})

test('parseFromJson - throws HeapSnapshotParserError when metadata is missing', async () => {
  const heapSnapshotData = {
    edges: [],
    locations: [],
    // Missing snapshot metadata
    nodes: [0, 0, 1, 0, 0, 0, 0],
    strings: ['', 'root'],
  }

  await expect(parseFromJson(heapSnapshotData)).rejects.toThrow('Heapsnapshot is missing metadata')
})

test('parseFromJson - throws HeapSnapshotParserError when nodes are missing', async () => {
  const heapSnapshotData = {
    // Missing nodes array
    edges: [],
    locations: [],
    snapshot: {
      edge_count: 0,
      meta: {
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
      },
      node_count: 1,
    },
    strings: ['', 'root'],
  }

  await expect(parseFromJson(heapSnapshotData)).rejects.toThrow('Heap snapshot parsing did not complete successfully')
})

test('parseFromJson - throws HeapSnapshotParserError when edges are missing', async () => {
  const heapSnapshotData = {
    // Missing edges array
    locations: [],
    nodes: [0, 0, 1, 0, 0, 0, 0],
    snapshot: {
      edge_count: 0,
      meta: {
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
      },
      node_count: 1,
    },
    strings: ['', 'root'],
  }

  await expect(parseFromJson(heapSnapshotData)).rejects.toThrow('Heap snapshot parsing did not complete successfully')
})

test('parseFromJson - throws HeapSnapshotParserError when locations are missing', async () => {
  const heapSnapshotData = {
    edges: [],
    nodes: [0, 0, 1, 0, 0, 0, 0],
    snapshot: {
      edge_count: 0,
      meta: {
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
      },
      node_count: 1,
    },
    // Missing locations array
    strings: ['', 'root'],
  }

  await expect(parseFromJson(heapSnapshotData)).rejects.toThrow('Heap snapshot parsing did not complete successfully')
})

test('parseFromJson - allows empty nodes array', async () => {
  const heapSnapshotData = {
    edges: [],
    locations: [],
    nodes: [], // Empty nodes array is allowed
    snapshot: {
      edge_count: 0,
      meta: {
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
      },
      node_count: 0,
    },
    strings: ['', 'root'],
  }

  const result = await parseFromJson(heapSnapshotData)
  expect(result.nodes).toBeInstanceOf(Uint32Array)
  expect(result.nodes.length).toBe(0)
})

test('parseFromJson - allows empty edges array', async () => {
  const heapSnapshotData = {
    edges: [], // Empty edges array is allowed
    locations: [],
    nodes: [0, 0, 1, 0, 0, 0, 0],
    snapshot: {
      edge_count: 0,
      meta: {
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
      },
      node_count: 1,
    },
    strings: ['', 'root'],
  }

  const result = await parseFromJson(heapSnapshotData)
  expect(result.edges).toBeInstanceOf(Uint32Array)
  expect(result.edges.length).toBe(0)
})

test('parseFromJson - allows empty locations array', async () => {
  const heapSnapshotData = {
    edges: [],
    locations: [], // Empty locations array is allowed
    nodes: [0, 0, 1, 0, 0, 0, 0],
    snapshot: {
      edge_count: 0,
      meta: {
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
      },
      node_count: 1,
    },
    strings: ['', 'root'],
  }

  const result = await parseFromJson(heapSnapshotData)
  expect(result.locations).toBeInstanceOf(Uint32Array)
  expect(result.locations.length).toBe(0)
})

test('parseFromJson - throws HeapSnapshotParserError when snapshot metadata is completely missing', async () => {
  const heapSnapshotData = {
    edges: [],
    locations: [],
    // Missing snapshot property entirely
    nodes: [0, 0, 1, 0, 0, 0, 0],
    strings: ['', 'root'],
  }

  await expect(parseFromJson(heapSnapshotData)).rejects.toThrow('Heapsnapshot is missing metadata')
})
