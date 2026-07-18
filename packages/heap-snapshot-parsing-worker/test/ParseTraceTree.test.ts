import { expect, test } from '@jest/globals'
import { parseFromJson } from '../src/parts/ParseFromJson/ParseFromJson.ts'
import { parseTraceTree } from '../src/parts/ParseTraceTree/ParseTraceTree.ts'

test('flattens nested allocation trace nodes without their children arrays', () => {
  const result = parseTraceTree(
    [
      1,
      4,
      10,
      100,
      [
        [2, 5, 6, 60, []],
        [3, 6, 4, 40, [[4, 7, 1, 10, []]]],
      ],
    ],
    ['id', 'function_info_index', 'count', 'size', 'children'],
  )
  expect([...result]).toEqual([1, 4, 10, 100, 2, 5, 6, 60, 3, 6, 4, 40, 4, 7, 1, 10])
})

test('handles malformed, childless, and field-only trace records', () => {
  expect([...parseTraceTree(null, ['id', 'children'])]).toEqual([])
  expect([...parseTraceTree([1], ['id', 'count', 'children'])]).toEqual([])
  expect([...parseTraceTree([1, 2], ['id', 'count'])]).toEqual([1, 2])
  expect([...parseTraceTree([1, 2, 'not-children'], ['id', 'count', 'children'])]).toEqual([1, 2])
  expect([...parseTraceTree([], [])]).toEqual([])
})

test('streams allocation function info and nested trace tree sections', async () => {
  const result = await parseFromJson({
    snapshot: {
      edge_count: 1,
      meta: {
        edge_fields: ['type', 'name_or_index', 'to_node'],
        edge_types: [['property']],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id'],
        node_types: [['hidden']],
        trace_function_info_fields: ['function_id', 'name', 'script_name', 'script_id', 'line', 'column'],
        trace_node_fields: ['id', 'function_info_index', 'count', 'size', 'children'],
      },
      node_count: 2,
      trace_function_count: 2,
    },
    nodes: [0, 0, 1, 0, 1, 1, 0, 0, 2, 48, 0, 2],
    edges: [0, 0, 6],
    trace_function_infos: [1, 1, 2, 10, 4, 8, 2, 1, 2, 10, 5, 9],
    trace_tree: [1, 0, 2, 48, [[2, 1, 1, 48, []]]],
    locations: [],
    strings: ['', 'allocate', 'file:///src/vs/editor/model.ts'],
  })

  expect([...result.traceFunctionInfos]).toEqual([1, 1, 2, 10, 4, 8, 2, 1, 2, 10, 5, 9])
  expect([...result.traceTree]).toEqual([1, 0, 2, 48, 2, 1, 1, 48])
})
