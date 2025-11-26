import { test, expect } from '@jest/globals'
import { compareHeapsnapshotArraysInternal2 } from '../src/parts/CompareHeapsnapshotArraysInternal2/CompareHeapsnapshotArraysInternal2.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('compareHeapsnapshotArraysInternal2 - no leaks', async () => {
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

  const snapshotA: Snapshot = {
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
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodes),
    edges: new Uint32Array(edges),
    strings: ['', 'Array', 'globalThis', 'myArray'],
    locations: new Uint32Array([]),
  }
  const snapshotB: Snapshot = {
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
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodes),
    edges: new Uint32Array(edges),
    strings: ['', 'Array', 'globalThis', 'myArray'],
    locations: new Uint32Array([]),
  }

  const result = await compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
  expect(result).toEqual([])
})

test('compareHeapsnapshotArraysInternal2 - one array count increased', async () => {
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

  const snapshotA: Snapshot = {
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
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesA),
    edges: new Uint32Array(edgesA),
    strings: ['', 'Array', 'globalThis', 'myArray'],
    locations: new Uint32Array([]),
  }
  const snapshotB: Snapshot = {
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
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesB),
    edges: new Uint32Array(edgesB),
    strings: ['', 'Array', 'globalThis', 'myArray'],
    locations: new Uint32Array([]),
  }

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

  const snapshotA: Snapshot = {
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
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesA),
    edges: new Uint32Array(edgesA),
    strings: ['', 'Array', 'globalThis', 'myArray', 'newArray'],
    locations: new Uint32Array([]),
  }
  const snapshotB: Snapshot = {
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
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesB),
    edges: new Uint32Array(edgesB),
    strings: ['', 'Array', 'globalThis', 'myArray', 'newArray'],
    locations: new Uint32Array([]),
  }

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

  const snapshotA: Snapshot = {
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
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesA),
    edges: new Uint32Array(edgesA),
    strings: ['', 'Array', 'globalThis', 'array1', 'array2', 'array3'],
    locations: new Uint32Array([]),
  }
  const snapshotB: Snapshot = {
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
    node_count: 6,
    edge_count: 5,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesB),
    edges: new Uint32Array(edgesB),
    strings: ['', 'Array', 'globalThis', 'array1', 'array2', 'array3'],
    locations: new Uint32Array([]),
  }

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

  const snapshotA: Snapshot = {
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
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesA),
    edges: new Uint32Array(edgesA),
    strings: ['', 'Array', 'globalThis', 'myArray'],
    locations: new Uint32Array([]),
  }
  const snapshotB: Snapshot = {
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
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesB),
    edges: new Uint32Array(edgesB),
    strings: ['', 'Array', 'globalThis', 'myArray'],
    locations: new Uint32Array([]),
  }

  const result = await compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
  expect(result).toEqual([])
})

test('compareHeapsnapshotArraysInternal2 - array with source node context', async () => {
  const nodesA = [
    // configurationProperties object at index 0
    3, // type: object
    3, // name: configurationProperties (string index 3)
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
    // configurationProperties -> Array via 'problemMatchers' property
    2, // type: property
    4, // name_or_index: 'problemMatchers' (string index 4)
    7, // to_node: Array node at index 7
  ]

  const nodesB = [
    // configurationProperties object at index 0
    3, // type: object
    3, // name: configurationProperties
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
    // configurationProperties -> Array 1 via 'problemMatchers'
    2, // type: property
    4, // name_or_index: 'problemMatchers'
    7, // to_node: Array node 1
    // configurationProperties -> Array 2 via 'problemMatchers'
    2, // type: property
    4, // name_or_index: 'problemMatchers'
    14, // to_node: Array node 2
  ]

  const snapshotA: Snapshot = {
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
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesA),
    edges: new Uint32Array(edgesA),
    strings: ['', 'Array', 'globalThis', 'configurationProperties', 'problemMatchers'],
    locations: new Uint32Array([]),
  }
  const snapshotB: Snapshot = {
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
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesB),
    edges: new Uint32Array(edgesB),
    strings: ['', 'Array', 'globalThis', 'configurationProperties', 'problemMatchers'],
    locations: new Uint32Array([]),
  }

  const result = await compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
  expect(result).toEqual([
    {
      name: 'configurationProperties.problemMatchers',
      count: 2,
      delta: 1,
    },
  ])
})

test('compareHeapsnapshotArraysInternal2 - array without meaningful source context', async () => {
  const nodesA = [
    // Object node at index 0 (generic Object, should be filtered out)
    3, // type: object
    2, // name: Object (string index 2)
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
    // Object -> Array via 'items' property
    2, // type: property
    4, // name_or_index: 'items' (string index 4)
    7, // to_node: Array node at index 7
  ]

  const nodesB = [
    // Object node at index 0
    3, // type: object
    2, // name: Object
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
    // Object -> Array 1 via 'items'
    2, // type: property
    4, // name_or_index: 'items'
    7, // to_node: Array node 1
    // Object -> Array 2 via 'items'
    2, // type: property
    4, // name_or_index: 'items'
    14, // to_node: Array node 2
  ]

  const snapshotA: Snapshot = {
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
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesA),
    edges: new Uint32Array(edgesA),
    strings: ['', 'Array', 'Object', 'globalThis', 'items'],
    locations: new Uint32Array([]),
  }
  const snapshotB: Snapshot = {
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
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesB),
    edges: new Uint32Array(edgesB),
    strings: ['', 'Array', 'Object', 'globalThis', 'items'],
    locations: new Uint32Array([]),
  }

  const result = await compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
  // Generic "Object" name should be filtered out, so just use edge name
  expect(result).toEqual([
    {
      name: 'items',
      count: 2,
      delta: 1,
    },
  ])
})

test('compareHeapsnapshotArraysInternal2 - array with multiple names and source context', async () => {
  const nodesA = [
    // configSchema object at index 0
    3, // type: object
    3, // name: configSchema (string index 3)
    1, // id: 1
    100, // self_size
    1, // edge_count: 1
    0, // trace_node_id
    0, // detachedness
    // settings object at index 7
    3, // type: object
    4, // name: settings (string index 4)
    2, // id: 2
    100, // self_size
    1, // edge_count: 1
    0, // trace_node_id
    0, // detachedness
    // Array node at index 14
    3, // type: object
    1, // name: Array
    3, // id: 3
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
  ]
  const edgesA = [
    // configSchema -> Array via 'properties' property
    2, // type: property
    5, // name_or_index: 'properties'
    14, // to_node: Array node
    // settings -> Array via 'items' property
    2, // type: property
    6, // name_or_index: 'items'
    14, // to_node: Array node
  ]

  const nodesB = [
    // configSchema object at index 0
    3, // type: object
    3, // name: configSchema
    1, // id: 1
    100, // self_size
    1, // edge_count: 1
    0, // trace_node_id
    0, // detachedness
    // settings object at index 7
    3, // type: object
    4, // name: settings
    2, // id: 2
    100, // self_size
    1, // edge_count: 1
    0, // trace_node_id
    0, // detachedness
    // Array node at index 14
    3, // type: object
    1, // name: Array
    3, // id: 3
    64, // self_size
    0, // edge_count: 0
    0, // trace_node_id
    0, // detachedness
  ]
  const edgesB = [
    // configSchema -> Array via 'properties'
    2, // type: property
    5, // name_or_index: 'properties'
    14, // to_node: Array node
    // settings -> Array via 'items'
    2, // type: property
    6, // name_or_index: 'items'
    14, // to_node: Array node
  ]

  const snapshotA: Snapshot = {
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
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesA),
    edges: new Uint32Array(edgesA),
    strings: ['', 'Array', 'globalThis', 'configSchema', 'settings', 'properties', 'items'],
    locations: new Uint32Array([]),
  }
  const snapshotB: Snapshot = {
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
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array(nodesB),
    edges: new Uint32Array(edgesB),
    strings: ['', 'Array', 'globalThis', 'configSchema', 'settings', 'properties', 'items'],
    locations: new Uint32Array([]),
  }

  const result = await compareHeapsnapshotArraysInternal2(snapshotA, snapshotB)
  // Array should have both names with source context, sorted alphabetically
  // Since counts are the same, no leak is reported
  expect(result).toEqual([])
})
