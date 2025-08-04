import { test, expect } from '@jest/globals'
import { getArraysByClosureLocationFromHeapSnapshotInternal } from '../src/parts/GetArraysByClosureLocationFromHeapSnapshotInternal/GetArraysByClosureLocationFromHeapSnapshotInternal.js'

test('should group arrays by closure location', () => {
  const strings = ['Array', 'items', 'data', 'cache']
  const node_types = [['object', 'string', 'number']]
  const node_fields = ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness']
  const edge_types = [['property', 'element']]
  const edge_fields = ['type', 'name_or_index', 'to_node']
  
  // Mock nodes: [type, name, id, self_size, edge_count, trace_node_id, detachedness]
  const nodes = [
    0, 0, 1, 100, 2, 1, 0, // Array 1 - trace_node_id = 1
    0, 0, 2, 200, 1, 1, 0, // Array 2 - trace_node_id = 1 (same location)
    0, 0, 3, 150, 1, 2, 0, // Array 3 - trace_node_id = 2 (different location)
  ]
  
  // Mock edges: [type, name_or_index, to_node]
  const edges = [
    0, 1, 0, // property edge to Array 1
    0, 2, 0, // property edge to Array 1
    0, 1, 1, // property edge to Array 2
    0, 1, 2, // property edge to Array 3
  ]
  
  const parsedNodes = [
    { type: 'object', name: 'Array', id: 1, selfSize: 100, edgeCount: 2, traceNodeId: 1, detachedness: 0 },
    { type: 'object', name: 'Array', id: 2, selfSize: 200, edgeCount: 1, traceNodeId: 1, detachedness: 0 },
    { type: 'object', name: 'Array', id: 3, selfSize: 150, edgeCount: 1, traceNodeId: 2, detachedness: 0 },
  ]
  
  // Mock locations: [object_index, script_id, line, column]
  const locations = [
    7, 1, 10, 5, // object_index = 1 (7/7), script_id = 1, line = 10, column = 5
    14, 2, 15, 8, // object_index = 2 (14/7), script_id = 2, line = 15, column = 8
  ]
  
  const scriptMap = {
    1: { url: 'file:///test1.js', sourceMapUrl: '' },
    2: { url: 'file:///test2.js', sourceMapUrl: '' },
  }
  
  const locationFields = ['object_index', 'script_id', 'line', 'column']
  const result = getArraysByClosureLocationFromHeapSnapshotInternal(
    strings,
    nodes,
    node_types,
    node_fields,
    edges,
    edge_types,
    edge_fields,
    parsedNodes,
    locations,
    locationFields,
    scriptMap,
  )
  
  expect(result).toHaveLength(2)
  
  // First group should be location 1 with 2 arrays
  const firstGroup = result[0]
  expect(firstGroup.locationKey).toBe('1:10:5')
  expect(firstGroup.count).toBe(2)
  expect(firstGroup.totalSize).toBe(300) // 100 + 200
  expect(firstGroup.avgSize).toBe(150)
  expect(firstGroup.locationInfo).toEqual({
    scriptId: 1,
    line: 10,
    column: 5,
    url: 'file:///test1.js',
    sourceMapUrl: '',
  })
  
  // Second group should be location 2 with 1 array
  const secondGroup = result[1]
  expect(secondGroup.locationKey).toBe('2:15:8')
  expect(secondGroup.count).toBe(1)
  expect(secondGroup.totalSize).toBe(150)
  expect(secondGroup.avgSize).toBe(150)
  expect(secondGroup.locationInfo).toEqual({
    scriptId: 2,
    line: 15,
    column: 8,
    url: 'file:///test2.js',
    sourceMapUrl: '',
  })
})

test('should handle arrays without trace_node_id', () => {
  const strings = ['Array']
  const node_types = [['object']]
  const node_fields = ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness']
  const edge_types = [['property']]
  const edge_fields = ['type', 'name_or_index', 'to_node']
  
  // Mock nodes: [type, name, id, self_size, edge_count, trace_node_id, detachedness]
  const nodes = [
    0, 0, 1, 100, 0, 0, 0, // Array with trace_node_id = 0 (no location)
  ]
  
  const edges = []
  const parsedNodes = [
    { type: 'object', name: 'Array', id: 1, selfSize: 100, edgeCount: 0, traceNodeId: 0, detachedness: 0 },
  ]
  
  const locations = []
  const scriptMap = {}
  
  const locationFields = ['object_index', 'script_id', 'line', 'column']
  const result = getArraysByClosureLocationFromHeapSnapshotInternal(
    strings,
    nodes,
    node_types,
    node_fields,
    edges,
    edge_types,
    edge_fields,
    parsedNodes,
    locations,
    locationFields,
    scriptMap,
  )
  
  expect(result).toHaveLength(1)
  expect(result[0].locationKey).toBe('unknown')
  expect(result[0].count).toBe(1)
  expect(result[0].totalSize).toBe(100)
})

test('should filter out internal arrays', () => {
  const strings = ['Array', 'initial_array_prototype']
  const node_types = [['object']]
  const node_fields = ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness']
  const edge_types = [['property']]
  const edge_fields = ['type', 'name_or_index', 'to_node']
  
  // Mock nodes: [type, name, id, self_size, edge_count, trace_node_id, detachedness]
  const nodes = [
    0, 0, 1, 100, 1, 1, 0, // Regular Array
    0, 1, 2, 200, 1, 1, 0, // Internal Array (initial_array_prototype)
  ]
  
  // Mock edges: [type, name_or_index, to_node]
  const edges = [
    0, 0, 0, // property edge to regular Array
    0, 0, 1, // property edge to internal Array
  ]
  
  const parsedNodes = [
    { type: 'object', name: 'Array', id: 1, selfSize: 100, edgeCount: 1, traceNodeId: 1, detachedness: 0 },
    { type: 'object', name: 'initial_array_prototype', id: 2, selfSize: 200, edgeCount: 1, traceNodeId: 1, detachedness: 0 },
  ]
  
  // Mock locations: [object_index, script_id, line, column]
  const locations = [
    7, 1, 10, 5, // object_index = 1 (7/7), script_id = 1, line = 10, column = 5
  ]
  
  const scriptMap = {
    1: { url: 'file:///test.js', sourceMapUrl: '' },
  }
  
  const locationFields = ['object_index', 'script_id', 'line', 'column']
  const result = getArraysByClosureLocationFromHeapSnapshotInternal(
    strings,
    nodes,
    node_types,
    node_fields,
    edges,
    edge_types,
    edge_fields,
    parsedNodes,
    locations,
    locationFields,
    scriptMap,
  )
  
  expect(result).toHaveLength(1)
  expect(result[0].count).toBe(1) // Only the regular array, internal array filtered out
  expect(result[0].totalSize).toBe(100) // Only the regular array size
}) 