import { expect, test } from '@jest/globals'
import { getObjectShapes } from '../src/parts/GetObjectShapes/GetObjectShapes.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('groups object maps by constructor, prototype, elements kind, and descriptor names', () => {
  const snapshot: Snapshot = {
    edge_count: 9,
    edges: Uint32Array.from([0, 1, 15, 0, 1, 15, 0, 2, 20, 0, 3, 25, 0, 4, 30, 0, 5, 35, 0, 6, 40, 0, 7, 45]),
    extra_native_bytes: 0,
    locations: new Uint32Array(),
    meta: {
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['internal']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count'],
      node_types: [['object', 'object shape', 'string']],
    },
    node_count: 10,
    nodes: Uint32Array.from([
      0, 8, 1, 16, 1, 0, 8, 3, 16, 1, 0, 8, 5, 16, 0, 1, 9, 7, 40, 3, 1, 10, 9, 40, 3, 0, 11, 11, 16, 0, 2, 12, 13, 8, 0, 2, 13, 15, 8, 0,
      2, 14, 17, 8, 0, 2, 15, 19, 8, 0,
    ]),
    strings: [
      '',
      'map',
      'descriptors',
      'prototype',
      'elements_kind_name',
      '0',
      '3',
      'map',
      'Widget',
      'system / Map',
      'system / DescriptorArray',
      'Widget prototype',
      'PACKED_ELEMENTS',
      'x',
      'y',
      'unused',
    ],
  }
  expect(getObjectShapes(snapshot)).toEqual([
    {
      constructorName: 'Widget',
      elementsKind: 'PACKED_ELEMENTS',
      instanceCount: 2,
      properties: ['x', 'y'],
      prototypeName: 'Widget prototype',
      shapeCount: 1,
      signature: JSON.stringify(['Widget', 'Widget prototype', 'PACKED_ELEMENTS', ['x', 'y']]),
    },
  ])
})
