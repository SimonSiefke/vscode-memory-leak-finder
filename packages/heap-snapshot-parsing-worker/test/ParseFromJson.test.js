import { expect, test } from '@jest/globals'
import { parseFromJson } from '../src/parts/ParseFromJson/ParseFromJson.js'

test('prepareHeapSnapshot - parses simple heap snapshot', async () => {
  // Create a minimal heap snapshot data
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

test('prepareHeapSnapshot - does not parse strings when parseStrings is false', async () => {
  // Create a minimal heap snapshot file with strings
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

test('parseFromJson - throws ParserError when metadata is missing', async () => {
  const heapSnapshotData = {
    // Missing snapshot metadata
    nodes: [0, 0, 1, 0, 0, 0, 0],
    edges: [],
    locations: [],
    strings: ['', 'root'],
  }

  await expect(parseFromJson(heapSnapshotData)).rejects.toThrow('Missing required metadata in heap snapshot')
})

test('parseFromJson - throws ParserError when nodes are missing', async () => {
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
    // Missing nodes array
    edges: [],
    locations: [],
    strings: ['', 'root'],
  }

  await expect(parseFromJson(heapSnapshotData)).rejects.toThrow('Heap snapshot parsing did not complete successfully')
})

test('parseFromJson - throws ParserError when edges are missing', async () => {
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
    // Missing edges array
    locations: [],
    strings: ['', 'root'],
  }

  await expect(parseFromJson(heapSnapshotData)).rejects.toThrow('Heap snapshot parsing did not complete successfully')
})

test('parseFromJson - throws ParserError when locations are missing', async () => {
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
    // Missing locations array
    strings: ['', 'root'],
  }

  await expect(parseFromJson(heapSnapshotData)).rejects.toThrow('Heap snapshot parsing did not complete successfully')
})

test('parseFromJson - allows empty nodes array', async () => {
  const heapSnapshotData = {
    snapshot: {
      meta: {
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        node_types: [['hidden', 'array', 'string', 'object']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['context', 'element', 'property', 'internal']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 0,
      edge_count: 0,
    },
    nodes: [], // Empty nodes array is allowed
    edges: [],
    locations: [],
    strings: ['', 'root'],
  }

  const result = await parseFromJson(heapSnapshotData)
  expect(result.nodes).toBeInstanceOf(Uint32Array)
  expect(result.nodes.length).toBe(0)
})

test('parseFromJson - allows empty edges array', async () => {
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
    edges: [], // Empty edges array is allowed
    locations: [],
    strings: ['', 'root'],
  }

  const result = await parseFromJson(heapSnapshotData)
  expect(result.edges).toBeInstanceOf(Uint32Array)
  expect(result.edges.length).toBe(0)
})

test('parseFromJson - allows empty locations array', async () => {
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
    locations: [], // Empty locations array is allowed
    strings: ['', 'root'],
  }

  const result = await parseFromJson(heapSnapshotData)
  expect(result.locations).toBeInstanceOf(Uint32Array)
  expect(result.locations.length).toBe(0)
})

test('parseFromJson - throws ParserError when snapshot metadata is completely missing', async () => {
  const heapSnapshotData = {
    // Missing snapshot property entirely
    nodes: [0, 0, 1, 0, 0, 0, 0],
    edges: [],
    locations: [],
    strings: ['', 'root'],
  }

  await expect(parseFromJson(heapSnapshotData)).rejects.toThrow('Missing required metadata in heap snapshot')
})
