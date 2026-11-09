import { expect, test } from '@jest/globals'
import { compareHeapSnapshotFunctionsInternal2 } from '../src/parts/CompareHeapSnapshotsFunctionsInternal2/CompareHeapSnapshotsFunctionsInternal2.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

const before: Snapshot = {
  edge_count: 0,
  edges: new Uint32Array(),
  extra_native_bytes: 0,
  locations: new Uint32Array(),
  meta: {
    edge_fields: [],
    edge_types: [],
    location_fields: ['object_index', 'script_id', 'line', 'column'],
    node_fields: ['name'],
    node_types: [],
  },
  node_count: 0,
  nodes: new Uint32Array(),
  strings: ['retainedFunction'],
}
const after: Snapshot = {
  ...before,
  locations: new Uint32Array([0, 123, 10, 20]),
  node_count: 1,
  nodes: new Uint32Array([0]),
}

test('function comparison uses the supplied process script map', async () => {
  const result = await compareHeapSnapshotFunctionsInternal2(before, after, {
    minCount: 1,
    scriptMap: { 123: { url: 'file:///electron-fixture/main.cjs' } },
  })
  expect(result).toEqual([
    expect.objectContaining({ name: 'retainedFunction', delta: 1, sourceLocation: 'file:///electron-fixture/main.cjs:10:20' }),
  ])
})

test('an empty supplied map prevents falling back to persisted maps from other processes', async () => {
  const result = await compareHeapSnapshotFunctionsInternal2(before, after, { minCount: 1, scriptMap: {} })
  expect(result).toEqual([expect.objectContaining({ name: 'retainedFunction', sourceLocation: undefined })])
})
