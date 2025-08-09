import { test, expect } from '@jest/globals'
import { examineNodeById, examineNodeByIndex } from '../src/parts/ExamineNode/ExamineNode.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('examineNode - should examine node with edges and properties', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Object with 2 properties
      // [type, name, id, self_size, edge_count]
      3, 0, 1, 100, 2,   // object "Object" id=1 size=100 edges=2
      
      // Node 1: String "hello"
      // [type, name, id, self_size, edge_count]  
      2, 1, 2, 50, 0,    // string "hello" id=2 size=50 edges=0
      
      // Node 2: String "world"
      // [type, name, id, self_size, edge_count]
      2, 2, 3, 30, 0,    // string "world" id=3 size=30 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: Object["prop1"] -> "hello"
      // [type, name_or_index, to_node]
      2, 3, 5,   // property "prop1" -> "hello" (offset 5)
      
      // Edge 1: Object["prop2"] -> "world"
      // [type, name_or_index, to_node]  
      2, 4, 10,  // property "prop2" -> "world" (offset 10)
    ]),
    strings: ['Object', 'hello', 'world', 'prop1', 'prop2'],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  // Examine Node 0
  const result = examineNodeByIndex(0, snapshot)

  expect(result).not.toBeNull()
  expect(result!.nodeIndex).toBe(0)
  expect(result!.nodeName).toBe('Object')
  expect(result!.nodeType).toBe('object')
  expect(result!.edges).toHaveLength(2)

  // Check first edge
  expect(result!.edges[0]).toEqual({
    type: 2,
    typeName: 'property',
    nameIndex: 3,
    edgeName: 'prop1',
    toNode: 5,
    targetNodeInfo: {
      name: 'hello',
      type: 'string',
    },
  })

  // Check second edge
  expect(result!.edges[1]).toEqual({
    type: 2,
    typeName: 'property',
    nameIndex: 4,
    edgeName: 'prop2',
    toNode: 10,
    targetNodeInfo: {
      name: 'world',
      type: 'string',
    },
  })

  // Check properties
  expect(result!.properties).toHaveLength(2)
  expect(result!.properties[0]).toEqual({
    name: 'prop1',
    value: '"hello"',
    targetType: 'string',
  })
  expect(result!.properties[1]).toEqual({
    name: 'prop2',
    value: '"world"',
    targetType: 'string',
  })
})

test('examineNode - should handle node with no edges', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: String with no edges
      // [type, name, id, self_size, edge_count]
      0, 0, 1, 50, 0,   // string "test" id=1 size=50 edges=0
    ]),
    edges: new Uint32Array([]),
    strings: ['test'],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['string']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const result = examineNodeByIndex(0, snapshot)

  expect(result).not.toBeNull()
  expect(result!.nodeIndex).toBe(0)
  expect(result!.nodeName).toBe('test')
  expect(result!.nodeType).toBe('string')
  expect(result!.edges).toHaveLength(0)
  expect(result!.properties).toHaveLength(0)
})

test('examineNode - should return null for invalid node index', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings: [],
    locations: new Uint32Array([]),
    meta: {
      node_types: [[]],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [[]],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const result = examineNodeByIndex(0, snapshot)
  expect(result).toBeNull()
})

test('examineNodeById - should find and examine node by ID 67', () => {
  // Create a test snapshot where we have a node with ID 67
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: String "node_0"
      // [type, name, id, self_size, edge_count]
      2, 0, 1, 50, 0,     // string "node_0" id=1 size=50 edges=0
      
      // Node 1: String "node_1"  
      // [type, name, id, self_size, edge_count]
      2, 1, 2, 50, 0,     // string "node_1" id=2 size=50 edges=0
      
      // Node 2: Object with ID 67 (target node)
      // [type, name, id, self_size, edge_count]
      3, 2, 67, 100, 2,   // object "Object" id=67 size=100 edges=2
      
      // Node 3: String "node_3"
      // [type, name, id, self_size, edge_count]
      2, 3, 68, 50, 0,    // string "node_3" id=68 size=50 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: Object["prop1"] -> "node_0"
      // [type, name_or_index, to_node]
      2, 4, 0,   // property "prop1" -> node_0 (offset 0)
      
      // Edge 1: Object["prop2"] -> "node_1"
      // [type, name_or_index, to_node]
      2, 5, 5,   // property "prop2" -> node_1 (offset 5)
    ]),
    strings: ['node_0', 'node_1', 'Object', 'node_3', 'prop1', 'prop2'],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint', 'object shape']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  // Examine Node with ID 67
  const result = examineNodeById(67, snapshot)

  expect(result).not.toBeNull()
  expect(result!.nodeIndex).toBe(2) // Should be at node index 2
  expect(result!.nodeId).toBe(67) // Should have ID 67
  expect(result!.nodeName).toBe('Object')
  expect(result!.nodeType).toBe('object')
  expect(result!.edges).toHaveLength(2)

  console.log('Node ID 67 examination result:', JSON.stringify(result, null, 2))
})
