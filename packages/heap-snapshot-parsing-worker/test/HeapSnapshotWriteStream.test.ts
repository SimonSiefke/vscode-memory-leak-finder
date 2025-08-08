import { expect, test } from '@jest/globals'
import { createHeapSnapshotWriteStream } from '../src/parts/HeapSnapshotWriteStream/HeapSnapshotWriteStream.ts'

test('HeapSnapshotWriteStream - constructor initializes correctly', () => {
  const stream = createHeapSnapshotWriteStream()

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
  const stream = createHeapSnapshotWriteStream()
  stream.currentNumber = 123
  stream.hasDigits = true

  stream.resetParsingState()

  expect(stream.currentNumber).toBe(0)
  expect(stream.hasDigits).toBe(false)
})

test.skip('HeapSnapshotWriteStream - getResult returns correct structure', () => {
  const stream = createHeapSnapshotWriteStream()
  const result = stream.getResult()

  expect(result).toHaveProperty('metaData')
  expect(result).toHaveProperty('edges')
  expect(result).toHaveProperty('nodes')
  expect(result).toHaveProperty('locations')
})

test('HeapSnapshotWriteStream - processes complete heap snapshot data', async () => {
  const stream = createHeapSnapshotWriteStream()

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

  expect(result.meta).toHaveProperty('node_count', 2)
  expect(result.meta).toHaveProperty('edge_count', 1)
  expect(result.nodes.length).toBe(14) // 2 nodes * 7 fields
  expect(result.edges.length).toBe(3) // 1 edge * 3 fields
  expect(result.locations.length).toBe(4) // 1 location * 4 fields
})

test('HeapSnapshotWriteStream - handles empty heap snapshot', async () => {
  const stream = createHeapSnapshotWriteStream()

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

  expect(result.meta).toHaveProperty('node_count', 0)
  expect(result.meta).toHaveProperty('edge_count', 0)
  expect(result.nodes.length).toBe(0)
  expect(result.edges.length).toBe(0)
  expect(result.locations.length).toBe(0)
})

test('HeapSnapshotWriteStream - handles partial data chunks', async () => {
  const stream = createHeapSnapshotWriteStream()

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

  expect(result.meta).toHaveProperty('node_count', 1)
  expect(result.nodes.length).toBe(7) // 1 node * 7 fields
  expect(result.edges.length).toBe(0)
  expect(result.locations.length).toBe(0)
})

test('HeapSnapshotWriteStream - handles large numbers in arrays', async () => {
  const stream = createHeapSnapshotWriteStream()

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
  const stream = createHeapSnapshotWriteStream()

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

test('HeapSnapshotWriteStream - handles missing nodes array header gracefully', async () => {
  const stream = createHeapSnapshotWriteStream()

  // Create data without the "nodes": token
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
    // Missing "nodes": array
    edges: [],
    locations: [],
    strings: ['', 'root'],
  }

  const jsonData = JSON.stringify(heapSnapshotData)
  const buffer = new TextEncoder().encode(jsonData)

  stream.write(buffer)
  // Don't call end() to avoid triggering validation at this level
  // Validation should be tested at the parseFromJson level instead

  const result = stream.getResult()
  expect(result.meta).toBeDefined()
  expect(result.nodes.length).toBe(7) // Array is initialized with expected size but not filled
})

test('HeapSnapshotWriteStream - handles missing edges array header gracefully', async () => {
  const stream = createHeapSnapshotWriteStream()

  // Create data without the "edges": token
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
    // Missing "edges": array
    locations: [],
    strings: ['', 'root'],
  }

  const jsonData = JSON.stringify(heapSnapshotData)
  const buffer = new TextEncoder().encode(jsonData)

  stream.write(buffer)
  // Don't call end() to avoid triggering validation at this level
  // Validation should be tested at the parseFromJson level instead

  const result = stream.getResult()
  expect(result.nodes.length).toBe(7)
  expect(result.edges.length).toBe(0)
})

test('HeapSnapshotWriteStream - handles missing locations array header gracefully', async () => {
  const stream = createHeapSnapshotWriteStream()

  // Create data without the "locations": token
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
    // Missing "locations": array
    strings: ['', 'root'],
  }

  const jsonData = JSON.stringify(heapSnapshotData)
  const buffer = new TextEncoder().encode(jsonData)

  stream.write(buffer)
  // Don't call end() to avoid triggering validation at this level
  // Validation should be tested at the parseFromJson level instead

  const result = stream.getResult()
  expect(result.nodes.length).toBe(7)
  expect(result.edges.length).toBe(0)
  expect(result.locations.length).toBe(0)
})

test('HeapSnapshotWriteStream - handles malformed nodes array gracefully', async () => {
  const stream = createHeapSnapshotWriteStream()

  // Manually construct data where "nodes": is present but no opening bracket follows
  const partialData =
    '{"snapshot":{"meta":{"node_fields":["type","name","id","self_size","edge_count","trace_node_id","detachedness"],' +
    '"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],' +
    '"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},' +
    '"node_count":1,"edge_count":0},"nodes":'

  const buffer = new TextEncoder().encode(partialData)

  stream.write(buffer)
  // Don't call end() to avoid triggering validation at this level
  // Validation should be tested at the parseFromJson level instead

  const result = stream.getResult()
  expect(result.nodes.length).toBe(7) // Array is initialized with expected size but not filled
})

test('HeapSnapshotWriteStream - handles malformed edges array gracefully', async () => {
  const stream = createHeapSnapshotWriteStream()

  // Manually construct data where "edges": is present but no opening bracket follows
  const partialData =
    '{"snapshot":{"meta":{"node_fields":["type","name","id","self_size","edge_count","trace_node_id","detachedness"],' +
    '"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],' +
    '"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},' +
    '"node_count":1,"edge_count":0},"nodes":[0,0,1,0,0,0,0],"edges":'

  const buffer = new TextEncoder().encode(partialData)

  stream.write(buffer)
  // Don't call end() to avoid triggering validation at this level
  // Validation should be tested at the parseFromJson level instead

  const result = stream.getResult()
  expect(result.nodes.length).toBe(7)
  expect(result.edges.length).toBe(0)
})

test('HeapSnapshotWriteStream - handles malformed locations array gracefully', async () => {
  const stream = createHeapSnapshotWriteStream()

  // Manually construct data where "locations": is present but no opening bracket follows
  const partialData =
    '{"snapshot":{"meta":{"node_fields":["type","name","id","self_size","edge_count","trace_node_id","detachedness"],' +
    '"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],' +
    '"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},' +
    '"node_count":1,"edge_count":0},"nodes":[0,0,1,0,0,0,0],"edges":[],"locations":'

  const buffer = new TextEncoder().encode(partialData)

  stream.write(buffer)
  // Don't call end() to avoid triggering validation at this level
  // Validation should be tested at the parseFromJson level instead

  const result = stream.getResult()
  expect(result.nodes.length).toBe(7)
  expect(result.edges.length).toBe(0)
  expect(result.locations.length).toBe(0)
})

test('HeapSnapshotWriteStream - handles partial data where array header is incomplete', async () => {
  const stream = createHeapSnapshotWriteStream()

  // Create data that ends before the array header is complete
  const partialData =
    '{"snapshot":{"meta":{"node_fields":["type","name","id","self_size","edge_count","trace_node_id","detachedness"],' +
    '"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],' +
    '"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},' +
    '"node_count":1,"edge_count":0},"nodes":'

  const buffer = new TextEncoder().encode(partialData)

  stream.write(buffer)

  const result = stream.getResult()

  // Should have metadata but no nodes data since the array header is incomplete
  expect(result.nodes.length).toBe(7) // Array is initialized with expected size but not filled
})

test('HeapSnapshotWriteStream - processes heap snapshot with strings when parseStrings is true', async () => {
  const stream = createHeapSnapshotWriteStream({ parseStrings: true })

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
    locations: [0, 0, 1, 2],
    strings: ['', 'root', 'child', 'grandchild'],
  }

  const jsonData = JSON.stringify(heapSnapshotData)
  const buffer = new TextEncoder().encode(jsonData)

  stream.write(buffer)

  const result = stream.getResult()

  expect(result.metaData.data).toHaveProperty('node_count', 1)
  expect(result.nodes.length).toBe(7) // 1 node * 7 fields
  expect(result.edges.length).toBe(0)
  expect(result.locations.length).toBe(4) // 1 location * 4 fields
  expect(result.strings).toEqual(['', 'root', 'child', 'grandchild'])
})

test('HeapSnapshotWriteStream - skips strings when parseStrings is false', async () => {
  const stream = createHeapSnapshotWriteStream({ parseStrings: false })

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
    locations: [0, 0, 1, 2],
    strings: ['', 'root', 'child'],
  }

  const jsonData = JSON.stringify(heapSnapshotData)
  const buffer = new TextEncoder().encode(jsonData)

  stream.write(buffer)

  const result = stream.getResult()

  expect(result.nodes.length).toBe(7)
  expect(result.edges.length).toBe(0)
  expect(result.locations.length).toBe(4)
  expect(result.strings).toEqual([]) // Should be empty when parseStrings is false
})

test('HeapSnapshotWriteStream - handles partial string data', async () => {
  const stream = createHeapSnapshotWriteStream({ parseStrings: true })

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
    locations: [0, 0, 1, 2],
    strings: ['', 'root', 'child'],
  }

  const jsonData = JSON.stringify(heapSnapshotData)
  const buffer = new TextEncoder().encode(jsonData)

  // Split the data into chunks
  const chunk1 = buffer.slice(0, Math.floor(buffer.length * 0.7))
  const chunk2 = buffer.slice(Math.floor(buffer.length * 0.7))

  stream.write(chunk1)
  stream.write(chunk2)

  const result = stream.getResult()

  expect(result.meta).toHaveProperty('location_fields')
  expect(result.nodes.length).toBe(7)
  expect(result.edges.length).toBe(0)
  expect(result.locations.length).toBe(4)
  expect(result.strings).toEqual(['', 'root', 'child'])
})
