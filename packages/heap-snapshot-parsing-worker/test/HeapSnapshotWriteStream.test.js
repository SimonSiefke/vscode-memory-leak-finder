import { test, expect } from '@jest/globals'
import { HeapSnapshotWriteStream } from '../src/parts/HeapSnapshotWriteStream/HeapSnapshotWriteStream.js'

test('HeapSnapshotWriteStream - constructor initializes correctly', () => {
  const stream = new HeapSnapshotWriteStream()

  expect(stream.arrayIndex).toBe(0)
  expect(stream.currentNumber).toBe(0)
  expect(stream.data).toBeInstanceOf(Uint8Array)
  expect(stream.edges).toBeInstanceOf(Uint32Array)
  expect(stream.hasDigits).toBe(false)
  expect(stream.intermediateArray).toBeInstanceOf(Uint32Array)
  expect(stream.locations).toBeInstanceOf(Uint32Array)
  expect(stream.metaData).toEqual({})
  expect(stream.nodes).toBeInstanceOf(Uint32Array)
})

test('HeapSnapshotWriteStream - resetParsingState resets parsing state', () => {
  const stream = new HeapSnapshotWriteStream()
  stream.currentNumber = 123
  stream.hasDigits = true

  stream.resetParsingState()

  expect(stream.currentNumber).toBe(0)
  expect(stream.hasDigits).toBe(false)
})

test('HeapSnapshotWriteStream - getResult returns correct structure', () => {
  const stream = new HeapSnapshotWriteStream()
  const result = stream.getResult()

  expect(result).toHaveProperty('metaData')
  expect(result).toHaveProperty('edges')
  expect(result).toHaveProperty('nodes')
  expect(result).toHaveProperty('locations')
})

test('HeapSnapshotWriteStream - processes complete heap snapshot data', async () => {
  const stream = new HeapSnapshotWriteStream()

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
    nodes: [0, 0, 1, 0, 0, 0, 0, 1, 1, 2, 0, 1, 0, 0],
    edges: [0, 0, 0],
    locations: [0, 0, 1, 2],
    strings: ['', 'root', 'child'],
  }

  const jsonData = JSON.stringify(heapSnapshotData)
  const buffer = new TextEncoder().encode(jsonData)

  stream.write(buffer)

  const result = stream.getResult()

  expect(result.metaData).toHaveProperty('data')
  expect(result.metaData.data).toHaveProperty('node_count', 2)
  expect(result.metaData.data).toHaveProperty('edge_count', 1)
  expect(result.nodes.length).toBe(14) // 2 nodes * 7 fields
  expect(result.edges.length).toBe(3) // 1 edge * 3 fields
  expect(result.locations.length).toBe(4) // 1 location * 4 fields
})

test('HeapSnapshotWriteStream - handles empty heap snapshot', async () => {
  const stream = new HeapSnapshotWriteStream()

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
    nodes: [],
    edges: [],
    locations: [],
    strings: [''],
  }

  const jsonData = JSON.stringify(heapSnapshotData)
  const buffer = new TextEncoder().encode(jsonData)

  stream.write(buffer)

  const result = stream.getResult()

  expect(result.metaData).toHaveProperty('data')
  expect(result.metaData.data).toHaveProperty('node_count', 0)
  expect(result.metaData.data).toHaveProperty('edge_count', 0)
  expect(result.nodes.length).toBe(0)
  expect(result.edges.length).toBe(0)
  expect(result.locations.length).toBe(0)
})

test('HeapSnapshotWriteStream - handles partial data chunks', async () => {
  const stream = new HeapSnapshotWriteStream()

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

  const jsonData = JSON.stringify(heapSnapshotData)
  const buffer = new TextEncoder().encode(jsonData)

  // Split the data into chunks
  const chunk1 = buffer.slice(0, Math.floor(buffer.length / 2))
  const chunk2 = buffer.slice(Math.floor(buffer.length / 2))

  stream.write(chunk1)
  stream.write(chunk2)

  const result = stream.getResult()

  expect(result.metaData).toHaveProperty('data')
  expect(result.metaData.data).toHaveProperty('node_count', 1)
  expect(result.nodes.length).toBe(7) // 1 node * 7 fields
  expect(result.edges.length).toBe(0)
  expect(result.locations.length).toBe(0)
})

test('HeapSnapshotWriteStream - handles large numbers in arrays', async () => {
  const stream = new HeapSnapshotWriteStream()

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
    nodes: [0, 0, 123456789, 0, 0, 0, 0],
    edges: [],
    locations: [],
    strings: ['', 'root'],
  }

  const jsonData = JSON.stringify(heapSnapshotData)
  const buffer = new TextEncoder().encode(jsonData)

  stream.write(buffer)

  const result = stream.getResult()

  expect(result.nodes[2]).toBe(123456789) // The large number should be parsed correctly
})

test('HeapSnapshotWriteStream - handles negative numbers (skips minus sign)', async () => {
  const stream = new HeapSnapshotWriteStream()

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
    nodes: [0, 0, 1, -100, 0, 0, 0],
    edges: [],
    locations: [],
    strings: ['', 'root'],
  }

  const jsonData = JSON.stringify(heapSnapshotData)
  const buffer = new TextEncoder().encode(jsonData)

  stream.write(buffer)

  const result = stream.getResult()

  expect(result.nodes[3]).toBe(100) // Negative number becomes positive because minus sign is skipped
})
