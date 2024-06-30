import * as ParseHeapSnapshotInternalEdges from '../src/parts/ParseHeapSnapshotInternalEdges/ParseHeapSnapshotInternalEdges.js'
import { test, expect } from '@jest/globals'

test('single node', () => {
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const edgeTypes = ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']
  const edges = [1, 0, 7]
  const strings = ['a']
  const nodeFieldCount = 7
  expect(ParseHeapSnapshotInternalEdges.parseHeapSnapshotInternalEdges(edges, edgeFields, edgeTypes, nodeFieldCount, strings)).toEqual([
    {
      nameOrIndex: 'a',
      toNode: 1,
      type: 'element',
    },
  ])
})
