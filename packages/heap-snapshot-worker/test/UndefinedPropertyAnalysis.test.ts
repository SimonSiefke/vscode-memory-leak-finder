import { test, expect } from '@jest/globals'
import { examineNodeByIndex } from '../src/parts/ExamineNode/ExamineNode.ts'
import { createTestSnapshot } from './createTestSnapshot.ts'

test('demonstrate improved undefined property detection', () => {
  // Create a mock snapshot that represents an object with undefined properties
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const nodeTypes: [readonly string[]] = [['object', 'hidden', 'string']]
  const edgeTypes: [readonly string[]] = [['property', 'internal', 'hidden']]
  const strings = ['Object', 'undefined', 'myProperty', 'anotherProp', 'normalString']

  // Create nodes:
  // 0: Object with 2 properties
  // 1: undefined value (hidden type)
  // 2: normal string
  const nodes = new Uint32Array([
    // Node 0: Object
    0, 0, 1, 100, 2,    // type=object, name=Object, id=1, size=100, edges=2
    // Node 1: undefined value
    1, 1, 67, 0, 0,     // type=hidden, name=undefined, id=67, size=0, edges=0
    // Node 2: normal string
    2, 4, 3, 20, 0      // type=string, name=normalString, id=3, size=20, edges=0
  ])

  // Create edges: Object has 2 property edges
  const edges = new Uint32Array([
    // Edge 0: myProperty -> undefined
    0, 2, 5,    // type=property, name=myProperty, to_node=5 (node 1)
    // Edge 1: anotherProp -> normalString
    0, 3, 10    // type=property, name=anotherProp, to_node=10 (node 2)
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
  expect(result!.properties).toHaveLength(2)

  // Check the undefined property
  const undefinedProp = result!.properties.find(p => p.name === 'myProperty')
  expect(undefinedProp).toBeDefined()
  expect(undefinedProp!.value).toBe('[undefined 67]')
  expect(undefinedProp!.targetType).toBe('hidden')

  // Check the normal string property
  const stringProp = result!.properties.find(p => p.name === 'anotherProp')
  expect(stringProp).toBeDefined()
  expect(stringProp!.value).toBe('"normalString"')
  expect(stringProp!.targetType).toBe('string')

  console.log('\n=== OBJECT PROPERTY ANALYSIS ===')
  console.log('Properties found:')
  result!.properties.forEach(prop => {
    const valueDisplay = prop.value?.startsWith('[undefined ') ? `**${prop.value}**` : prop.value
    console.log(`  ${prop.name}: ${valueDisplay} (${prop.targetType})`)
  })
})

test('demonstrate undefined vs string undefined differences', () => {
  // This test shows the difference between the undefined value and a string containing "undefined"
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const nodeTypes: [readonly string[]] = [['object', 'hidden', 'string']]
  const edgeTypes: [readonly string[]] = [['property']]
  const strings = ['Object', 'undefined', 'undefinedProp', 'stringProp']

  const nodes = new Uint32Array([
    // Node 0: Object
    0, 0, 1, 100, 2,    // type=object, name=Object, id=1, size=100, edges=2
    // Node 1: undefined value (hidden type)
    1, 1, 67, 0, 0,     // type=hidden, name=undefined, id=67, size=0, edges=0
    // Node 2: string with value "undefined"
    2, 1, 99, 20, 0     // type=string, name=undefined, id=99, size=20, edges=0
  ])

  const edges = new Uint32Array([
    // Edge 0: undefinedProp -> undefined value (hidden)
    0, 2, 5,    // type=property, name=undefinedProp, to_node=5 (node 1)
    // Edge 1: stringProp -> string "undefined"
    0, 3, 10    // type=property, name=stringProp, to_node=10 (node 2)
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

  const result = examineNodeByIndex(0, snapshot)

  expect(result).not.toBeNull()
  expect(result!.properties).toHaveLength(2)

  // Find properties
  const undefinedValueProp = result!.properties.find(p => p.name === 'undefinedProp')
  const stringValueProp = result!.properties.find(p => p.name === 'stringProp')

  expect(undefinedValueProp).toBeDefined()
  expect(undefinedValueProp!.value).toBe('[undefined 67]')
  expect(undefinedValueProp!.targetType).toBe('hidden')

  expect(stringValueProp).toBeDefined()
  expect(stringValueProp!.value).toBe('"undefined"')
  expect(stringValueProp!.targetType).toBe('string')

  console.log('\n=== UNDEFINED vs STRING "undefined" ===')
  console.log('Now you can clearly see the difference:')
  result!.properties.forEach(prop => {
    const typeIndicator = prop.targetType === 'hidden' ? ' (TRUE undefined value)' : ' (string containing "undefined")'
    const valueDisplay = prop.value?.startsWith('[undefined ') ? prop.value : prop.value
    console.log(`  ${prop.name}: ${valueDisplay} (${prop.targetType})${typeIndicator}`)
  })
})
