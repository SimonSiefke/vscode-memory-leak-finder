import { expect, test } from '@jest/globals'
import { getStringObjectMetrics } from '../src/parts/GetStringObjectMetrics/GetStringObjectMetrics.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

const createSnapshot = (
  records: readonly { type: string; bytes: number; name?: number; edgeCount?: number }[],
  fields = ['type', 'name', 'id', 'self_size', 'edge_count'],
  types = ['hidden', 'object', 'string', 'concatenated string', 'sliced string'],
): Snapshot => ({
  edge_count: 0,
  edges: new Uint32Array(),
  extra_native_bytes: 0,
  locations: new Uint32Array(),
  meta: {
    edge_fields: ['type', 'name_or_index', 'to_node'],
    edge_types: [['internal']],
    location_fields: ['object_index', 'script_id', 'line', 'column'],
    node_fields: fields,
    node_types: fields.map((field) => (field === 'type' ? types : [])),
  },
  node_count: records.length,
  nodes: new Uint32Array(
    records.flatMap((record, index) => {
      const values: Record<string, number> = {
        type: types.indexOf(record.type),
        name: record.name ?? 1,
        id: index * 2 + 1,
        self_size: record.bytes,
        edge_count: record.edgeCount ?? 0,
      }
      return fields.map((field) => values[field])
    }),
  ),
  strings: ['', 'same text', 'metadata only', 'property name'],
})

test('counts flat, concatenated, and sliced nodes, including separate objects with identical text', () => {
  const snapshot = createSnapshot([
    { type: 'object', bytes: 128 },
    { type: 'string', bytes: 40 },
    { type: 'string', bytes: 40 },
    { type: 'concatenated string', bytes: 32 },
    { type: 'sliced string', bytes: 32 },
    { type: 'hidden', bytes: 256 },
  ])
  expect(getStringObjectMetrics(snapshot)).toEqual({ bytes: 144, count: 4 })
})

test('counts a shared parent once even when two slices reference it', () => {
  const snapshot = createSnapshot([
    { type: 'string', bytes: 1024 },
    { type: 'sliced string', bytes: 32 },
    { type: 'sliced string', bytes: 32 },
  ])
  const sharedSnapshot = {
    ...snapshot,
    edge_count: 2,
    nodes: new Uint32Array([2, 1, 1, 1024, 0, 4, 1, 3, 32, 1, 4, 1, 5, 32, 1]),
    edges: new Uint32Array([0, 0, 0, 0, 0, 0]),
  }
  expect(getStringObjectMetrics(sharedSnapshot)).toEqual({ bytes: 1088, count: 3 })
})

test('resolves reordered fields and type IDs from metadata', () => {
  const snapshot = createSnapshot(
    [
      { type: 'string', bytes: 80 },
      { type: 'concatenated string', bytes: 32 },
      { type: 'sliced string', bytes: 32 },
      { type: 'object', bytes: 200 },
    ],
    ['self_size', 'id', 'name', 'type', 'edge_count'],
    ['sliced string', 'object', 'concatenated string', 'string', 'hidden'],
  )
  expect(getStringObjectMetrics(snapshot)).toEqual({ bytes: 144, count: 3 })
})

test('returns zero for an empty heap despite string-table entries', () => {
  expect(getStringObjectMetrics(createSnapshot([]))).toEqual({ bytes: 0, count: 0 })
})

test('excludes zero-size snapshot annotations without excluding allocated strings with the same text', () => {
  const snapshot = createSnapshot([
    { type: 'string', bytes: 0, name: 1 },
    { type: 'string', bytes: 24, name: 1 },
    { type: 'string', bytes: 0, edgeCount: 1 },
    { type: 'concatenated string', bytes: 20 },
    { type: 'sliced string', bytes: 20 },
  ])
  expect(getStringObjectMetrics(snapshot)).toEqual({ bytes: 64, count: 4 })
})

test('supports metadata without concatenated or sliced string types', () => {
  const snapshot = createSnapshot([{ type: 'string', bytes: 24 }], undefined, ['string', 'object'])
  expect(getStringObjectMetrics(snapshot)).toEqual({ bytes: 24, count: 1 })
})

test('keeps totals above 4 GiB without wrapping', () => {
  const snapshot = createSnapshot([
    { type: 'string', bytes: 3_000_000_000 },
    { type: 'string', bytes: 3_000_000_000 },
  ])
  expect(getStringObjectMetrics(snapshot)).toEqual({ bytes: 6_000_000_000, count: 2 })
})
