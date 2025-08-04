import { test, expect } from '@jest/globals'
import { parseHeapSnapshotMetaDataIndices, EMPTY_DATA } from '../src/parts/ParseHeapSnapshotMetaDataIndices/ParseHeapSnapshotMetaDataIndices.js'

test('parseHeapSnapshotMetaDataIndices - finds snapshot metadata indices', () => {
  const data = '{"snapshot":{"meta":{"node_fields":["type","name","id"],"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},"node_count":1,"edge_count":0}}'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result.startIndex).toBeGreaterThan(0)
  expect(result.endIndex).toBeGreaterThan(result.startIndex)
  expect(result.startIndex).toBe(data.indexOf('"snapshot":') + '"snapshot":'.length)
})

test('parseHeapSnapshotMetaDataIndices - returns EMPTY_DATA when snapshot token not found', () => {
  const data = '{"other":{"meta":{}}}'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result).toBe(EMPTY_DATA)
  expect(result.startIndex).toBe(-1)
  expect(result.endIndex).toBe(-1)
})

test('parseHeapSnapshotMetaDataIndices - returns EMPTY_DATA for empty string', () => {
  const data = ''

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result).toBe(EMPTY_DATA)
  expect(result.startIndex).toBe(-1)
  expect(result.endIndex).toBe(-1)
})

test('parseHeapSnapshotMetaDataIndices - returns EMPTY_DATA for malformed JSON', () => {
  const data = '{"snapshot":{"meta":{'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result).toBe(EMPTY_DATA)
  expect(result.startIndex).toBe(-1)
  expect(result.endIndex).toBe(-1)
})

test('parseHeapSnapshotMetaDataIndices - handles snapshot with nested objects', () => {
  const data = '{"snapshot":{"meta":{"node_fields":["type","name","id"],"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},"node_count":2,"edge_count":1,"trace_function_count":0,"trace_node_count":0,"sample_count":0,"timestamp":1234567890}}'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result.startIndex).toBeGreaterThan(0)
  expect(result.endIndex).toBeGreaterThan(result.startIndex)
  expect(result.endIndex).toBe(data.length - 1) // -1 because the function returns the position after the closing brace
})

test('parseHeapSnapshotMetaDataIndices - handles snapshot with arrays in metadata', () => {
  const data = '{"snapshot":{"meta":{"node_fields":["type","name","id","self_size","edge_count","trace_node_id","detachedness"],"node_types":[["hidden","array","string","object","code","closure","regexp","number","native","synthetic","concatenated string","sliced string"],["","Array","String","Object","Code","Closure","RegExp","Number","Native","Synthetic","ConcatenatedString","SlicedString"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal","hidden","shortcut","weak"],["","","","","","",""]],"location_fields":["object_index","script_id","line","column"]},"node_count":100,"edge_count":200}}'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result.startIndex).toBeGreaterThan(0)
  expect(result.endIndex).toBeGreaterThan(result.startIndex)
  expect(result.endIndex).toBe(data.length - 1) // -1 because the function returns the position after the closing brace
})

test('parseHeapSnapshotMetaDataIndices - handles data with prefix', () => {
  const data = 'prefix{"snapshot":{"meta":{"node_fields":["type","name","id"],"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},"node_count":1,"edge_count":0}}'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result.startIndex).toBeGreaterThan(0)
  expect(result.endIndex).toBeGreaterThan(result.startIndex)
  expect(result.startIndex).toBe(data.indexOf('"snapshot":') + '"snapshot":'.length)
})

test('parseHeapSnapshotMetaDataIndices - handles data with suffix', () => {
  const data = '{"snapshot":{"meta":{"node_fields":["type","name","id"],"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},"node_count":1,"edge_count":0}}suffix'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result.startIndex).toBeGreaterThan(0)
  expect(result.endIndex).toBeGreaterThan(result.startIndex)
  expect(result.endIndex).toBe(data.length - 'suffix'.length - 1) // -1 because the function returns the position after the closing brace
})

test('parseHeapSnapshotMetaDataIndices - handles snapshot with empty metadata', () => {
  const data = '{"snapshot":{"meta":{},"node_count":0,"edge_count":0}}'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result.startIndex).toBeGreaterThan(0)
  expect(result.endIndex).toBeGreaterThan(result.startIndex)
  expect(result.endIndex).toBe(data.length - 1) // -1 because the function returns the position after the closing brace
})

test('parseHeapSnapshotMetaDataIndices - handles snapshot with missing metadata fields', () => {
  const data = '{"snapshot":{"meta":{"node_fields":["type","name","id"]},"node_count":1,"edge_count":0}}'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result.startIndex).toBeGreaterThan(0)
  expect(result.endIndex).toBeGreaterThan(result.startIndex)
  expect(result.endIndex).toBe(data.length - 1) // -1 because the function returns the position after the closing brace
})

test('parseHeapSnapshotMetaDataIndices - handles snapshot with string values', () => {
  const data = '{"snapshot":{"meta":{"node_fields":["type","name","id"],"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},"node_count":1,"edge_count":0,"description":"Test heap snapshot"}}'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result.startIndex).toBeGreaterThan(0)
  expect(result.endIndex).toBeGreaterThan(result.startIndex)
  expect(result.endIndex).toBe(data.length - 1) // -1 because the function returns the position after the closing brace
})

test('parseHeapSnapshotMetaDataIndices - handles snapshot with numeric values', () => {
  const data = '{"snapshot":{"meta":{"node_fields":["type","name","id"],"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},"node_count":1,"edge_count":0,"max_js_object_id":12345}}'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result.startIndex).toBeGreaterThan(0)
  expect(result.endIndex).toBeGreaterThan(result.startIndex)
  expect(result.endIndex).toBe(data.length - 1) // -1 because the function returns the position after the closing brace
})

test('parseHeapSnapshotMetaDataIndices - handles snapshot with quoted strings containing brackets', () => {
  const data = '{"snapshot":{"meta":{"node_fields":["type","name","id"],"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},"node_count":1,"edge_count":0,"description":"Test with {brackets} and [arrays]"}}'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result.startIndex).toBeGreaterThan(0)
  expect(result.endIndex).toBeGreaterThan(result.startIndex)
  expect(result.endIndex).toBe(data.length - 1) // -1 because the function returns the position after the closing brace
})

test('parseHeapSnapshotMetaDataIndices - handles snapshot with escaped quotes', () => {
  const data = '{"snapshot":{"meta":{"node_fields":["type","name","id"],"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},"node_count":1,"edge_count":0,"description":"Test with \\"quotes\\""}}'

  const result = parseHeapSnapshotMetaDataIndices(data)

  expect(result.startIndex).toBeGreaterThan(0)
  expect(result.endIndex).toBeGreaterThan(result.startIndex)
  expect(result.endIndex).toBe(data.length - 1) // -1 because the function returns the position after the closing brace
})