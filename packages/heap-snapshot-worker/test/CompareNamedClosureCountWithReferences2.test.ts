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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: object_index=0, script_id=1, line=10, column=5
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0) - same
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1) - same
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same location
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toEqual({})
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: object_index=0, script_id=1, line=10, column=5
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 1, id=2) - NEW LEAK
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 2, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3, id=3)
      3, 1, 4, 30, 1, 0, 0, // Object holding closure (node 4, id=4, name='myObject')
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 14, // Closure 2 -> Context 2
      2, 0, 7, // Object -> Closure 2 (property 'callback')
    ]),
    strings: ['', 'anonymous', 'myObject', 'callback'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure (count=1), object_index=0
      7, 1, 10, 5, // location 1: NEW closure at same location (count=2, increased), object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toHaveProperty('1:10:5')
  expect(result['1:10:5']).toHaveLength(1)
  expect(result['1:10:5'][0].nodeIndex).toBe(7)
  expect(result['1:10:5'][0].nodeName).toBe('anonymous')
  expect(result['1:10:5'][0].nodeId).toBe(2)
  expect(result['1:10:5'][0].references.length).toBeGreaterThan(0)
  const propertyRef = result['1:10:5'][0].references.find((r) => r.edgeType === 'property')
  expect(propertyRef).toBeDefined()
  expect(propertyRef?.edgeName).toBe('callback')
  expect(propertyRef?.path).toContain('callback')
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5,
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 1, id=2) - NEW LEAK
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 2, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3, id=3)
      3, 1, 4, 30, 2, 0, 0, // Array holding closure (node 4, id=4, name='Array', edge_count=2)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 14, // Closure 2 -> Context 2
      1, 0, 7, // Array -> Closure 2 (element [0])
    ]),
    strings: ['', 'anonymous', 'Array'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toHaveProperty('1:10:5')
  expect(result['1:10:5']).toHaveLength(1)
  expect(result['1:10:5'][0].nodeId).toBe(2)
  expect(result['1:10:5'][0].references.length).toBeGreaterThan(0)
  const elementRef = result['1:10:5'][0].references.find((r) => r.edgeType === 'element')
  expect(elementRef).toBeDefined()
  expect(elementRef?.edgeName).toBe('[0]')
  expect(elementRef?.path).toContain('[0]')
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5,
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 1, id=2) - NEW LEAK
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 2, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3, id=3)
      5, 0, 5, 50, 1, 0, 0, // Parent Closure (node 4, id=5)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 14, // Closure 2 -> Context 2
      0, 0, 7, // Parent Closure -> Closure 2 (context edge)
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toHaveProperty('1:10:5')
  expect(result['1:10:5']).toHaveLength(1)
  expect(result['1:10:5'][0].nodeId).toBe(2)
  expect(result['1:10:5'][0].references.length).toBeGreaterThan(0)
  const contextRef = result['1:10:5'][0].references.find((r) => r.edgeType === 'context')
  expect(contextRef).toBeDefined()
  expect(contextRef?.edgeName).toBe('context')
  expect(contextRef?.path).toContain('context')
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5,
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
    node_count: 7,
    edge_count: 5,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 1, id=2) - NEW LEAK
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 2, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3, id=3)
      3, 1, 4, 30, 2, 0, 0, // Object (node 4, id=4, name='myObject', edge_count=2)
      3, 1, 5, 30, 1, 0, 0, // Array (node 5, id=5, name='Array', edge_count=1)
      5, 0, 6, 50, 1, 0, 0, // Parent Closure (node 6, id=6)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 14, // Closure 2 -> Context 2
      2, 0, 7, // Object -> Closure 2 (property 'callback')
      1, 0, 7, // Array -> Closure 2 (element [0])
      0, 0, 7, // Parent Closure -> Closure 2 (context)
    ]),
    strings: ['', 'anonymous', 'myObject', 'Array', 'callback'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toHaveProperty('1:10:5')
  expect(result['1:10:5']).toHaveLength(1)
  expect(result['1:10:5'][0].nodeId).toBe(2)
  expect(result['1:10:5'][0].references.length).toBeGreaterThanOrEqual(3)
  
  const propertyRef = result['1:10:5'][0].references.find((r) => r.edgeType === 'property')
  expect(propertyRef).toBeDefined()
  
  const elementRef = result['1:10:5'][0].references.find((r) => r.edgeType === 'element')
  expect(elementRef).toBeDefined()
  
  const contextRef = result['1:10:5'][0].references.find((r) => r.edgeType === 'context')
  expect(contextRef).toBeDefined()
})

test('should detect multiple leaked closures with different references', async () => {
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5,
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
    node_count: 8,
    edge_count: 4,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 1, id=2) - NEW LEAK at location 1
      5, 0, 4, 50, 1, 0, 0, // Closure 3 (node 2, id=4) - NEW LEAK at location 2
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 3, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 4, id=3)
      3, 0, 5, 30, 1, 0, 0, // Context 3 (node 5, id=5)
      3, 1, 6, 30, 1, 0, 0, // Object (node 6, id=6, name='obj1')
      3, 1, 7, 30, 1, 0, 0, // Array (node 7, id=7, name='arr1')
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 14, // Closure 2 -> Context 2
      0, 3, 21, // Closure 3 -> Context 3
      2, 0, 7, // obj1 -> Closure 2 (property 'handler')
      1, 0, 14, // arr1 -> Closure 3 (element [0])
    ]),
    strings: ['', 'anonymous', 'obj1', 'arr1', 'handler'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure, object_index=7 (Closure 2)
      14, 1, 20, 10, // location 2: NEW closure, object_index=14 (Closure 3)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toHaveProperty('1:10:5')
  expect(result).toHaveProperty('1:20:10')
  expect(result['1:10:5']).toHaveLength(1)
  expect(result['1:20:10']).toHaveLength(1)
  
  // Closure 2 should have property reference
  const closure2 = result['1:10:5'][0]
  expect(closure2.nodeId).toBe(2)
  const propertyRef = closure2.references.find((r) => r.edgeType === 'property')
  expect(propertyRef).toBeDefined()
  
  // Closure 3 should have element reference
  const closure3 = result['1:20:10'][0]
  expect(closure3.nodeId).toBe(4)
  const elementRef = closure3.references.find((r) => r.edgeType === 'element')
  expect(elementRef).toBeDefined()
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5,
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
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 1, id=2) - NEW LEAK (no incoming edges)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 2, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3, id=3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 14, // Closure 2 -> Context 2
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toHaveProperty('1:10:5')
  expect(result['1:10:5']).toHaveLength(1)
  expect(result['1:10:5'][0].nodeId).toBe(2)
  // Closure 2 has no incoming edges, so references should be empty or only contain context
  expect(Array.isArray(result['1:10:5'][0].references)).toBe(true)
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5,
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 1, id=2) - NEW LEAK
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 2, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3, id=3)
      3, 1, 4, 30, 1, 0, 0, // Object (node 4, id=4, name='obj')
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 14, // Closure 2 -> Context 2
      3, 0, 7, // obj -> Closure 2 (internal edge)
    ]),
    strings: ['', 'anonymous', 'obj'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toHaveProperty('1:10:5')
  expect(result['1:10:5']).toHaveLength(1)
  expect(result['1:10:5'][0].nodeId).toBe(2)
  expect(result['1:10:5'][0].references.length).toBeGreaterThan(0)
  const internalRef = result['1:10:5'][0].references.find((r) => r.edgeType === 'internal')
  expect(internalRef).toBeDefined()
  expect(internalRef?.edgeName).toBe('internal')
  expect(internalRef?.path).toContain('internal')
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5,
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 1, id=2) - NEW LEAK
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 2, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3, id=3)
      3, 1, 4, 30, 1, 0, 0, // Object (node 4, id=4, name='myObject')
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 14, // Closure 2 -> Context 2
      2, 0, 7, // myObject -> Closure 2 (property 'callback')
    ]),
    strings: ['', 'anonymous', 'myObject', 'callback'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toHaveProperty('1:10:5')
  const ref = result['1:10:5'][0].references[0]
  expect(ref).toHaveProperty('sourceNodeIndex')
  expect(ref).toHaveProperty('sourceNodeId')
  expect(ref).toHaveProperty('sourceNodeName')
  expect(ref).toHaveProperty('sourceNodeType')
  expect(ref).toHaveProperty('edgeType')
  expect(ref).toHaveProperty('edgeName')
  expect(ref).toHaveProperty('path')
  expect(typeof ref.sourceNodeIndex).toBe('number')
  expect(typeof ref.sourceNodeId).toBe('number')
})

test('should handle multiple leaked closures at same location with different references', async () => {
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5,
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
    node_count: 7,
    edge_count: 4,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 1, id=2) - NEW LEAK
      5, 0, 4, 50, 1, 0, 0, // Closure 3 (node 2, id=4) - NEW LEAK
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 3, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 4, id=3)
      3, 0, 5, 30, 1, 0, 0, // Context 3 (node 5, id=5)
      3, 1, 6, 30, 1, 0, 0, // Object (node 6, id=6, name='obj')
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 14, // Closure 2 -> Context 2
      0, 3, 21, // Closure 3 -> Context 3
      2, 0, 7, // obj -> Closure 2 (property 'handler1')
      2, 1, 14, // obj -> Closure 3 (property 'handler2')
    ]),
    strings: ['', 'anonymous', 'obj', 'handler1', 'handler2'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure 1, object_index=7 (Closure 2)
      14, 1, 10, 5, // location 2: NEW closure 2, object_index=14 (Closure 3)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toHaveProperty('1:10:5')
  expect(result['1:10:5']).toHaveLength(2)
  
  const closure2 = result['1:10:5'].find((c) => c.nodeId === 2)
  expect(closure2).toBeDefined()
  expect(closure2?.references.length).toBeGreaterThan(0)
  
  const closure3 = result['1:10:5'].find((c) => c.nodeId === 4)
  expect(closure3).toBeDefined()
  expect(closure3?.references.length).toBeGreaterThan(0)
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5,
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
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 1, id=2) - NEW LEAK (orphaned)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 2, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3, id=3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 14, // Closure 2 -> Context 2 (only outgoing edge)
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure, object_index=7 (Closure 2)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toHaveProperty('1:10:5')
  expect(result['1:10:5']).toHaveLength(1)
  expect(result['1:10:5'][0].references).toBeDefined()
  expect(Array.isArray(result['1:10:5'][0].references)).toBe(true)
  // References might be empty if closure has no incoming edges (only context)
  // Context reference should still be present
})

test('should preserve nodeIndex as byte offset in result', async () => {
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
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0)
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 1, id=1)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5,
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
    node_count: 4,
    edge_count: 2,
    extra_native_bytes: 0,
    nodes: new Uint32Array([
      5, 0, 0, 50, 1, 0, 0, // Closure 1 (node 0, id=0) - same
      5, 0, 2, 50, 1, 0, 0, // Closure 2 (node 1, id=2) - NEW LEAK
      3, 0, 1, 30, 1, 0, 0, // Context 1 (node 2, id=1)
      3, 0, 3, 30, 1, 0, 0, // Context 2 (node 3, id=3)
    ]),
    edges: new Uint32Array([
      0, 3, 7, // Closure 1 -> Context 1
      0, 3, 14, // Closure 2 -> Context 2
    ]),
    strings: ['', 'anonymous'],
    locations: new Uint32Array([
      0, 1, 10, 5, // location 0: same closure, object_index=0
      7, 1, 10, 5, // location 1: NEW closure, object_index=7 (Closure 2, byte offset)
    ]),
  }

  const result = await compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2(snapshotA, snapshotB)
  expect(result).toHaveProperty('1:10:5')
  expect(result['1:10:5']).toHaveLength(1)
  // nodeIndex should be preserved as byte offset (7), not converted to node index (1)
  expect(result['1:10:5'][0].nodeIndex).toBe(7)
  expect(result['1:10:5'][0].nodeId).toBe(2)
})

