import { test, expect } from '@jest/globals'
import { getUndefinedValue, getUndefinedStructure } from '../src/parts/GetUndefinedValue/GetUndefinedValue.ts'
import { createEdgeMap } from '../src/parts/CreateEdgeMap/CreateEdgeMap.ts'
import { createTestSnapshot } from './createTestSnapshot.ts'

test('getUndefinedValue - should detect undefined value by name and type', () => {
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const nodeTypes: [readonly string[]] = [['hidden', 'string', 'object']]
  const strings = ['undefined', 'test']

  // Create a hidden node with name "undefined"
  const undefinedNode = {
    type: 0, // hidden
    name: 0, // "undefined"
    id: 67,
    self_size: 0,
    edge_count: 0
  }

  const snapshot = createTestSnapshot(
    new Uint32Array([0, 0, 67, 0, 0]), // hidden, name=0(undefined), id=67, size=0, edges=0
    new Uint32Array([]),
    strings,
    nodeFields,
    ['type', 'name_or_index', 'to_node'],
    nodeTypes,
    [['property', 'internal']]
  )

  const edgeMap = createEdgeMap(snapshot.nodes, nodeFields)

  const result = getUndefinedValue(undefinedNode, snapshot, edgeMap)
  expect(result).toBe('[undefined 67]')
})

test('getUndefinedValue - should return null for non-undefined nodes', () => {
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const nodeTypes: [readonly string[]] = [['hidden', 'string', 'object']]
  const strings = ['test', 'other']

  const testNode = {
    type: 1, // string
    name: 0, // "test"
    id: 1,
    self_size: 10,
    edge_count: 0
  }

  const snapshot = createTestSnapshot(
    new Uint32Array([1, 0, 1, 10, 0]),
    new Uint32Array([]),
    strings,
    nodeFields,
    ['type', 'name_or_index', 'to_node'],
    nodeTypes,
    [['property', 'internal']]
  )

  const edgeMap = createEdgeMap(snapshot.nodes, nodeFields)

  const result = getUndefinedValue(testNode, snapshot, edgeMap)
  expect(result).toBeNull()
})

test('getUndefinedStructure - should detect undefined property structure', () => {
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const nodeTypes = [['object', 'hidden', 'string']]
  const edgeTypes = [['property', 'internal']]
  const strings = ['Object', 'undefined', 'testProp']

  // Create nodes: object with undefined property
  const nodes = new Uint32Array([
    // Object node at index 0
    0, 0, 1, 100, 1, // type=object, name=Object, id=1, size=100, edges=1
    // Undefined node at index 1
    1, 1, 67, 0, 0   // type=hidden, name=undefined, id=67, size=0, edges=0
  ])

  // Create edge: property edge from object to undefined
  const edges = new Uint32Array([
    0, 2, 5 // type=property, name=testProp, to_node=5 (index 1 * 5 fields)
  ])

  const snapshot = createTestSnapshot(
    nodes,
    edges,
    strings,
    nodeFields,
    edgeFields,
    nodeTypes,
    edgeTypes
  )

  const sourceNode = {
    type: 0,
    name: 0,
    id: 1,
    self_size: 100,
    edge_count: 1
  }

  const edgeMap = createEdgeMap(nodes, nodeFields)

  const result = getUndefinedStructure(sourceNode, snapshot, edgeMap, 'testProp')
  expect(result).not.toBeNull()
  expect(result!.value).toBe('[undefined 67]')
  expect(result!.hasTypeReference).toBe(false) // No separate type reference for undefined
})
