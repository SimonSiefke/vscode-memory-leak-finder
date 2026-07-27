import { expect, test } from '@jest/globals'
import { getDuplicatedStringsFromHeapSnapshotInternal } from '../src/parts/GetDuplicatedStringsFromHeapSnapshotInternal/GetDuplicatedStringsFromHeapSnapshotInternal.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

const createSnapshot = (values: readonly { readonly type: string; readonly value: string }[]): Snapshot => {
  const nodeTypes = ['hidden', 'string', 'concatenated string']
  const strings = [...new Set(values.map(({ value }) => value))]
  const nodes: number[] = []
  for (let index = 0; index < values.length; index++) {
    const { type, value } = values[index]
    nodes.push(nodeTypes.indexOf(type), strings.indexOf(value), index * 2 + 1, 0, 0, 0, 0)
  }
  return {
    edge_count: 0,
    edges: new Uint32Array(),
    extra_native_bytes: 0,
    locations: new Uint32Array(),
    meta: {
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal']],
      location_fields: [],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [nodeTypes],
    },
    node_count: values.length,
    nodes: new Uint32Array(nodes),
    strings,
  }
}

test('returns each duplicated flat string value once', () => {
  const snapshot = createSnapshot([
    { type: 'string', value: 'alpha' },
    { type: 'string', value: 'beta' },
    { type: 'string', value: 'alpha' },
    { type: 'string', value: 'gamma' },
    { type: 'string', value: 'gamma' },
    { type: 'string', value: 'gamma' },
  ])

  expect(getDuplicatedStringsFromHeapSnapshotInternal(snapshot)).toEqual(['alpha', 'gamma'])
})

test('does not mix concatenated string nodes into duplicate flat strings', () => {
  const snapshot = createSnapshot([
    { type: 'string', value: 'same name' },
    { type: 'concatenated string', value: 'same name' },
    { type: 'string', value: 'unique' },
  ])

  expect(getDuplicatedStringsFromHeapSnapshotInternal(snapshot)).toEqual([])
})
