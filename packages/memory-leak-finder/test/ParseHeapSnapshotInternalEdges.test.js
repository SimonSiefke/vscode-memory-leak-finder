import * as ParseHeapSnapshotInternalEdges from '../src/parts/ParseHeapSnapshotInternalEdges/ParseHeapSnapshotInternalEdges.js'

test('single node', () => {
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const edgeTypes = ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']
  const edges = [1, 1, 7]
  expect(ParseHeapSnapshotInternalEdges.parseHeapSnapshotInternalEdges(edges, edgeFields, edgeTypes)).toEqual([
    {
      nameOrIndex: 1,
      toNode: 7,
      type: 'element',
    },
  ])
})
