import * as ParseHeapSnapshotInternalGraph from '../src/parts/ParseHeapSnapshotInternalGraph/ParseHeapSnapshotInternalGraph.js'

test('single node', () => {
  const nodes = [
    {
      detachedness: 0,
      edgeCount: 0,
      id: 0,
      name: 0,
      selfSize: 0,
      traceNodeId: 0,
      type: 0,
    },
  ]
  const edges = []
  expect(ParseHeapSnapshotInternalGraph.parseHeapSnapshotInternalGraph(nodes, edges)).toEqual({
    0: [],
  })
})

test('two unconnected nodes', () => {
  const nodes = [
    {
      detachedness: 0,
      edgeCount: 0,
      id: 0,
      name: 0,
      selfSize: 0,
      traceNodeId: 0,
      type: 0,
    },
    {
      detachedness: 0,
      edgeCount: 0,
      id: 1,
      name: 0,
      selfSize: 0,
      traceNodeId: 0,
      type: 0,
    },
  ]
  const edges = []
  expect(ParseHeapSnapshotInternalGraph.parseHeapSnapshotInternalGraph(nodes, edges)).toEqual({
    0: [],
    1: [],
  })
})

test('two connected nodes', () => {
  const nodes = [
    {
      detachedness: 0,
      edgeCount: 1,
      id: 0,
      name: 0,
      selfSize: 0,
      traceNodeId: 0,
      type: 0,
    },
    {
      detachedness: 0,
      edgeCount: 0,
      id: 1,
      name: 0,
      selfSize: 0,
      traceNodeId: 0,
      type: 0,
    },
  ]
  const edges = [
    {
      nameOrIndex: 1,
      toNode: 1,
      type: 1,
    },
  ]
  expect(ParseHeapSnapshotInternalGraph.parseHeapSnapshotInternalGraph(nodes, edges)).toEqual({
    0: [1],
    1: [],
  })
})
