import { test, expect } from '@jest/globals'
import { getNodeName } from '../src/parts/GetNodeName/GetNodeName.ts'
import { getActualValue } from '../src/parts/GetActualValue/GetActualValue.ts'
import { examineNodeByIndex } from '../src/parts/ExamineNode/ExamineNode.ts'
import { createEdgeMap } from '../src/parts/CreateEdgeMap/CreateEdgeMap.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('getNodeName - should handle empty strings correctly', () => {
  const strings = ['', 'hello', 'world']

  // Test empty string at index 0
  const emptyStringNode = { name: 0 }
  expect(getNodeName(emptyStringNode, strings)).toBe('')

  // Test regular strings
  const helloNode = { name: 1 }
  expect(getNodeName(helloNode, strings)).toBe('hello')

  // Test invalid index
  const invalidNode = { name: 10 }
  expect(getNodeName(invalidNode, strings)).toBeNull()
})

test('getActualValue - should properly display string values', () => {
  const strings = ['', 'hello', 'world', 'test value']
  
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 0,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([]),
    edges: new Uint32Array([]),
    strings,
    locations: new Uint32Array([]),
    meta: {
      node_types: [['string', 'object']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

  // Test empty string
  const emptyStringNode = { type: 0, name: 0, id: 1 }
  expect(getActualValue(emptyStringNode, snapshot, edgeMap)).toBe('')

  // Test regular string
  const helloNode = { type: 0, name: 1, id: 2 }
  expect(getActualValue(helloNode, snapshot, edgeMap)).toBe('hello')

  // Test string with spaces
  const testValueNode = { type: 0, name: 3, id: 3 }
  expect(getActualValue(testValueNode, snapshot, edgeMap)).toBe('test value')
})

test('examineNode - should show improved string property values', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 4,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Object with 3 properties
      // [type, name, id, self_size, edge_count]
      0, 0, 1, 100, 3,   // object "Object" id=1 size=100 edges=3
      
      // Node 1: empty string
      // [type, name, id, self_size, edge_count]
      1, 1, 77, 0, 0,    // string "" id=77 size=0 edges=0
      
      // Node 2: hello string
      // [type, name, id, self_size, edge_count]
      1, 2, 78, 10, 0,   // string "hello" id=78 size=10 edges=0
      
      // Node 3: long text string
      // [type, name, id, self_size, edge_count]
      1, 5, 79, 20, 0,   // string "longText" id=79 size=20 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: Object["emptyProp"] -> empty string
      // [type, name_or_index, to_node]
      0, 3, 5,   // property "emptyProp" -> "" (offset 5)
      
      // Edge 1: Object["helloProp"] -> hello string
      // [type, name_or_index, to_node]
      0, 4, 10,  // property "helloProp" -> "hello" (offset 10)
      
      // Edge 2: Object["textProp"] -> long text string  
      // [type, name_or_index, to_node]
      0, 5, 15,  // property "textProp" -> "longText" (offset 15)
    ]),
    strings: ['Object', '', 'hello', 'emptyProp', 'helloProp', 'longText'],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['object', 'string']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  // Examine the object (node index 0)
  const result = examineNodeByIndex(0, snapshot)

  expect(result).not.toBeNull()
  expect(result!.nodeType).toBe('object')
  expect(result!.properties).toHaveLength(3)

  // Check the empty string property
  const emptyProp = result!.properties.find((p) => p.name === 'emptyProp')
  expect(emptyProp).toBeDefined()
  expect(emptyProp!.value).toBe('""')
  expect(emptyProp!.targetType).toBe('string')

  // Check the hello string property
  const helloProp = result!.properties.find((p) => p.name === 'helloProp')
  expect(helloProp).toBeDefined()
  expect(helloProp!.value).toBe('"hello"')
  expect(helloProp!.targetType).toBe('string')

  // Check the long text property
  const textProp = result!.properties.find((p) => p.name === 'longText')
  expect(textProp).toBeDefined()
  expect(textProp!.value).toBe('"longText"')
  expect(textProp!.targetType).toBe('string')

  console.log('\n=== IMPROVED STRING PROPERTY ANALYSIS ===')
  console.log('String properties with proper values:')
  result!.properties.forEach((prop) => {
    console.log(`  ${prop.name}: ${prop.value} (${prop.targetType})`)
  })
})
