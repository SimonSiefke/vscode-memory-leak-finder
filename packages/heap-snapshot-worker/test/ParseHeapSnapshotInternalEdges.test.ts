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
      nameOrIndex: 0,
      toNode: 1,
      type: 'element',
    },
  ])
})

test('preserves numeric element and hidden indices while resolving named edge strings', () => {
  const edgeFields = ['to_node', 'name_or_index', 'type']
  const edgeTypes = ['property', 'hidden', 'element', 'internal']
  const edges = [7, 1, 2, 14, 1, 1, 21, 1, 0, 28, 1, 3]
  const strings = ['unrelated', 'tabs']
  expect(ParseHeapSnapshotInternalEdges.parseHeapSnapshotInternalEdges(edges, edgeFields, edgeTypes, 7, strings)).toEqual([
    { toNode: 1, nameOrIndex: 1, type: 'element' },
    { toNode: 2, nameOrIndex: 1, type: 'hidden' },
    { toNode: 3, nameOrIndex: 'tabs', type: 'property' },
    { toNode: 4, nameOrIndex: 'tabs', type: 'internal' },
  ])
})
