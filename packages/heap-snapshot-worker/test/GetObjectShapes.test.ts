import { expect, test } from '@jest/globals'
import { getObjectShapes } from '../src/parts/GetObjectShapes/GetObjectShapes.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

const createSnapshot = (): Snapshot => {
  return {
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
}

test('groups object maps by constructor, prototype, elements kind, and descriptor names', () => {
  const snapshot = createSnapshot()
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

test('keeps different object names separate when they share a hidden map', () => {
  const original = createSnapshot()
  const snapshot = { ...original, strings: [...original.strings] }
  snapshot.nodes[6] = snapshot.strings.push('OtherWidget') - 1

  expect(getObjectShapes(snapshot)).toEqual([
    {
      constructorName: 'OtherWidget',
      elementsKind: 'PACKED_ELEMENTS',
      instanceCount: 1,
      properties: ['x', 'y'],
      prototypeName: 'Widget prototype',
      shapeCount: 1,
      signature: JSON.stringify(['OtherWidget', 'Widget prototype', 'PACKED_ELEMENTS', ['x', 'y']]),
    },
    {
      constructorName: 'Widget',
      elementsKind: 'PACKED_ELEMENTS',
      instanceCount: 1,
      properties: ['x', 'y'],
      prototypeName: 'Widget prototype',
      shapeCount: 1,
      signature: JSON.stringify(['Widget', 'Widget prototype', 'PACKED_ELEMENTS', ['x', 'y']]),
    },
  ])
})

test('is independent of the first object name encountered for a shared hidden map', () => {
  const original = createSnapshot()
  const before = { ...original, strings: [...original.strings] }
  const after = { ...original, nodes: original.nodes.slice(), strings: [...original.strings] }
  for (const snapshot of [before, after]) {
    snapshot.strings[8] = 'system / Context / scope @100'
    snapshot.strings.push('system / Context / scope @200')
  }
  before.nodes[6] = 16
  after.nodes[1] = 16

  expect(getObjectShapes(after)).toEqual(getObjectShapes(before))
})

test('still aggregates equivalent shapes from distinct hidden maps', () => {
  const original = createSnapshot()
  const snapshot: Snapshot = {
    ...original,
    edge_count: 11,
    edges: Uint32Array.from([...original.edges, 0, 2, 20, 0, 3, 25, 0, 4, 30]),
    node_count: 11,
    nodes: Uint32Array.from([...original.nodes, 1, 9, 21, 40, 3]),
  }
  snapshot.edges[5] = 50

  expect(getObjectShapes(snapshot)).toEqual([{ ...getObjectShapes(original)[0], shapeCount: 2 }])
})
