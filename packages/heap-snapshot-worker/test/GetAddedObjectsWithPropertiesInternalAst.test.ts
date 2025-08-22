import { expect, test } from '@jest/globals'
import { getAddedObjectsWithPropertiesInternalAst } from '../src/parts/GetAddedObjectsWithPropertiesInternalAst/GetAddedObjectsWithPropertiesInternalAst.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('getAddedObjectsWithPropertiesInternalAst: detects newly added object with property', () => {
  // before snapshot: one object with property "test" -> "hello"
  const beforeSnapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [
        [
          'hidden',
          'array',
          'string',
          'object',
          'code',
          'closure',
          'regexp',
          'number',
          'native',
          'synthetic',
          'concatenated string',
          'sliced string',
          'symbol',
          'bigint',
        ],
      ],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
    nodes: new Uint32Array([
      3,
      1,
      1,
      100,
      1,
      0,
      0, // object id=1 with 1 property
      2,
      2,
      2,
      10,
      0,
      0,
      0, // string "hello" id=2
    ]),
    // [type, name_or_index, to_node]
    edges: new Uint32Array([
      2,
      3,
      7, // property "test" -> nodeIndex 1 * 7 = 7 (string)
    ]),
    strings: ['', 'Object', 'hello', 'test'],
    locations: new Uint32Array([]),
  }

  // after snapshot: two objects with property "test": "hello" and "world"
  const afterSnapshot: Snapshot = {
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [
        [
          'hidden',
          'array',
          'string',
          'object',
          'code',
          'closure',
          'regexp',
          'number',
          'native',
          'synthetic',
          'concatenated string',
          'sliced string',
          'symbol',
          'bigint',
        ],
      ],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes: new Uint32Array([
      // object A -> "hello"
      3, 1, 1, 100, 1, 0, 0, 2, 2, 2, 10, 0, 0, 0,
      // object B -> "world" (new)
      3, 1, 3, 100, 1, 0, 0, 2, 4, 4, 10, 0, 0, 0,
    ]),
    edges: new Uint32Array([
      2,
      3,
      7, // object A property "test" -> string "hello"
      2,
      3,
      21, // object B property "test" -> string "world" (nodeIndex 3 * 7 = 21)
    ]),
    strings: ['', 'Object', 'hello', 'test', 'world'],
    locations: new Uint32Array([]),
  }

  const added = getAddedObjectsWithPropertiesInternalAst(beforeSnapshot, afterSnapshot, 'test', 1)

  expect(added).toEqual([
    {
      id: 3,
      name: 'Object',
      properties: [
        {
          id: 3,
          name: 'test',
          value: {
            id: 4,
            name: 'world',
            type: 'string',
            value: 'world',
          },
        },
      ],
      type: 'object',
    },
  ])
})

test('getAddedObjectsWithPropertiesInternalAst: respects depth (0)', () => {
  const beforeSnapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [
        [
          'hidden',
          'array',
          'string',
          'object',
          'code',
          'closure',
          'regexp',
          'number',
          'native',
          'synthetic',
          'concatenated string',
          'sliced string',
          'symbol',
          'bigint',
        ],
      ],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes: new Uint32Array([3, 1, 1, 100, 1, 0, 0, 2, 2, 2, 10, 0, 0, 0]),
    edges: new Uint32Array([2, 3, 7]),
    strings: ['', 'Object', 'hello', 'test'],
    locations: new Uint32Array([]),
  }
  const afterSnapshot: Snapshot = {
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [
        [
          'hidden',
          'array',
          'string',
          'object',
          'code',
          'closure',
          'regexp',
          'number',
          'native',
          'synthetic',
          'concatenated string',
          'sliced string',
          'symbol',
          'bigint',
        ],
      ],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes: new Uint32Array([3, 1, 1, 100, 1, 0, 0, 2, 2, 2, 10, 0, 0, 0, 3, 1, 3, 100, 1, 0, 0, 2, 4, 4, 10, 0, 0, 0]),
    edges: new Uint32Array([2, 3, 7, 2, 3, 21]),
    strings: ['', 'Object', 'hello', 'test', 'world'],
    locations: new Uint32Array([]),
  }

  const added = getAddedObjectsWithPropertiesInternalAst(beforeSnapshot, afterSnapshot, 'test', 0)

  expect(added).toEqual([
    {
      id: 3,
      name: 'Object',
      properties: [],
      type: 'object',
    },
  ])
})

test.only('getAddedObjectsWithPropertiesInternalAst: detects added object based on prototype', () => {
  // Before:
  //   LeakThing 1 -> 7093
  //     map -> 58817 -> 58819
  //     proto -> 58819
  //     method -> 59725
  //
  // After:
  //   LeakThing 2 -> 60081
  //     map -> 58817 -> 58819
  //     proto -> 58819
  //     method -> 59725

  // prettier-ignore
  const beforeSnapshot: Snapshot = {
    node_count: 5,
    edge_count: 1,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
      node_types: [
        [
          'hidden',
          'array',
          'string',
          'object',
          'code',
          'closure',
          'regexp',
          'number',
          'native',
          'synthetic',
          'concatenated string',
          'sliced string',
          'symbol',
          'bigint',
          'object shape',
        ],
      ],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
    nodes: new Uint32Array([
      0,  0, 0,  0, 0, 0,  // gc roots
      3,  2, 7093, 52, 2, 0,  // LeakThing 1
      14, 3, 58817, 40, 5, 0, //  -> map
      3,  4, 58819, 12, 5, 0, //  -> prototype
      5,  5, 59725, 28, 6, 0, //  -> method
    ]),
    edges: new Uint32Array([
      // LeakThing 1
      2,  5, 24,     // __proto__
      3,  7, 18,     // map

      // map
      3,  6, 24,     // prototype
      3,  8,  0,     // constructor
      3, 14,  0,     // dependent_code
      3,  7,  0,     // map
      4, 15,  0,     // other

      // prototype
      2,  8,  0, // constructor
      2,  4,  0, // method
      2,  5,  0, // __proto__
      3,  9,  0, // properties
      3,  7,  0, // map

      // method
      2,  5,  0, // __proto__
      3, 10,  0, // feedback_cell
      3, 11,  0, // shared
      3, 12,  0, // context
      3, 13,  0, // code
      3,  7,  0, // map
    ]),
    strings: ['gc roots',  'LeakThing', 'system / Map', 'Object', 'leakingMethod'],
    locations: new Uint32Array([]),
  }

  // prettier-ignore
  const afterSnapshot: Snapshot = {
    node_count: 5,
    edge_count: 2,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [
        [
          'hidden',
          'array',
          'string',
          'object',
          'code',
          'closure',
          'regexp',
          'number',
          'native',
          'synthetic',
          'concatenated string',
          'sliced string',
          'symbol',
          'bigint',
          'object shape',
        ],
      ],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes: new Uint32Array([
      0,  0, 0,      0, 0, 0, // gc roots
      3,  1, 60081, 12, 2, 0, // LeakThing 2
      3,  1, 7093,  52, 2, 0, // LeakThing 1
      14, 2, 58817, 40, 5, 0, //   -> map
      3,  3, 58819, 12, 5, 0, //   -> prototype
      5,  4, 59725, 28, 6, 0, //   -> method
    ]),
    edges: new Uint32Array([
      // LeakThing 2
      2,  5, 24,     // __proto__
      3,  7, 18,     // map

      // LeakThing 1
      2,  5, 24,     // __proto__
      3,  7, 18,     // map

      // map
      3,  6, 24,     // prototype
      3,  8,  0,     // constructor
      3, 14,  0,     // dependent_code
      3,  7,  0,     // map
      4, 15,  0,     // other

      // prototype
      2,  8,  0, // constructor
      2,  4,  0, // method
      2,  5,  0, // __proto__
      3,  9,  0, // properties
      3,  7,  0, // map

      // method
      2,  5,  0, // __proto__
      3, 10,  0, // feedback_cell
      3, 11,  0, // shared
      3, 12,  0, // context
      3, 13,  0, // code
      3,  7,  0, // map
    ]),
    strings: ['gc roots',  'LeakThing', 'system / Map', 'Object', 'leakingMethod', '__proto__', 'prototype', 'map', 'constructor', 'properties', 'feedback_cell', 'shared', 'context', 'code', 'dependent_code', 'other'],
    locations: new Uint32Array([]),
  }

  const added = getAddedObjectsWithPropertiesInternalAst(beforeSnapshot, afterSnapshot, 'leakingMethod', 1)

  expect(added).toEqual([
    {
      id: 3,
      name: 'Object',
      properties: [
        {
          id: 3,
          name: 'test',
          value: {
            id: 4,
            name: 'world',
            type: 'string',
            value: 'world',
          },
        },
      ],
      type: 'object',
    },
  ])
})
