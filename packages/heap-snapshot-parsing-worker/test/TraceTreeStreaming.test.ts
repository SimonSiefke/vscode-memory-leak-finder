import { expect, jest, test } from '@jest/globals'
import { finished } from 'node:stream/promises'
import { createHeapSnapshotWriteStream } from '../src/parts/HeapSnapshotWriteStream/HeapSnapshotWriteStream.ts'

const createSnapshot = (traceTree: readonly unknown[]) => ({
  snapshot: {
    edge_count: 0,
    node_count: 1,
    trace_function_count: 1,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id'],
      node_types: [['synthetic']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['property']],
      trace_function_info_fields: ['function_id', 'name', 'script_name', 'script_id', 'line', 'column'],
      trace_node_fields: ['id', 'function_info_index', 'count', 'size', 'children'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
  },
  nodes: [0, 0, 1, 0, 0, 1],
  edges: [],
  trace_function_infos: [1, 1, 2, 1, 4, 8],
  trace_tree: traceTree,
  locations: [0, 1, 4, 8],
  strings: ['root', 'allocate', 'fixture.js'],
})

test('decodes fragmented allocation trace data only once', () => {
  const children = Array.from({ length: 300 }, (_, index) => [index + 2, 0, 1, 16, []])
  const snapshot = createSnapshot([1, 0, children.length, children.length * 16, children])
  const json = JSON.stringify(snapshot)
  const start = json.indexOf('"trace_tree":[') + '"trace_tree":['.length
  const end = json.indexOf(',"locations":', start)
  const stream = createHeapSnapshotWriteStream({ parseStrings: true })
  stream.write(Buffer.from(json.slice(0, start)))
  const traceData = Buffer.from(json.slice(start, end))
  const decode = jest.spyOn(TextDecoder.prototype, 'decode')
  let decodedBytes: number
  try {
    for (let offset = 0; offset < traceData.length; offset += 17) {
      stream.write(traceData.subarray(offset, offset + 17))
    }
    decodedBytes = decode.mock.calls.reduce((total, [input]) => total + (input?.byteLength ?? 0), 0)
  } finally {
    decode.mockRestore()
  }
  stream.end(Buffer.from(json.slice(end)))
  const result = stream.getResult()
  expect([...result.traceTree]).toEqual([1, 0, 300, 4800, ...children.flatMap((child) => child.slice(0, 4))])
  expect([...result.traceTreeParents]).toEqual([0, ...children.map(() => 1)])
  expect(decodedBytes).toBeLessThanOrEqual(traceData.length + 1)
})

test.each([1, 2, 3, 5, 7, 19, 67])('preserves trace and following sections with %i-byte chunks', (chunkSize) => {
  const snapshot = createSnapshot([1, 0, 2, 48, [2, 0, 1, 16, [3, 0, 1, 32, []]]])
  const data = Buffer.from(JSON.stringify(snapshot))
  const stream = createHeapSnapshotWriteStream({ parseStrings: true })
  for (let offset = 0; offset < data.length; offset += chunkSize) {
    stream.write(data.subarray(offset, offset + chunkSize))
  }
  stream.end()
  const result = stream.getResult()
  expect({
    trace: [...result.traceTree],
    parents: [...result.traceTreeParents],
    functions: [...result.traceFunctionInfos],
    locations: [...result.locations],
    strings: result.strings,
  }).toEqual({
    trace: [1, 0, 2, 48, 2, 0, 1, 16, 3, 0, 1, 32],
    parents: [0, 1, 2],
    functions: snapshot.trace_function_infos,
    locations: snapshot.locations,
    strings: snapshot.strings,
  })
})

test('accepts an empty allocation trace and still reads following sections', () => {
  const snapshot = createSnapshot([])
  const stream = createHeapSnapshotWriteStream({ parseStrings: true })
  stream.end(Buffer.from(JSON.stringify(snapshot)))
  const result = stream.getResult()
  expect({ trace: [...result.traceTree], parents: [...result.traceTreeParents], strings: result.strings }).toEqual({
    trace: [],
    parents: [],
    strings: snapshot.strings,
  })
})

test('preserves trace bytes when the producer reuses a buffer after its write callback', async () => {
  const json = JSON.stringify(createSnapshot([1, 0, 1, 16, []]))
  const start = json.indexOf('"trace_tree":[') + '"trace_tree":['.length
  const fragment = Buffer.from('1,0,1,16,[')
  const stream = createHeapSnapshotWriteStream({ parseStrings: true })
  stream.write(Buffer.from(json.slice(0, start)))
  await new Promise<void>((resolve, reject) => {
    stream.write(fragment, (error) => (error ? reject(error) : resolve()))
  })
  fragment[0] = 57 // A producer may reuse its buffer after the write completes.
  stream.end(Buffer.from(json.slice(start + fragment.length)))
  await finished(stream)
  const result = stream.getResult()
  expect({ trace: [...result.traceTree], parents: [...result.traceTreeParents], strings: result.strings }).toEqual({
    trace: [1, 0, 1, 16],
    parents: [0],
    strings: ['root', 'allocate', 'fixture.js'],
  })
})

test('rejects an unfinished allocation trace', async () => {
  const json = JSON.stringify(createSnapshot([1, 0, 1, 16, []]))
  const end = json.indexOf(',"locations":') - 1
  const stream = createHeapSnapshotWriteStream()
  const completion = finished(stream)
  stream.end(Buffer.from(json.slice(0, end)))
  await expect(completion).rejects.toThrow('Heap snapshot parsing did not complete successfully')
})
