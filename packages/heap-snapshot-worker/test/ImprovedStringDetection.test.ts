import { test, expect } from '@jest/globals'
import { getNodeName } from '../src/parts/GetNodeName/GetNodeName.ts'
import { getActualValue } from '../src/parts/GetActualValue/GetActualValue.ts'
import { examineNodeByIndex } from '../src/parts/ExamineNode/ExamineNode.ts'
import { createEdgeMap } from '../src/parts/CreateEdgeMap/CreateEdgeMap.ts'
import { createTestSnapshot } from './helpers/createTestSnapshot.ts'

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
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const nodeTypes: [readonly string[]] = [['string', 'object']]
  const strings = ['', 'hello', 'world', 'test value']

  const snapshot = createTestSnapshot(
    new Uint32Array([]),
    new Uint32Array([]),
    strings,
    nodeFields,
    ['type', 'name_or_index', 'to_node'],
    nodeTypes,
    [['property']]
  )

  const edgeMap = createEdgeMap(snapshot.nodes, nodeFields)

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
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const nodeTypes: [readonly string[]] = [['object', 'string']]
  const edgeTypes: [readonly string[]] = [['property']]
  const strings = ['Object', '', 'hello', 'emptyProp', 'helloProp', 'longText']

  // Create nodes:
  // 0: Object with 3 properties
  // 1: empty string
  // 2: hello string
  // 3: long text string
  const nodes = new Uint32Array([
    // Node 0: Object
    0, 0, 1, 100, 3,    // type=object, name=Object, id=1, size=100, edges=3
    // Node 1: empty string
    1, 1, 77, 0, 0,     // type=string, name='', id=77, size=0, edges=0
    // Node 2: hello string
    1, 2, 78, 10, 0,    // type=string, name=hello, id=78, size=10, edges=0
    // Node 3: long text string
    1, 5, 79, 20, 0     // type=string, name=longText, id=79, size=20, edges=0
  ])

  // Create edges: Object has 3 property edges
  const edges = new Uint32Array([
    // Edge 0: emptyProp -> empty string (node 1)
    0, 3, 5,    // type=property, name=emptyProp, to_node=5 (node 1)
    // Edge 1: helloProp -> hello string (node 2)
    0, 4, 10,   // type=property, name=helloProp, to_node=10 (node 2)
    // Edge 2: textProp -> long text string (node 3)
    0, 5, 15    // type=property, name=textProp, to_node=15 (node 3)
  ])

  const snapshot = createTestSnapshot(
    nodes,
    edges,
    strings,
    nodeFields,
    edgeFields,
    nodeTypes,
    edgeTypes
  )

  // Examine the object (node index 0)
  const result = examineNodeByIndex(0, snapshot)

  expect(result).not.toBeNull()
  expect(result!.nodeType).toBe('object')
  expect(result!.properties).toHaveLength(3)

  // Check the empty string property
  const emptyProp = result!.properties.find(p => p.name === 'emptyProp')
  expect(emptyProp).toBeDefined()
  expect(emptyProp!.value).toBe('""')
  expect(emptyProp!.targetType).toBe('string')

  // Check the hello string property
  const helloProp = result!.properties.find(p => p.name === 'helloProp')
  expect(helloProp).toBeDefined()
  expect(helloProp!.value).toBe('"hello"')
  expect(helloProp!.targetType).toBe('string')

  // Check the long text property
  const textProp = result!.properties.find(p => p.name === 'longText')
  expect(textProp).toBeDefined()
  expect(textProp!.value).toBe('"longText"')
  expect(textProp!.targetType).toBe('string')

  console.log('\n=== IMPROVED STRING PROPERTY ANALYSIS ===')
  console.log('String properties with proper values:')
  result!.properties.forEach(prop => {
    console.log(`  ${prop.name}: ${prop.value} (${prop.targetType})`)
  })
})
