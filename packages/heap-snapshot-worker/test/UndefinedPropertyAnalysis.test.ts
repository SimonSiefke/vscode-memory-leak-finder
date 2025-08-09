import { test, expect } from '@jest/globals'
import { examineNodeByIndex } from '../src/parts/ExamineNode/ExamineNode.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('demonstrate improved undefined property detection', () => {
  // Create a mock snapshot that represents an object with undefined properties
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 2, 
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Object with 2 properties
      // [type, name, id, self_size, edge_count]
      0, 0, 1, 100, 2,   // object "Object" id=1 size=100 edges=2
      
      // Node 1: undefined value (hidden type)
      // [type, name, id, self_size, edge_count]
      1, 1, 67, 0, 0,    // hidden "undefined" id=67 size=0 edges=0
      
      // Node 2: normal string
      // [type, name, id, self_size, edge_count] 
      2, 4, 3, 20, 0,    // string "normalString" id=3 size=20 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: myProperty -> undefined
      // [type, name_or_index, to_node]
      0, 2, 5,   // property "myProperty" -> undefined (offset 5)
      
      // Edge 1: anotherProp -> normalString
      // [type, name_or_index, to_node]
      0, 3, 10,  // property "anotherProp" -> normalString (offset 10)
    ]),
    strings: ['Object', 'undefined', 'myProperty', 'anotherProp', 'normalString'],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['object', 'hidden', 'string']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['property', 'internal', 'hidden']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  // Examine the object (node index 0)
  const result = examineNodeByIndex(0, snapshot)

  expect(result).not.toBeNull()
  expect(result!.nodeType).toBe('object')
  expect(result!.properties).toHaveLength(2)

  // Check the undefined property
  const undefinedProp = result!.properties.find((p) => p.name === 'myProperty')
  expect(undefinedProp).toBeDefined()
  expect(undefinedProp!.value).toBe('[undefined 67]')
  expect(undefinedProp!.targetType).toBe('hidden')

  // Check the normal string property
  const stringProp = result!.properties.find((p) => p.name === 'anotherProp')
  expect(stringProp).toBeDefined()
  expect(stringProp!.value).toBe('"normalString"')
  expect(stringProp!.targetType).toBe('string')

  console.log('\n=== OBJECT PROPERTY ANALYSIS ===')
  console.log('Properties found:')
  result!.properties.forEach((prop) => {
    const valueDisplay = prop.value?.startsWith('[undefined ') ? `**${prop.value}**` : prop.value
    console.log(`  ${prop.name}: ${valueDisplay} (${prop.targetType})`)
  })
})

test('demonstrate undefined vs string undefined differences', () => {
  // This test shows the difference between the undefined value and a string containing "undefined"
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      // Node 0: Object with 2 properties
      // [type, name, id, self_size, edge_count]
      0, 0, 1, 100, 2,   // object "Object" id=1 size=100 edges=2
      
      // Node 1: undefined value (hidden type)
      // [type, name, id, self_size, edge_count]
      1, 1, 67, 0, 0,    // hidden "undefined" id=67 size=0 edges=0
      
      // Node 2: string with value "undefined"
      // [type, name, id, self_size, edge_count]
      2, 1, 99, 20, 0,   // string "undefined" id=99 size=20 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: undefinedProp -> undefined value (hidden)
      // [type, name_or_index, to_node]
      0, 2, 5,   // property "undefinedProp" -> undefined (offset 5)
      
      // Edge 1: stringProp -> string "undefined"
      // [type, name_or_index, to_node]
      0, 3, 10,  // property "stringProp" -> string "undefined" (offset 10)
    ]),
    strings: ['Object', 'undefined', 'undefinedProp', 'stringProp'],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['object', 'hidden', 'string']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      edge_types: [['property']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const result = examineNodeByIndex(0, snapshot)

  expect(result).not.toBeNull()
  expect(result!.properties).toHaveLength(2)

  // Find properties
  const undefinedValueProp = result!.properties.find((p) => p.name === 'undefinedProp')
  const stringValueProp = result!.properties.find((p) => p.name === 'stringProp')

  expect(undefinedValueProp).toBeDefined()
  expect(undefinedValueProp!.value).toBe('[undefined 67]')
  expect(undefinedValueProp!.targetType).toBe('hidden')

  expect(stringValueProp).toBeDefined()
  expect(stringValueProp!.value).toBe('"undefined"')
  expect(stringValueProp!.targetType).toBe('string')

  console.log('\n=== UNDEFINED vs STRING "undefined" ===')
  console.log('Now you can clearly see the difference:')
  result!.properties.forEach((prop) => {
    const typeIndicator = prop.targetType === 'hidden' ? ' (TRUE undefined value)' : ' (string containing "undefined")'
    const valueDisplay = prop.value?.startsWith('[undefined ') ? prop.value : prop.value
    console.log(`  ${prop.name}: ${valueDisplay} (${prop.targetType})${typeIndicator}`)
  })
})
