import { expect, test } from '@jest/globals'
import { getAddedObjectsWithPropertiesInternalAst } from '../src/parts/GetAddedObjectsWithPropertiesInternalAst/GetAddedObjectsWithPropertiesInternalAst.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

const meta = {
  node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'] as const,
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
  ] as const,
  edge_fields: ['type', 'name_or_index', 'to_node'] as const,
  edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']] as const,
  location_fields: ['object_index', 'script_id', 'line', 'column'] as const,
}

test('getAddedObjectsWithPropertiesInternalAst: detects newly added object with property', () => {
  // before snapshot: one object with property "test" -> "hello"
  const beforeSnapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    meta,
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
    meta,
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

  expect(Array.isArray(added)).toBe(true)
  expect(added.length).toBe(1)
  const obj = added[0]
  expect(obj.type).toBe('object')
  // depth=1 should include the property with its string value
  const props = (obj as any).properties
  expect(props).toBeDefined()
  expect(props.length).toBe(1)
  expect(props[0].name).toBe('test')
  expect(props[0].value.type).toBe('string')
  expect((props[0].value as any).value).toBe('world')
})

test('getAddedObjectsWithPropertiesInternalAst: respects depth (0)', () => {
  const beforeSnapshot: Snapshot = {
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    meta,
    nodes: new Uint32Array([3, 1, 1, 100, 1, 0, 0, 2, 2, 2, 10, 0, 0, 0]),
    edges: new Uint32Array([2, 3, 7]),
    strings: ['', 'Object', 'hello', 'test'],
    locations: new Uint32Array([]),
  }
  const afterSnapshot: Snapshot = {
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    meta,
    nodes: new Uint32Array([3, 1, 1, 100, 1, 0, 0, 2, 2, 2, 10, 0, 0, 0, 3, 1, 3, 100, 1, 0, 0, 2, 4, 4, 10, 0, 0, 0]),
    edges: new Uint32Array([2, 3, 7, 2, 3, 21]),
    strings: ['', 'Object', 'hello', 'test', 'world'],
    locations: new Uint32Array([]),
  }

  const added = getAddedObjectsWithPropertiesInternalAst(beforeSnapshot, afterSnapshot, 'test', 0)

  expect(added.length).toBe(1)
  const obj = added[0]
  expect(obj.type).toBe('object')
  // depth=0 should not include properties
  const props = (obj as any).properties
  expect(props).toBeDefined()
  expect(props.length).toBe(0)
})
