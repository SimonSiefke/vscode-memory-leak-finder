import { test, expect } from '@jest/globals'
import { compareHeapsnapshotArraysInternal2 } from '../src/parts/CompareHeapsnapshotArraysInternal2/CompareHeapsnapshotArraysInternal2.ts'

const createHeapSnapshot = (nodes: number[], edges: number[], strings: string[]) => {
  return {
      meta: {
        node_types: [
          [
            'hidden',
            'array',
            'string',
            'object',
            'code',
            'closure',
            'regexp',
            'number',
            'native',
            'synthetic',
            'concatenated string',
            'sliced string',
            'symbol',
            'bigint',
            'object shape',
          ],
        ],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes,
    edges,
    strings,
    locations: [],
  }
}

test('compareHeapsnapshotArraysInternal2 - no leaks', async () => {
  const strings = ['', 'Array', 'globalThis']
  const nodes = [
    // globalThis node at index 0
    9, // type: synthetic
    2, // name: globalThis (string index 2)
    1, // id: 1
    100, // self_size
    1, // edge_count: 1
    0, // trace_node_id
    0, // detachedness
    // Array node at index 7
    3, // type: object
    1, // name: Array (string index 1)
    2, // id: 2
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
  ]
  const edges = [
    // globalThis -> Array via 'myArray' property
    2, // type: property
    3, // name_or_index: 'myArray' (string index 3, but we'll use index 3 for simplicity)
    7, // to_node: Array node at index 7
  ]

  const snapshotA = createHeapSnapshot(nodes, edges, ['', 'Array', 'globalThis', 'myArray'])
  const snapshotB = createHeapSnapshot(nodes, edges, ['', 'Array', 'globalThis', 'myArray'])

  const result = await compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
  expect(result).toEqual([])
})

test('compareHeapsnapshotArraysInternal2 - one array count increased', async () => {
  const strings = ['', 'Array', 'globalThis', 'myArray']
  const nodesA = [
    // globalThis node at index 0
    9, // type: synthetic
    2, // name: globalThis
    1, // id: 1
    100, // self_size
    1, // edge_count: 1
    0, // trace_node_id
    0, // detachedness
    // Array node at index 7
    3, // type: object
    1, // name: Array
    2, // id: 2
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
  ]
  const edgesA = [
    // globalThis -> Array via 'myArray'
    2, // type: property
    3, // name_or_index: 'myArray'
    7, // to_node: Array node
  ]

  const nodesB = [
    // globalThis node at index 0
    9, // type: synthetic
    2, // name: globalThis
    1, // id: 1
    100, // self_size
    2, // edge_count: 2 (increased)
    0, // trace_node_id
    0, // detachedness
    // Array node 1 at index 7
    3, // type: object
    1, // name: Array
    2, // id: 2
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
    // Array node 2 at index 14
    3, // type: object
    1, // name: Array
    3, // id: 3
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
  ]
  const edgesB = [
    // globalThis -> Array 1 via 'myArray'
    2, // type: property
    3, // name_or_index: 'myArray'
    7, // to_node: Array node 1
    // globalThis -> Array 2 via 'myArray'
    2, // type: property
    3, // name_or_index: 'myArray'
    14, // to_node: Array node 2
  ]

  const snapshotA = createHeapSnapshot(nodesA, edgesA, strings)
  const snapshotB = createHeapSnapshot(nodesB, edgesB, strings)

  const result = await compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
  expect(result).toEqual([
    {
      name: 'myArray',
      count: 2,
      delta: 1,
    },
  ])
})

test('compareHeapsnapshotArraysInternal2 - new array appeared', async () => {
  const strings = ['', 'Array', 'globalThis', 'myArray', 'newArray']
  const nodesA = [
    // globalThis node at index 0
    9, // type: synthetic
    2, // name: globalThis
    1, // id: 1
    100, // self_size
    1, // edge_count: 1
    0, // trace_node_id
    0, // detachedness
    // Array node at index 7
    3, // type: object
    1, // name: Array
    2, // id: 2
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
  ]
  const edgesA = [
    // globalThis -> Array via 'myArray'
    2, // type: property
    3, // name_or_index: 'myArray'
    7, // to_node: Array node
  ]

  const nodesB = [
    // globalThis node at index 0
    9, // type: synthetic
    2, // name: globalThis
    1, // id: 1
    100, // self_size
    2, // edge_count: 2
    0, // trace_node_id
    0, // detachedness
    // Array node 1 at index 7
    3, // type: object
    1, // name: Array
    2, // id: 2
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
    // Array node 2 at index 14
    3, // type: object
    1, // name: Array
    3, // id: 3
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
  ]
  const edgesB = [
    // globalThis -> Array 1 via 'myArray'
    2, // type: property
    3, // name_or_index: 'myArray'
    7, // to_node: Array node 1
    // globalThis -> Array 2 via 'newArray'
    2, // type: property
    4, // name_or_index: 'newArray'
    14, // to_node: Array node 2
  ]

  const snapshotA = createHeapSnapshot(nodesA, edgesA, strings)
  const snapshotB = createHeapSnapshot(nodesB, edgesB, strings)

  const result = await compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
  expect(result).toEqual([
    {
      name: 'newArray',
      count: 1,
      delta: 1,
    },
  ])
})

test('compareHeapsnapshotArraysInternal2 - multiple arrays with different changes', async () => {
  const strings = ['', 'Array', 'globalThis', 'array1', 'array2', 'array3']
  const nodesA = [
    // globalThis node at index 0
    9, // type: synthetic
    2, // name: globalThis
    1, // id: 1
    100, // self_size
    2, // edge_count: 2
    0, // trace_node_id
    0, // detachedness
    // Array node 1 at index 7
    3, // type: object
    1, // name: Array
    2, // id: 2
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
    // Array node 2 at index 14
    3, // type: object
    1, // name: Array
    3, // id: 3
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
  ]
  const edgesA = [
    // globalThis -> Array 1 via 'array1'
    2, // type: property
    3, // name_or_index: 'array1'
    7, // to_node: Array node 1
    // globalThis -> Array 2 via 'array2'
    2, // type: property
    4, // name_or_index: 'array2'
    14, // to_node: Array node 2
  ]

  const nodesB = [
    // globalThis node at index 0
    9, // type: synthetic
    2, // name: globalThis
    1, // id: 1
    100, // self_size
    5, // edge_count: 5
    0, // trace_node_id
    0, // detachedness
    // Array node 1 at index 7 (array1 - first instance)
    3, // type: object
    1, // name: Array
    2, // id: 2
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
    // Array node 2 at index 14 (array1 - second instance)
    3, // type: object
    1, // name: Array
    4, // id: 4
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
    // Array node 3 at index 21 (array1 - third instance)
    3, // type: object
    1, // name: Array
    5, // id: 5
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
    // Array node 4 at index 28 (array2 - same count)
    3, // type: object
    1, // name: Array
    3, // id: 3
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
    // Array node 5 at index 35 (array3 - new array)
    3, // type: object
    1, // name: Array
    6, // id: 6
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
  ]
  const edgesB = [
    // globalThis -> Array 1 via 'array1' (first instance)
    2, // type: property
    3, // name_or_index: 'array1'
    7, // to_node: Array node 1
    // globalThis -> Array 2 via 'array1' (second instance)
    2, // type: property
    3, // name_or_index: 'array1'
    14, // to_node: Array node 2
    // globalThis -> Array 3 via 'array1' (third instance)
    2, // type: property
    3, // name_or_index: 'array1'
    21, // to_node: Array node 3
    // globalThis -> Array 4 via 'array2' (count stays same: 1)
    2, // type: property
    4, // name_or_index: 'array2'
    28, // to_node: Array node 4
    // globalThis -> Array 5 via 'array3' (new array: 1)
    2, // type: property
    5, // name_or_index: 'array3'
    35, // to_node: Array node 5
  ]

  const snapshotA = createHeapSnapshot(nodesA, edgesA, strings)
  const snapshotB = createHeapSnapshot(nodesB, edgesB, strings)

  const result = await compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
  expect(result).toEqual([
    {
      name: 'array1',
      count: 3,
      delta: 2,
    },
    {
      name: 'array3',
      count: 1,
      delta: 1,
    },
  ])
})

test('compareHeapsnapshotArraysInternal2 - array count decreased (not a leak)', async () => {
  const strings = ['', 'Array', 'globalThis', 'myArray']
  const nodesA = [
    // globalThis node at index 0
    9, // type: synthetic
    2, // name: globalThis
    1, // id: 1
    100, // self_size
    2, // edge_count: 2
    0, // trace_node_id
    0, // detachedness
    // Array node 1 at index 7
    3, // type: object
    1, // name: Array
    2, // id: 2
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
    // Array node 2 at index 14
    3, // type: object
    1, // name: Array
    3, // id: 3
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
  ]
  const edgesA = [
    // globalThis -> Array 1 via 'myArray'
    2, // type: property
    3, // name_or_index: 'myArray'
    7, // to_node: Array node 1
    // globalThis -> Array 2 via 'myArray'
    2, // type: property
    3, // name_or_index: 'myArray'
    14, // to_node: Array node 2
  ]

  const nodesB = [
    // globalThis node at index 0
    9, // type: synthetic
    2, // name: globalThis
    1, // id: 1
    100, // self_size
    1, // edge_count: 1 (decreased)
    0, // trace_node_id
    0, // detachedness
    // Array node at index 7
    3, // type: object
    1, // name: Array
    2, // id: 2
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
  ]
  const edgesB = [
    // globalThis -> Array via 'myArray'
    2, // type: property
    3, // name_or_index: 'myArray'
    7, // to_node: Array node
  ]

  const snapshotA = createHeapSnapshot(nodesA, edgesA, strings)
  const snapshotB = createHeapSnapshot(nodesB, edgesB, strings)

  const result = await compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
  expect(result).toEqual([])
})
