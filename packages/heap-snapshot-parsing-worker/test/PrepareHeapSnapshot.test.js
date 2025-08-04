import { test, expect, jest } from '@jest/globals'
import { Readable } from 'node:stream'

const mockCreateReadStream = jest.fn()

// Mock the fs module
const mockFs = {
  createReadStream: mockCreateReadStream,
}

// Use jest.unstable_mockModule to mock the fs module
jest.unstable_mockModule('node:fs', () => mockFs)

// Re-import the function to get the mocked version
const { prepareHeapSnapshot } = await import('../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js')

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

  // Create mock read stream
  const mockReadStream = new Readable({
    read() {
      this.push(JSON.stringify(heapSnapshotData))
      this.push(null) // End the stream
    },
  })
  mockCreateReadStream.mockReturnValue(mockReadStream)

  const result = await prepareHeapSnapshot('/test/mock-file-path.json')

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

  // Write to a temporary file
  const tmpFile = join(tmpdir(), `test-heap-snapshot-strings-${Date.now()}.json`)
  writeFileSync(tmpFile, JSON.stringify(heapSnapshotData))

  try {
    const result = await prepareHeapSnapshot(tmpFile, true)

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
  } finally {
    unlinkSync(tmpFile)
  }
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

  // Write to a temporary file
  const tmpFile = join(tmpdir(), `test-heap-snapshot-no-strings-${Date.now()}.json`)
  writeFileSync(tmpFile, JSON.stringify(heapSnapshotData))

  try {
    const result = await prepareHeapSnapshot(tmpFile, false)

    expect(result).toHaveProperty('metaData')
    expect(result).toHaveProperty('nodes')
    expect(result).toHaveProperty('edges')
    expect(result).toHaveProperty('locations')
    expect(result).not.toHaveProperty('strings')

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
