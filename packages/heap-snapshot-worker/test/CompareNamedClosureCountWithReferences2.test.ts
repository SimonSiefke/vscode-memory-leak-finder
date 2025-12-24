import { test, expect } from '@jest/globals'
import { compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2 } from '../src/parts/CompareNamedClosureCountWithReferences2/CompareNamedClosureCountWithReferences2.ts'
import type { Snapshot } from '../src/parts/Snapshot/Snapshot.ts'

test('should return empty object when no closures leaked', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: object_index=0, script_id=1, line=10, column=5
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0) - same
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1) - same
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same location
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual([])
})

test('should detect single leaked closure with property reference', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: object_index=0, script_id=1, line=10, column=5
    ]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 5,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 2, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3, id=3)
      3,
      1,
      4,
      30,
      1,
      0,
      0, // Object holding closure (node 4, id=4, name='myObject')
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      2,
      3,
      7, // Object -> Closure 2 (property 'callback', string index 3)
    ]),
    strings: ['', 'anonymous', 'myObject', 'callback'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure (count=1), object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure at same location (count=2, increased), object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
            {
              sourceNodeName: '',
              sourceNodeType: 'object',
              edgeType: 'property',
              edgeName: 'callback',
              path: '[Object 1].callback',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should detect single leaked closure with array element reference', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 5,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 2, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3, id=3)
      3,
      1,
      4,
      30,
      2,
      0,
      0, // Array holding closure (node 4, id=4, name='Array', edge_count=2)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      1,
      0,
      7, // Array -> Closure 2 (element [0], name_or_index=0 for element type)
    ]),
    strings: ['', 'anonymous', 'Array'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'object',
              edgeType: 'element',
              edgeName: '[0]',
              path: '[Array 1][0]',
              count: 1,
            },
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should detect single leaked closure with context reference', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 5,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 2, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3, id=3)
      5,
      0,
      5,
      50,
      1,
      0,
      0, // Parent Closure (node 4, id=5)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      0,
      0,
      7, // Parent Closure -> Closure 2 (context edge, name_or_index=0)
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
            {
              sourceNodeName: '',
              sourceNodeType: 'object',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 1].context',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should detect single leaked closure with multiple references', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 7,
    edge_count: 5,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 2, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3, id=3)
      3,
      1,
      4,
      30,
      2,
      0,
      0, // Object (node 4, id=4, name='myObject', edge_count=2)
      3,
      1,
      5,
      30,
      1,
      0,
      0, // Array (node 5, id=5, name='Array', edge_count=1)
      5,
      0,
      6,
      50,
      1,
      0,
      0, // Parent Closure (node 6, id=6)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      2,
      0,
      7, // Object -> Closure 2 (property 'callback')
      1,
      0,
      7, // Array -> Closure 2 (element [0])
      0,
      0,
      7, // Parent Closure -> Closure 2 (context)
    ]),
    strings: ['', 'anonymous', 'myObject', 'Array', 'callback'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'object',
              edgeType: 'element',
              edgeName: '[0]',
              path: '[Array 3][0]',
              count: 1,
            },
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
            {
              sourceNodeName: '',
              sourceNodeType: 'object',
              edgeType: 'property',
              edgeName: '<string_0>',
              path: '[Object 1].<string_0>',
              count: 1,
            },
            {
              sourceNodeName: 'anonymous',
              sourceNodeType: 'object',
              edgeType: 'context',
              edgeName: 'context',
              path: 'anonymous.context',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should detect leaked closures at different locations with different references', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 8,
    edge_count: 4,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK at location 1
      5,
      0,
      4,
      50,
      1,
      0,
      0, // Closure 3 (node 2, id=4) - NEW LEAK at location 2
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 3, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 4, id=3)
      3,
      0,
      5,
      30,
      1,
      0,
      0, // Context 3 (node 5, id=5)
      3,
      1,
      6,
      30,
      1,
      0,
      0, // Object (node 6, id=6, name='obj1')
      3,
      1,
      7,
      30,
      1,
      0,
      0, // Array (node 7, id=7, name='arr1')
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      0,
      3,
      21, // Closure 3 -> Context 3
      2,
      4,
      7, // obj1 -> Closure 2 (property 'handler', string index 4)
      1,
      0,
      14, // arr1 -> Closure 3 (element [0], name_or_index=0)
    ]),
    strings: ['', 'anonymous', 'obj1', 'arr1', 'handler'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
      14,
      1,
      20,
      10, // location 2: NEW closure, object_index=14 (Closure 3)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
            {
              sourceNodeName: '',
              sourceNodeType: 'object',
              edgeType: 'property',
              edgeName: 'handler',
              path: '[Object 1].handler',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should handle leaked closure with no references', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK (no incoming edges)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 2, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3, id=3)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should detect leaked closure with internal reference', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 5,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 2, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3, id=3)
      3,
      1,
      4,
      30,
      1,
      0,
      0, // Object (node 4, id=4, name='obj')
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      3,
      0,
      7, // obj -> Closure 2 (internal edge, name_or_index=0)
    ]),
    strings: ['', 'anonymous', 'obj'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
            {
              sourceNodeName: '',
              sourceNodeType: 'object',
              edgeType: 'internal',
              edgeName: 'internal',
              path: '[object 1].internal',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should include source node information in references', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 5,
    edge_count: 3,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 2, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3, id=3)
      3,
      1,
      4,
      30,
      1,
      0,
      0, // Object (node 4, id=4, name='myObject')
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      2,
      3,
      7, // myObject -> Closure 2 (property 'callback', string index 3)
    ]),
    strings: ['', 'anonymous', 'myObject', 'callback'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
            {
              sourceNodeName: '',
              sourceNodeType: 'object',
              edgeType: 'property',
              edgeName: 'callback',
              path: '[Object 1].callback',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test.skip('should handle multiple leaked closures at same location with different references', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 7,
    edge_count: 4,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK
      5,
      0,
      4,
      50,
      1,
      0,
      0, // Closure 3 (node 2, id=4) - NEW LEAK
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 3, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 4, id=3)
      3,
      0,
      5,
      30,
      1,
      0,
      0, // Context 3 (node 5, id=5)
      3,
      1,
      6,
      30,
      1,
      0,
      0, // Object (node 6, id=6, name='obj')
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      0,
      3,
      21, // Closure 3 -> Context 3
      2,
      4,
      7, // obj1 -> Closure 2 (property 'handler', string index 4)
      1,
      0,
      14, // arr1 -> Closure 3 (element [0], name_or_index=0)
    ]),
    strings: ['', 'anonymous', 'obj1', 'arr1', 'handler'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
      14,
      1,
      20,
      10, // location 2: NEW closure, object_index=14 (Closure 3)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const locationItem = findLocation(result, '1:10:5')
  expect(locationItem).toBeDefined()
  expect(locationItem?.references).toHaveLength(2)

  expect(locationItem?.references[0].references.length).toBeGreaterThan(0)
  expect(locationItem?.references[1].references.length).toBeGreaterThan(0)
})

test('should handle empty references array gracefully', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK (orphaned)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 2, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3, id=3)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2 (only outgoing edge)
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should handle closure with byte offset correctly', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 2, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3, id=3)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2, byte offset)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should group multiple identical closures together with count', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 6,
    edge_count: 4,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK (same location, same references - all point to shared context)
      5,
      0,
      4,
      50,
      1,
      0,
      0, // Closure 3 (node 2, id=4) - NEW LEAK (same location, same references - all point to shared context)
      5,
      0,
      6,
      50,
      1,
      0,
      0, // Closure 4 (node 3, id=6) - NEW LEAK (same location, same references - all point to shared context)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Shared Context (node 4, id=1) - all new closures point to this
      3,
      1,
      5,
      30,
      1,
      0,
      0, // Object (node 5, id=5, name='myObject') - references all new closures
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Shared Context
      0,
      3,
      21, // Closure 3 -> Shared Context
      0,
      3,
      28, // Closure 4 -> Shared Context
      2,
      3,
      7, // Object -> Closure 2 (property 'callback')
      2,
      3,
      14, // Object -> Closure 3 (property 'callback')
      2,
      3,
      21, // Object -> Closure 4 (property 'callback')
    ]),
    strings: ['', 'anonymous', 'myObject', 'callback'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
      14,
      1,
      10,
      5, // location 2: NEW closure, object_index=14 (Closure 3)
      21,
      1,
      10,
      5, // location 3: NEW closure, object_index=21 (Closure 4)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
            {
              sourceNodeName: '',
              sourceNodeType: 'object',
              edgeType: 'property',
              edgeName: 'callback',
              path: '[Object 1].callback',
              count: 1,
            },
          ],
          count: 1,
        },
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 2].context',
              count: 1,
            },
            {
              sourceNodeName: 'anonymous',
              sourceNodeType: 'object',
              edgeType: 'property',
              edgeName: 'callback',
              path: 'anonymous.callback',
              count: 1,
            },
          ],
          count: 1,
        },
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 4].context',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should group multiple identical reference paths together with count', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 6,
    edge_count: 4,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 2, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3, id=3)
      3,
      2,
      4,
      30,
      1,
      0,
      0, // Object 1 (node 4, id=4, name='myObject')
      3,
      2,
      5,
      30,
      1,
      0,
      0, // Object 2 (node 5, id=5, name='myObject') - same name, will create same path
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      2,
      3,
      7, // Object 1 -> Closure 2 (property 'callback', string index 3)
      2,
      3,
      14, // Object 2 -> Closure 2 (property 'callback', string index 3) - same name, same path
    ]),
    strings: ['', 'anonymous', 'myObject', 'callback'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
            {
              sourceNodeName: '',
              sourceNodeType: 'object',
              edgeType: 'property',
              edgeName: 'callback',
              path: '[Object 1].callback',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should sort closures by count (highest first)', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous', 'MyClosure'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 10,
    edge_count: 5,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      2,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2, name='MyClosure') - NEW LEAK (appears once)
      5,
      2,
      4,
      50,
      1,
      0,
      0, // Closure 3 (node 2, id=4, name='MyClosure') - NEW LEAK (appears once)
      5,
      0,
      6,
      50,
      1,
      0,
      0, // Closure 4 (node 3, id=6, name='anonymous') - NEW LEAK (appears twice, same references)
      5,
      0,
      8,
      50,
      1,
      0,
      0, // Closure 5 (node 4, id=8, name='anonymous') - NEW LEAK (appears twice, same references)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 5, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 6, id=3)
      3,
      0,
      5,
      30,
      1,
      0,
      0, // Context 3 (node 7, id=5)
      3,
      0,
      7,
      30,
      1,
      0,
      0, // Context 4 (node 8, id=7)
      3,
      0,
      9,
      30,
      1,
      0,
      0, // Context 5 (node 9, id=9)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      0,
      3,
      21, // Closure 3 -> Context 3
      0,
      3,
      28, // Closure 4 -> Context 4
      0,
      3,
      35, // Closure 5 -> Context 5
    ]),
    strings: ['', 'anonymous', 'MyClosure'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2, MyClosure)
      14,
      1,
      10,
      5, // location 2: NEW closure, object_index=14 (Closure 3, MyClosure)
      21,
      1,
      10,
      5, // location 3: NEW closure, object_index=21 (Closure 4, anonymous)
      28,
      1,
      10,
      5, // location 4: NEW closure, object_index=28 (Closure 5, anonymous)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'MyClosure',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
          ],
          count: 1,
        },
        {
          nodeName: 'MyClosure',
          references: [
            {
              sourceNodeName: 'MyClosure',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: 'MyClosure.context',
              count: 1,
            },
          ],
          count: 1,
        },
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: 'MyClosure',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: 'MyClosure.context',
              count: 1,
            },
          ],
          count: 1,
        },
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 6].context',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should sort reference paths by count (highest first)', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 6,
    edge_count: 5,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      0,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2) - NEW LEAK
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 2, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 3, id=3)
      3,
      1,
      4,
      30,
      2,
      0,
      0, // Object 1 (node 4, id=4, name='obj1', edge_count=2)
      3,
      1,
      5,
      30,
      1,
      0,
      0, // Object 2 (node 5, id=5, name='obj2', edge_count=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      2,
      3,
      7, // obj1 -> Closure 2 (property 'callback', string index 3) - first
      2,
      3,
      7, // obj1 -> Closure 2 (property 'callback', string index 3) - second (duplicate)
      2,
      4,
      7, // obj2 -> Closure 2 (property 'other', string index 4) - appears once
    ]),
    strings: ['', 'anonymous', 'obj1', 'obj2', 'callback', 'other'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'anonymous',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'object',
              edgeType: 'property',
              edgeName: 'obj2',
              path: '[Object 1].obj2',
              count: 2,
            },
            {
              sourceNodeName: '',
              sourceNodeType: 'closure',
              edgeType: 'context',
              edgeName: 'context',
              path: '[Closure 0].context',
              count: 1,
            },
            {
              sourceNodeName: 'anonymous',
              sourceNodeType: 'object',
              edgeType: 'property',
              edgeName: 'callback',
              path: 'anonymous.callback',
              count: 1,
            },
          ],
          count: 1,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})

test('should merge references with different node IDs in paths', async () => {
  const snapshotA: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 2,
    edge_count: 1,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0)
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'ResourceReasonPair'],
    locations: new Uint32Array([0, 1, 10, 5]),
  }

  const snapshotB: Snapshot = {
    meta: {
      node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp']],
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      edge_types: [['context', 'element', 'property', 'internal']],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    node_count: 10,
    edge_count: 7,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5,
      0,
      0,
      50,
      1,
      0,
      0, // Closure 1 (node 0, id=0) - same
      5,
      1,
      2,
      50,
      1,
      0,
      0, // Closure 2 (node 1, id=2, name='ResourceReasonPair') - NEW LEAK
      5,
      1,
      4,
      50,
      1,
      0,
      0, // Closure 3 (node 2, id=4, name='ResourceReasonPair') - NEW LEAK
      5,
      1,
      6,
      50,
      1,
      0,
      0, // Closure 4 (node 3, id=6, name='ResourceReasonPair') - NEW LEAK
      3,
      0,
      1,
      30,
      1,
      0,
      0, // Context 1 (node 4, id=1)
      3,
      0,
      3,
      30,
      1,
      0,
      0, // Context 2 (node 5, id=3)
      3,
      0,
      5,
      30,
      1,
      0,
      0, // Context 3 (node 6, id=5)
      3,
      0,
      7,
      30,
      1,
      0,
      0, // Context 4 (node 7, id=7)
      3,
      0,
      8,
      30,
      1,
      0,
      0, // Array 1 (node 8, id=3018681)
      3,
      0,
      9,
      30,
      1,
      0,
      0, // Array 2 (node 9, id=3080985)
    ]),
    edges: new Uint32Array([
      0,
      3,
      7, // Closure 1 -> Context 1
      0,
      3,
      14, // Closure 2 -> Context 2
      0,
      3,
      21, // Closure 3 -> Context 3
      0,
      3,
      28, // Closure 4 -> Context 4
      3,
      0,
      7, // Array 1 -> Closure 2 (internal edge)
      3,
      0,
      14, // Array 2 -> Closure 3 (internal edge)
      3,
      0,
      21, // Array 2 -> Closure 4 (internal edge)
    ]),
    strings: ['', 'ResourceReasonPair'],
    locations: new Uint32Array([
      0,
      1,
      10,
      5, // location 0: same closure, object_index=0
      7,
      1,
      10,
      5, // location 1: NEW closure, object_index=7 (Closure 2)
      14,
      1,
      10,
      5, // location 2: NEW closure, object_index=14 (Closure 3)
      21,
      1,
      10,
      5, // location 3: NEW closure, object_index=21 (Closure 4)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  // All three ResourceReasonPair closures should be merged into one with count 3
  // The references with different array IDs should also be merged
  const expectedResult = [
    {
      location: '1:10:5',
      references: [
        {
          nodeName: 'ResourceReasonPair',
          references: [
            {
              sourceNodeName: '',
              sourceNodeType: 'array',
              edgeType: 'internal',
              edgeName: 'internal',
              path: '[array 3018681].internal',
              count: 3,
            },
          ],
          count: 3,
        },
      ],
    },
  ]
  expect(result).toEqual(expectedResult)
})
