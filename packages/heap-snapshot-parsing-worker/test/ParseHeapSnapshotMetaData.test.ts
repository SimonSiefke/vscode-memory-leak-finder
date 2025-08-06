import { test, expect } from '@jest/globals'
import { parseHeapSnapshotMetaData, EMPTY_DATA } from '../src/parts/ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.ts'

test('parseHeapSnapshotMetaData - parses valid snapshot metadata', () => {
  const data =
    '{"snapshot":{"meta":{"node_fields":["type","name","id"],"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},"node_count":1,"edge_count":0}}'

  const result = parseHeapSnapshotMetaData(data)

  expect(result.couldParse).toBe(true)
  expect(result.endIndex).toBeGreaterThan(0)
  expect(result.data).toHaveProperty('meta')
  expect(result.data).toHaveProperty('node_count', 1)
  expect(result.data).toHaveProperty('edge_count', 0)
  expect(result.data.meta).toHaveProperty('node_fields')
  expect(result.data.meta).toHaveProperty('node_types')
  expect(result.data.meta).toHaveProperty('edge_fields')
  expect(result.data.meta).toHaveProperty('edge_types')
  expect(result.data.meta).toHaveProperty('location_fields')
})

test('parseHeapSnapshotMetaData - returns EMPTY_DATA when snapshot token not found', () => {
  const data = '{"other":{"meta":{}}}'

  const result = parseHeapSnapshotMetaData(data)

  expect(result).toBe(EMPTY_DATA)
  expect(result.couldParse).toBe(false)
  expect(result.endIndex).toBe(-1)
})

test('parseHeapSnapshotMetaData - returns EMPTY_DATA for empty string', () => {
  const data = ''

  const result = parseHeapSnapshotMetaData(data)

  expect(result).toBe(EMPTY_DATA)
  expect(result.couldParse).toBe(false)
  expect(result.endIndex).toBe(-1)
})

test('parseHeapSnapshotMetaData - returns EMPTY_DATA for malformed JSON', () => {
  const data = '{"snapshot":{"meta":{'

  const result = parseHeapSnapshotMetaData(data)

  expect(result).toBe(EMPTY_DATA)
  expect(result.couldParse).toBe(false)
  expect(result.endIndex).toBe(-1)
})

test('parseHeapSnapshotMetaData - handles snapshot with nested objects', () => {
  const data =
    '{"snapshot":{"meta":{"node_fields":["type","name","id"],"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},"node_count":2,"edge_count":1,"trace_function_count":0,"trace_node_count":0,"sample_count":0,"timestamp":1234567890}}'

  const result = parseHeapSnapshotMetaData(data)

  expect(result.couldParse).toBe(true)
  expect(result.endIndex).toBeGreaterThan(0)
  expect(result.data).toHaveProperty('node_count', 2)
  expect(result.data).toHaveProperty('edge_count', 1)
  expect(result.data).toHaveProperty('timestamp', 1234567890)
})

test('parseHeapSnapshotMetaData - handles snapshot with arrays in metadata', () => {
  const data =
    '{"snapshot":{"meta":{"node_fields":["type","name","id","self_size","edge_count","trace_node_id","detachedness"],"node_types":[["hidden","array","string","object","code","closure","regexp","number","native","synthetic","concatenated string","sliced string"],["","Array","String","Object","Code","Closure","RegExp","Number","Native","Synthetic","ConcatenatedString","SlicedString"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal","hidden","shortcut","weak"],["","","","","","",""]],"location_fields":["object_index","script_id","line","column"]},"node_count":100,"edge_count":200}}'

  const result = parseHeapSnapshotMetaData(data)

  expect(result.couldParse).toBe(true)
  expect(result.endIndex).toBeGreaterThan(0)
  expect(result.data).toHaveProperty('node_count', 100)
  expect(result.data).toHaveProperty('edge_count', 200)
  expect(result.data.meta.node_types).toHaveLength(2)
  expect(result.data.meta.edge_types).toHaveLength(2)
})

test('parseHeapSnapshotMetaData - handles snapshot with empty metadata', () => {
  const data = '{"snapshot":{"meta":{},"node_count":0,"edge_count":0}}'

  const result = parseHeapSnapshotMetaData(data)

  expect(result.couldParse).toBe(true)
  expect(result.endIndex).toBeGreaterThan(0)
  expect(result.data).toHaveProperty('node_count', 0)
  expect(result.data).toHaveProperty('edge_count', 0)
  expect(result.data.meta).toEqual({})
})

test('parseHeapSnapshotMetaData - handles snapshot with missing metadata fields', () => {
  const data = '{"snapshot":{"meta":{"node_fields":["type","name","id"]},"node_count":1,"edge_count":0}}'

  const result = parseHeapSnapshotMetaData(data)

  expect(result.couldParse).toBe(true)
  expect(result.endIndex).toBeGreaterThan(0)
  expect(result.data).toHaveProperty('node_count', 1)
  expect(result.data).toHaveProperty('edge_count', 0)
  expect(result.data.meta).toHaveProperty('node_fields')
  expect(result.data.meta.node_fields).toEqual(['type', 'name', 'id'])
})

test('parseHeapSnapshotMetaData - handles snapshot with numeric values in metadata', () => {
  const data =
    '{"snapshot":{"meta":{"node_fields":["type","name","id"],"node_types":[["hidden","array","string","object"]],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal"]],"location_fields":["object_index","script_id","line","column"]},"node_count":1,"edge_count":0,"max_js_object_id":12345}}'

  const result = parseHeapSnapshotMetaData(data)

  expect(result.couldParse).toBe(true)
  expect(result.endIndex).toBeGreaterThan(0)
  expect(result.data).toHaveProperty('max_js_object_id', 12345)
})
