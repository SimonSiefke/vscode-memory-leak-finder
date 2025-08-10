import { test, expect } from '@jest/globals'
import { getObjectsWithProperties } from '../src/parts/GetObjectsWithProperties/GetObjectsWithProperties.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.js'

test('getObjectsWithProperties - should handle object properties with numbers', () => {
  const snapshot: Snapshot = {
    node_count: 5,
    edge_count: 4,
    extra_native_bytes: 0,
    locations: new Uint32Array([]),
    nodes: new Uint32Array([
      // Node 0: Object with numeric properties
      1, 0, 0, 0, 0, // id: 1, type: 0 (object), name: 0, edge_count: 0, self_size: 0
      // Node 1: Number property "x"
      2, 0, 1, 0, 0, // id: 2, type: 0 (number), name: 1, edge_count: 0, self_size: 0
      // Node 2: Number property "y"
      3, 0, 2, 0, 0, // id: 3, type: 0 (number), name: 2, edge_count: 0, self_size: 0
      // Node 3: Number property "width"
      4, 0, 3, 0, 0, // id: 4, type: 0 (number), name: 3, edge_count: 0, self_size: 0
      // Node 4: Number property "height"
      5, 0, 4, 0, 0, // id: 5, type: 0 (number), name: 4, edge_count: 0, self_size: 0
    ]),
    edges: new Uint32Array([
      // Edge 0: Object -> Number "x" (property edge)
      0, 0, 0, 0, // type: 0 (property), name_or_index: 0, to_node: 5
      // Edge 1: Object -> Number "y" (property edge)
      0, 1, 0, 0, // type: 0 (property), name_or_index: 1, to_node: 10
      // Edge 2: Object -> Number "width" (property edge)
      0, 2, 0, 0, // type: 0 (property), name_or_index: 2, to_node: 15
      // Edge 3: Object -> Number "height" (property edge)
      0, 3, 0, 0, // type: 0 (property), name_or_index: 3, to_node: 20
    ]),
    strings: [
      'x', 'y', 'width', 'height', // Property names
      '200', '300', '400', '500',  // Number values
    ],
    meta: {
      node_fields: ['id', 'type', 'name', 'edge_count', 'self_size'],
      node_types: [['object', 'number']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['property']],
    },
  }

  // Update the object node to have 4 edges
  snapshot.nodes[4] = 4 // edge_count = 4

  const results = getObjectsWithProperties(snapshot, 'x', 1)

  expect(results).toHaveLength(1)
  expect(results[0].id).toBe(1)
  expect(results[0].propertyValue).toBe(200) // Should be number, not string
})

test('getObjectsWithProperties - should handle multiple numeric properties', () => {
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    locations: new Uint32Array([]),
    nodes: new Uint32Array([
      // Node 0: Object with multiple numeric properties
      1, 0, 0, 0, 0, // id: 1, type: 0 (object), name: 0, edge_count: 0, self_size: 0
      // Node 1: Number property "x"
      2, 0, 1, 0, 0, // id: 2, type: 0 (number), name: 1, edge_count: 0, self_size: 0
      // Node 2: Number property "y"
      3, 0, 2, 0, 0, // id: 3, type: 0 (number), name: 2, edge_count: 0, self_size: 0
    ]),
    edges: new Uint32Array([
      // Edge 0: Object -> Number "x" (property edge)
      0, 0, 0, 0, // type: 0 (property), name_or_index: 0, to_node: 5
      // Edge 1: Object -> Number "y" (property edge)
      0, 1, 0, 0, // type: 0 (property), name_or_index: 1, to_node: 10
    ]),
    strings: [
      'x', 'y', // Property names
      '150', '250', // Number values
    ],
    meta: {
      node_fields: ['id', 'type', 'name', 'edge_count', 'self_size'],
      node_types: [['object', 'number']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['property']],
    },
  }

  // Update the object node to have 2 edges
  snapshot.nodes[4] = 2 // edge_count = 2

  const results = getObjectsWithProperties(snapshot, 'x', 2)

  expect(results).toHaveLength(1)
  expect(results[0].id).toBe(1)
  expect(results[0].preview).toBeDefined()
  expect(results[0].preview!.x).toBe(150) // Should be number, not string
  expect(results[0].preview!.y).toBe(250) // Should be number, not string
})

test('getObjectsWithProperties - should handle SMI numbers correctly', () => {
  const snapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    locations: new Uint32Array([]),
    nodes: new Uint32Array([
      // Node 0: Object with SMI number property
      1, 0, 0, 0, 0, // id: 1, type: 0 (object), name: 0, edge_count: 0, self_size: 0
      // Node 1: SMI number property "count"
      2, 0, 1, 0, 0, // id: 2, type: 0 (number), name: 1, edge_count: 0, self_size: 0
    ]),
    edges: new Uint32Array([
      // Edge 0: Object -> SMI Number "count" (property edge)
      0, 0, 0, 0, // type: 0 (property), name_or_index: 0, to_node: 5
    ]),
    strings: [
      'count', // Property name
      '42', // SMI number value
    ],
    meta: {
      node_fields: ['id', 'type', 'name', 'edge_count', 'self_size'],
      node_types: [['object', 'number']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['property']],
    },
  }

  // Update the object node to have 1 edge
  snapshot.nodes[4] = 1 // edge_count = 1

  const results = getObjectsWithProperties(snapshot, 'count', 1)

  expect(results).toHaveLength(1)
  expect(results[0].id).toBe(1)
  expect(results[0].propertyValue).toBe(42) // Should be number, not string
})

test('getObjectsWithProperties - should handle decimal numbers', () => {
  const snapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    locations: new Uint32Array([]),
    nodes: new Uint32Array([
      // Node 0: Object with decimal number property
      1, 0, 0, 0, 0, // id: 1, type: 0 (object), name: 0, edge_count: 0, self_size: 0
      // Node 1: Decimal number property "ratio"
      2, 0, 1, 0, 0, // id: 2, type: 0 (number), name: 1, edge_count: 0, self_size: 0
    ]),
    edges: new Uint32Array([
      // Edge 0: Object -> Decimal Number "ratio" (property edge)
      0, 0, 0, 0, // type: 0 (property), name_or_index: 0, to_node: 5
    ]),
    strings: [
      'ratio', // Property name
      '3.14159', // Decimal number value
    ],
    meta: {
      node_fields: ['id', 'type', 'name', 'edge_count', 'self_size'],
      node_types: [['object', 'number']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['property']],
    },
  }

  // Update the object node to have 1 edge
  snapshot.nodes[4] = 1 // edge_count = 1

  const results = getObjectsWithProperties(snapshot, 'ratio', 1)

  expect(results).toHaveLength(1)
  expect(results[0].id).toBe(1)
  expect(results[0].propertyValue).toBe(3.14159) // Should be number, not string
})

test('getObjectsWithProperties - should handle mixed property types', () => {
  const snapshot: Snapshot = {
    node_count: 4,
    edge_count: 3,
    extra_native_bytes: 0,
    locations: new Uint32Array([]),
    nodes: new Uint32Array([
      // Node 0: Object with mixed property types
      1, 0, 0, 0, 0, // id: 1, type: 0 (object), name: 0, edge_count: 0, self_size: 0
      // Node 1: Number property "age"
      2, 0, 1, 0, 0, // id: 2, type: 0 (number), name: 1, edge_count: 0, self_size: 0
      // Node 2: String property "name"
      3, 1, 2, 0, 0, // id: 3, type: 1 (string), name: 2, edge_count: 0, self_size: 0
      // Node 3: Boolean property "active"
      4, 2, 3, 0, 0, // id: 4, type: 2 (hidden), name: 3, edge_count: 0, self_size: 0
    ]),
    edges: new Uint32Array([
      // Edge 0: Object -> Number "age" (property edge)
      0, 0, 0, 0, // type: 0 (property), name_or_index: 0, to_node: 5
      // Edge 1: Object -> String "name" (property edge)
      0, 1, 0, 0, // type: 0 (property), name_or_index: 1, to_node: 10
      // Edge 2: Object -> Boolean "active" (property edge)
      0, 2, 0, 0, // type: 0 (property), name_or_index: 2, to_node: 15
    ]),
    strings: [
      'age', 'name', 'active', // Property names
      '25', 'John', 'true', // Property values
    ],
    meta: {
      node_fields: ['id', 'type', 'name', 'edge_count', 'self_size'],
      node_types: [['object', 'number', 'string', 'hidden']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['property']],
    },
  }

  // Update the object node to have 3 edges
  snapshot.nodes[4] = 3 // edge_count = 3

  const results = getObjectsWithProperties(snapshot, 'age', 2)

  expect(results).toHaveLength(1)
  expect(results[0].id).toBe(1)
  expect(results[0].preview).toBeDefined()
  expect(results[0].preview!.age).toBe(25) // Should be number, not string
  expect(results[0].preview!.name).toBe('John') // Should remain string
  expect(results[0].preview!.active).toBe(true) // Should be boolean
})
