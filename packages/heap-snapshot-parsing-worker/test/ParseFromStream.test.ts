import { test, expect } from '@jest/globals'
import { createHeapSnapshotWriteStream } from '../src/parts/HeapSnapshotWriteStream/HeapSnapshotWriteStream.ts'
import * as HeapSnapshotParsingState from '../src/parts/HeapSnapshotParsingState/HeapSnapshotParsingState.ts'

test('parseFromStream - reproduces string parsing issue with multiple chunks', async () => {
  // Create a minimal heap snapshot that ends with locations and strings
  const heapSnapshotData = `{
    "snapshot": {
      "meta": {
        "node_fields": ["type", "name", "id", "self_size", "edge_count", "trace_node_id", "detachedness"],
        "node_types": [["hidden", "array", "string", "object", "code", "closure", "regexp", "number", "native", "synthetic", "concatenated string", "sliced string", "symbol", "bigint"], ["string", "number"], ["string", "number"], ["number"], ["number"], ["number"], ["number"]],
        "edge_fields": ["type", "name_or_index", "to_node"],
        "edge_types": [["context", "element", "property", "internal", "hidden", "shortcut", "weak"], ["string", "number"], ["node"]],
        "trace_function_info_fields": ["function_id", "name", "script_name", "script_id", "line", "column"],
        "trace_node_fields": ["id", "function_info_index", "count", "size", "children"],
        "sample_fields": ["timestamp_us", "last_assigned_id"],
        "location_fields": ["object_index", "script_id", "line", "column"]
      },
      "node_count": 1,
      "edge_count": 0,
      "trace_function_count": 0,
      "trace_node_count": 0,
      "sample_count": 0,
      "location_count": 1
    },
    "nodes": [1, 0, 1, 0, 0, 0, 0],
    "edges": [],
    "locations": [0, 0, 1, 0],
    "strings": ["<dummy>", "test string 1", "test string 2"]
  }`

  // Split the data into chunks that would cause the issue
  // The first chunk ends right after the locations array
  const chunk1 = heapSnapshotData.substring(0, heapSnapshotData.indexOf('"strings":'))
  const chunk2 = heapSnapshotData.substring(heapSnapshotData.indexOf('"strings":'))

  console.log('Chunk 1 ends with:', chunk1.substring(chunk1.length - 50))
  console.log('Chunk 2 starts with:', chunk2.substring(0, 50))

  const writeStream = createHeapSnapshotWriteStream({
    parseStrings: true,
    validate: false
  } as any)

  // Write the first chunk
  writeStream.write(Buffer.from(chunk1))

  // Check state after first chunk
  console.log('State after chunk 1:', writeStream.state)
  console.log('Strings count after chunk 1:', writeStream.strings.length)

  // Write the second chunk
  writeStream.write(Buffer.from(chunk2))

  // Check state after second chunk
  console.log('State after chunk 2:', writeStream.state)
  console.log('Strings count after chunk 2:', writeStream.strings.length)

  // End the stream
  writeStream.end()

  const result = writeStream.getResult()

  console.log('Final state:', writeStream.state)
  console.log('Final strings count:', result.strings.length)
  console.log('Strings:', result.strings)

  // The test should show that strings are parsed correctly
  expect(result.strings).toContain('<dummy>')
  expect(result.strings).toContain('test string 1')
  expect(result.strings).toContain('test string 2')
  expect(result.strings.length).toBe(3)
})

test('parseFromStream - reproduces issue with locations array ending in middle of chunk', async () => {
  // Create a heap snapshot where the locations array ends in the middle of a chunk
  const heapSnapshotData = `{
    "snapshot": {
      "meta": {
        "node_fields": ["type", "name", "id", "self_size", "edge_count", "trace_node_id", "detachedness"],
        "node_types": [["hidden", "array", "string", "object", "code", "closure", "regexp", "number", "native", "synthetic", "concatenated string", "sliced string", "symbol", "bigint"], ["string", "number"], ["string", "number"], ["number"], ["number"], ["number"], ["number"]],
        "edge_fields": ["type", "name_or_index", "to_node"],
        "edge_types": [["context", "element", "property", "internal", "hidden", "shortcut", "weak"], ["string", "number"], ["node"]],
        "trace_function_info_fields": ["function_id", "name", "script_name", "script_id", "line", "column"],
        "trace_node_fields": ["id", "function_info_index", "count", "size", "children"],
        "sample_fields": ["timestamp_us", "last_assigned_id"],
        "location_fields": ["object_index", "script_id", "line", "column"]
      },
      "node_count": 1,
      "edge_count": 0,
      "trace_function_count": 0,
      "trace_node_count": 0,
      "sample_count": 0,
      "location_count": 2
    },
    "nodes": [1, 0, 1, 0, 0, 0, 0],
    "edges": [],
    "locations": [0, 0, 1, 0, 1, 0, 2, 0],
    "strings": ["<dummy>", "test string 1", "test string 2"]
  }`

  // Split the data so that the locations array ends in the middle of chunk1
  const locationsEndIndex = heapSnapshotData.indexOf('],')
  const chunk1 = heapSnapshotData.substring(0, locationsEndIndex + 2) // Include the "],"
  const chunk2 = heapSnapshotData.substring(locationsEndIndex + 2)

  console.log('Chunk 1 ends with:', chunk1.substring(chunk1.length - 50))
  console.log('Chunk 2 starts with:', chunk2.substring(0, 50))

  const writeStream = createHeapSnapshotWriteStream({
    parseStrings: true,
    validate: false
  } as any)

  // Write the first chunk
  writeStream.write(Buffer.from(chunk1))

  console.log('State after chunk 1:', writeStream.state)
  console.log('Strings count after chunk 1:', writeStream.strings.length)

  // Write the second chunk
  writeStream.write(Buffer.from(chunk2))

  console.log('State after chunk 2:', writeStream.state)
  console.log('Strings count after chunk 2:', writeStream.strings.length)

  // End the stream
  writeStream.end()

  const result = writeStream.getResult()

  console.log('Final state:', writeStream.state)
  console.log('Final strings count:', result.strings.length)
  console.log('Strings:', result.strings)

  // The test should show that strings are parsed correctly
  expect(result.strings).toContain('<dummy>')
  expect(result.strings).toContain('test string 1')
  expect(result.strings).toContain('test string 2')
  expect(result.strings.length).toBe(3)
})

test('parseFromStream - reproduces actual heap snapshot format issue', async () => {
  // Create a heap snapshot that matches the actual format from the real file
  const heapSnapshotData = `{
    "snapshot": {
      "meta": {
        "node_fields": ["type", "name", "id", "self_size", "edge_count", "trace_node_id", "detachedness"],
        "node_types": [["hidden", "array", "string", "object", "code", "closure", "regexp", "number", "native", "synthetic", "concatenated string", "sliced string", "symbol", "bigint"], ["string", "number"], ["string", "number"], ["number"], ["number"], ["number"], ["number"]],
        "edge_fields": ["type", "name_or_index", "to_node"],
        "edge_types": [["context", "element", "property", "internal", "hidden", "shortcut", "weak"], ["string", "number"], ["node"]],
        "trace_function_info_fields": ["function_id", "name", "script_name", "script_id", "line", "column"],
        "trace_node_fields": ["id", "function_info_index", "count", "size", "children"],
        "sample_fields": ["timestamp_us", "last_assigned_id"],
        "location_fields": ["object_index", "script_id", "line", "column"]
      },
      "node_count": 1,
      "edge_count": 0,
      "trace_function_count": 0,
      "trace_node_count": 0,
      "sample_count": 0,
      "location_count": 3
    },
    "nodes": [1, 0, 1, 0, 0, 0, 0],
    "edges": [],
    "locations": [0, 0, 1, 0, 1, 0, 2, 0, 2, 0, 3, 0],
    "strings": ["<dummy>", "", "(GC roots)", "(Bootstrapper)", "(Builtins)"]
  }`

  // Split the data to simulate the actual issue where the locations array ends with numbers
  // and is immediately followed by the strings section
  const locationsEndIndex = heapSnapshotData.indexOf('],')
  const chunk1 = heapSnapshotData.substring(0, locationsEndIndex + 2) // Include the "],"
  const chunk2 = heapSnapshotData.substring(locationsEndIndex + 2)

  console.log('Chunk 1 ends with:', chunk1.substring(chunk1.length - 50))
  console.log('Chunk 2 starts with:', chunk2.substring(0, 50))

  const writeStream = createHeapSnapshotWriteStream({
    parseStrings: true,
    validate: false
  } as any)

  // Write the first chunk
  writeStream.write(Buffer.from(chunk1))

  console.log('State after chunk 1:', writeStream.state)
  console.log('Strings count after chunk 1:', writeStream.strings.length)

  // Write the second chunk
  writeStream.write(Buffer.from(chunk2))

  console.log('State after chunk 2:', writeStream.state)
  console.log('Strings count after chunk 2:', writeStream.strings.length)

  // End the stream
  writeStream.end()

  const result = writeStream.getResult()

  console.log('Final state:', writeStream.state)
  console.log('Final strings count:', result.strings.length)
  console.log('Strings:', result.strings)

  // The test should show that strings are parsed correctly
  expect(result.strings).toContain('<dummy>')
  expect(result.strings).toContain('')
  expect(result.strings).toContain('(GC roots)')
  expect(result.strings).toContain('(Bootstrapper)')
  expect(result.strings).toContain('(Builtins)')
  expect(result.strings.length).toBe(5)
})

test('parseFromStream - reproduces issue with multiple opening brackets before strings array', async () => {
  // Create a heap snapshot that has multiple opening brackets before the strings array
  // This simulates the real issue where the function finds the wrong bracket
  const heapSnapshotData = `{
    "snapshot": {
      "meta": {
        "node_fields": ["type", "name", "id", "self_size", "edge_count", "trace_node_id", "detachedness"],
        "node_types": [["hidden", "array", "string", "object", "code", "closure", "regexp", "number", "native", "synthetic", "concatenated string", "sliced string", "symbol", "bigint"], ["string", "number"], ["string", "number"], ["number"], ["number"], ["number"], ["number"]],
        "edge_fields": ["type", "name_or_index", "to_node"],
        "edge_types": [["context", "element", "property", "internal", "hidden", "shortcut", "weak"], ["string", "number"], ["node"]],
        "trace_function_info_fields": ["function_id", "name", "script_name", "script_id", "line", "column"],
        "trace_node_fields": ["id", "function_info_index", "count", "size", "children"],
        "sample_fields": ["timestamp_us", "last_assigned_id"],
        "location_fields": ["object_index", "script_id", "line", "column"]
      },
      "node_count": 1,
      "edge_count": 0,
      "trace_function_count": 0,
      "trace_node_count": 0,
      "sample_count": 0,
      "location_count": 1
    },
    "nodes": [1, 0, 1, 0, 0, 0, 0],
    "edges": [],
    "locations": [0, 0, 1, 0],
    "strings": ["<dummy>", "test string 1", "test string 2"]
  }`

  // Create a scenario where there are multiple opening brackets in the data
  // This simulates the real heap snapshot where there are many nested arrays
  const largeDataWithBrackets = '['.repeat(1000) + heapSnapshotData + ']'.repeat(1000)

  // Split the data so that the locations array ends and strings begin in the middle
  const locationsEndIndex = largeDataWithBrackets.indexOf('],')
  const chunk1 = largeDataWithBrackets.substring(0, locationsEndIndex + 2) // Include the "],"
  const chunk2 = largeDataWithBrackets.substring(locationsEndIndex + 2)

  console.log('Chunk 1 ends with:', chunk1.substring(chunk1.length - 50))
  console.log('Chunk 2 starts with:', chunk2.substring(0, 50))

  const writeStream = createHeapSnapshotWriteStream({
    parseStrings: true,
    validate: false
  } as any)

  // Write the first chunk
  writeStream.write(Buffer.from(chunk1))

  console.log('State after chunk 1:', writeStream.state)
  console.log('Strings count after chunk 1:', writeStream.strings.length)

  // Write the second chunk
  writeStream.write(Buffer.from(chunk2))

  console.log('State after chunk 2:', writeStream.state)
  console.log('Strings count after chunk 2:', writeStream.strings.length)

  // End the stream
  writeStream.end()

  const result = writeStream.getResult()

  console.log('Final state:', writeStream.state)
  console.log('Final strings count:', result.strings.length)
  console.log('Strings:', result.strings)

  // The test should show that strings are parsed correctly despite multiple brackets
  expect(result.strings).toContain('<dummy>')
  expect(result.strings).toContain('test string 1')
  expect(result.strings).toContain('test string 2')
  expect(result.strings.length).toBe(3)
})
