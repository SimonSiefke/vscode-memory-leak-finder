import { test, expect } from '@jest/globals'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.js'
import { getObjectsWithPropertiesInternal } from '../src/parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'

test('should detect boolean values from hidden nodes with boolean-like property names', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 4,
    edge_count: 3,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes: new Uint32Array([
      // type, name, id, self_size, edge_count, trace_node_id, detachedness
      3, 1, 1, 100, 2, 0, 0,  // Object with boolean properties
      0, 0, 75, 0, 0, 0, 0,   // hidden node (boolean true)
      0, 0, 77, 0, 0, 0, 0,   // hidden node (boolean false)
      3, 4, 2, 50, 1, 0, 0,   // Another object with boolean property
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 2, 7,   // property edge "isExpanded" to hidden node 75 (true)
      2, 3, 14,  // property edge "isVisible" to hidden node 77 (false)
      2, 2, 7,   // property edge "isExpanded" to hidden node 75 (true) from second object
    ]),
    strings: ['', 'TestObject1', 'isExpanded', 'isVisible', 'TestObject2'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'isExpanded', 1)

  expect(result).toHaveLength(2)

  // Both objects should have isExpanded property detected as boolean true
  expect(result[0]).toEqual({
    id: 1,
    name: 'TestObject1',
    propertyValue: true,
    type: 'object',
    selfSize: 100,
    edgeCount: 2,
    preview: {
      isExpanded: true,
      isVisible: false,
    },
  })

  expect(result[1]).toEqual({
    id: 2,
    name: 'TestObject2',
    propertyValue: true,
    type: 'object',
    selfSize: 50,
    edgeCount: 1,
    preview: {
      isExpanded: true,
    },
  })
})

test('should detect boolean false values from hidden nodes', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes: new Uint32Array([
      // type, name, id, self_size, edge_count, trace_node_id, detachedness
      3, 1, 1, 100, 2, 0, 0,  // Object with boolean properties
      0, 0, 75, 0, 0, 0, 0,   // hidden node (boolean true)
      0, 0, 77, 0, 0, 0, 0,   // hidden node (boolean false)
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 2, 7,   // property edge "isExpanded" to hidden node 75 (true)
      2, 3, 14,  // property edge "isCollapsed" to hidden node 77 (false)
    ]),
    strings: ['', 'TestObject', 'isExpanded', 'isCollapsed'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'isCollapsed', 2)

  expect(result).toHaveLength(1)

  // Should have both boolean properties in preview at depth 2
  expect(result[0]).toEqual({
    id: 1,
    name: 'TestObject',
    propertyValue: false,
    type: 'object',
    selfSize: 100,
    edgeCount: 2,
    preview: {
      isExpanded: true,
      isCollapsed: false,
    },
  })
})

test('should handle explicit boolean node names', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 3,
    edge_count: 1,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column']
    },
    nodes: new Uint32Array([
      // type, name, id, self_size, edge_count, trace_node_id, detachedness
      3, 1, 1, 100, 1, 0, 0,  // Object
      0, 2, 99, 0, 0, 0, 0,   // hidden node with name "true"
    ]),
    edges: new Uint32Array([
      // type, name_or_index, to_node
      2, 3, 7,   // property edge "enabled" to hidden node with name "true"
    ]),
    strings: ['', 'TestObject', 'true', 'enabled'],
    locations: new Uint32Array([])
  }

  const result = getObjectsWithPropertiesInternal(snapshot, 'enabled', 1)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    id: 1,
    name: 'TestObject',
    propertyValue: true,
    type: 'object',
    selfSize: 100,
    edgeCount: 1,
    preview: {
      enabled: true,
    },
  })
})
