import { test, expect, jest } from '@jest/globals'
import { addLocationsToAstNodes } from '../src/parts/AddLocationsToAstNodes/AddLocationsToAstNodes.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'
import type { AstNode, ObjectNode } from '../src/parts/AstNode/AstNode.ts'

test('addLocationsToAstNodes - adds closureLocations to object nodes when captured by closures', () => {
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 4,
    edge_count: 3,
    extra_native_bytes: 0,
    // nodes: [type, name, id, self_size, edge_count, trace_node_id, detachedness]
    nodes: new Uint32Array([
      // 0: target object with id=101
      3, 0, 101, 0, 0, 0, 0,

      // 1: context object for a closure
      3, 0, 201, 0, 1, 0, 0,

      // 2: closure node referencing context 1 via context edge
      5, 0, 301, 0, 1, 0, 0,

      // 3: some other node
      3, 0, 401, 0, 0, 0, 0,
    ]),
    // edges: [type, name_or_index, to_node]
    edges: new Uint32Array([
      // from context (node 1) property -> target object (node 0)
      2, 0, 0,
      // from closure (node 2) context -> context node (node 1)
      0, 0, 7,
      // unrelated edge
      3, 0, 21,
    ]),
    strings: [''],
    // locations: [object_index (absolute), script_id, line, column]
    locations: new Uint32Array([
      // Provide location for closure node (index 2)
      2 * 7, 10, 20, 30,
    ]),
    meta: {
      node_types: [[
        'hidden',   // 0
        'array',    // 1
        'string',   // 2
        'object',   // 3
        'code',     // 4
        'closure',  // 5
      ]],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [[
        'context',  // 0
        'element',  // 1
        'property', // 2
        'internal', // 3
      ]],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const nodes: readonly AstNode[] = [
    { type: 'object', id: 101, properties: [] },
    { type: 'string', id: 999, value: 'x' },
  ]

  const result = addLocationsToAstNodes(snapshot, nodes)

  const objectNode = result[0] as ObjectNode
  expect(objectNode.type).toBe('object')
  expect(objectNode.id).toBe(101)
  expect(objectNode.closureLocations).toBeDefined()
  expect(objectNode.closureLocations).toEqual([{ scriptId: 10, line: 20, column: 30 }])

  // non-object node unchanged
  expect(result[1]).toEqual(nodes[1])
})

test('addLocationsToAstNodes - leaves nodes unchanged when no locations found', () => {
  // Snapshot without locations and without closure/context connectivity
  // prettier-ignore
  const snapshot: Snapshot = {
    node_count: 1,
    edge_count: 0,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      3, 0, 101, 0, 0, 0, 0,
    ]),
    edges: new Uint32Array([]),
    strings: [''],
    locations: new Uint32Array([]),
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  }

  const nodes: readonly AstNode[] = [{ type: 'object', id: 101, properties: [] }]

  const result = addLocationsToAstNodes(snapshot, nodes)
  expect(result).toEqual(nodes)
})
