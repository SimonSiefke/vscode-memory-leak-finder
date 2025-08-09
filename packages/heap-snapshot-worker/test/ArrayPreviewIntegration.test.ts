import { test, expect } from '@jest/globals'
import { getObjectsWithPropertiesInternal } from '../src/parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('should show array contents in property preview at depth > 1', () => {
  // Create a snapshot where an object has a property "filteredItems" that points to an array
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 5,
    edge_count: 4,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Object with property "filteredItems"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 0, 1, 100, 1, 0, 0,   // object "BenchmarkObject" id=1 size=100 edges=1
      
      // Node 1: Array object
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 1, 2, 80, 1, 0, 0,    // object "Array" id=2 size=80 edges=1
      
      // Node 2: First array element (object)
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 3, 3, 50, 2, 0, 0,    // object "Object" id=3 size=50 edges=2
      
      // Node 3: String "editor.fontsize"  
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      2, 4, 4, 30, 0, 0, 0,    // string "editor.fontsize" id=4 size=30 edges=0
      
      // Node 4: String "the fontsize of the editor"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      2, 5, 5, 40, 0, 0, 0,    // string "the fontsize of the editor" id=5 size=40 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: BenchmarkObject["filteredItems"] -> Array
      // [type, name_or_index, to_node]
      2, 2, 7,   // property "filteredItems" -> Array (offset 7)

      // Edge 1: Array[0] -> Object  
      // [type, name_or_index, to_node]
      1, 0, 14,  // element index=0 -> Object (offset 14)

      // Edge 2: Object["id"] -> String "editor.fontsize"
      // [type, name_or_index, to_node]
      2, 6, 21,  // property "id" -> "editor.fontsize" (offset 21)
      
      // Edge 3: Object["description"] -> String "the fontsize of the editor"  
      // [type, name_or_index, to_node]
      2, 7, 28,  // property "description" -> "the fontsize of the editor" (offset 28)
    ]),
    strings: [
      'BenchmarkObject', // 0
      'Array', // 1
      'filteredItems', // 2
      'Object', // 3
      'editor.fontsize', // 4
      'the fontsize of the editor', // 5
      'id', // 6
      'description', // 7
    ],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  // Test with depth=3 to see array contents and object properties inside
  const result = getObjectsWithPropertiesInternal(snapshot, 'filteredItems', 3)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'BenchmarkObject',
    propertyValue: '[Object 2]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      filteredItems: [
        {
          id: 'editor.fontsize',
          description: 'the fontsize of the editor',
        },
      ],
    },
  })
})

test('should show simple array contents with primitive values', () => {
  // Create a snapshot where an object has a property that points to an array of strings
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 4,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Object with property "items"
      3,
      0,
      1,
      100,
      1,
      0,
      0, // type=3 (object), name=0 ("TestObject"), id=1, selfSize=100, edgeCount=1, trace_node_id=0, detachedness=0
      // Node 1: Array object
      3,
      1,
      2,
      80,
      2,
      0,
      0, // type=3 (object), name=1 ("Array"), id=2, selfSize=80, edgeCount=2, trace_node_id=0, detachedness=0
      // Node 2: String "hello"
      2,
      3,
      3,
      30,
      0,
      0,
      0, // type=2 (string), name=3 ("hello"), id=3, selfSize=30, edgeCount=0, trace_node_id=0, detachedness=0
      // Node 3: String "world"
      2,
      4,
      4,
      30,
      0,
      0,
      0, // type=2 (string), name=4 ("world"), id=4, selfSize=30, edgeCount=0, trace_node_id=0, detachedness=0
    ]),
    edges: new Uint32Array([
      // Edge 0: TestObject["items"] -> Array
      2,
      2,
      7, // type=2 (property), name=2 ("items"), toNode=7 (node 1 * 7)

      // Edges for Array elements
      // Edge 1: Array[0] -> String "hello"
      1,
      0,
      14, // type=1 (element), nameOrIndex=0 (array index), toNode=14 (node 2 * 7)
      // Edge 2: Array[1] -> String "world"
      1,
      1,
      21, // type=1 (element), nameOrIndex=1 (array index), toNode=21 (node 3 * 7)
    ]),
    strings: [
      'TestObject', // 0
      'Array', // 1
      'items', // 2
      'hello', // 3
      'world', // 4
    ],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  // Test with depth=2 to see array contents
  const result = getObjectsWithPropertiesInternal(snapshot, 'items', 2)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'TestObject',
    propertyValue: '[Object 2]',
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      items: ['hello', 'world'],
    },
  })
})
