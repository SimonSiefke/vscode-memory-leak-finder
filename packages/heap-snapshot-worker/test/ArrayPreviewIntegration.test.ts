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
      3,
      0,
      1,
      100,
      1,
      0,
      0, // type=3 (object), name=0 ("BenchmarkObject"), id=1, selfSize=100, edgeCount=1, trace_node_id=0, detachedness=0
      // Node 1: Array object
      3,
      1,
      2,
      80,
      1,
      0,
      0, // type=3 (object), name=1 ("Array"), id=2, selfSize=80, edgeCount=1, trace_node_id=0, detachedness=0
      // Node 2: First array element (object)
      3,
      3,
      3,
      50,
      2,
      0,
      0, // type=3 (object), name=3 ("Object"), id=3, selfSize=50, edgeCount=2, trace_node_id=0, detachedness=0
      // Node 3: String "editor.fontsize"
      2,
      4,
      4,
      30,
      0,
      0,
      0, // type=2 (string), name=4 ("editor.fontsize"), id=4, selfSize=30, edgeCount=0, trace_node_id=0, detachedness=0
      // Node 4: String "the fontsize of the editor"
      2,
      5,
      5,
      40,
      0,
      0,
      0, // type=2 (string), name=5 ("the fontsize of the editor"), id=5, selfSize=40, edgeCount=0, trace_node_id=0, detachedness=0
    ]),
    edges: new Uint32Array([
      // Node 0's edges (BenchmarkObject has 1 edge)
      2,
      2,
      7, // Edge 0: BenchmarkObject["filteredItems"] -> Array (toNode=7 = node 1 * 7)

      // Node 1's edges (Array has 1 edge)
      1,
      0,
      14, // Edge 1: Array[0] -> Object (toNode=14 = node 2 * 7)

      // Node 2's edges (Object has 2 edges)
      2,
      6,
      21, // Edge 2: Object["id"] -> String "editor.fontsize" (toNode=21 = node 3 * 7)
      2,
      7,
      28, // Edge 3: Object["description"] -> String "the fontsize of the editor" (toNode=28 = node 4 * 7)

      // Node 3 and 4 have no edges (strings)
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
