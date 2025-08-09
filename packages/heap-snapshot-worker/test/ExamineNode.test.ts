import { test, expect } from '@jest/globals'
import { examineNodeById, examineNodeByIndex } from '../src/parts/ExamineNode/ExamineNode.ts'
import { createTestSnapshot } from './helpers/createTestSnapshot.ts'

test('examineNode - should examine node with edges and properties', () => {
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const nodeTypes: [readonly string[]] = [
    ['hidden', 'array', 'string', 'object', 'code', 'closure']
  ]
  const edgeTypes: [readonly string[]] = [
    ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']
  ]

  // Create nodes array: 3 nodes
  const nodes = new Uint32Array([
    // Node 0: type=3(object), name=0, id=1, self_size=100, edge_count=2
    3, 0, 1, 100, 2,
    // Node 1: type=2(string), name=1, id=2, self_size=50, edge_count=0
    2, 1, 2, 50, 0,
    // Node 2: type=2(string), name=2, id=3, self_size=30, edge_count=0
    2, 2, 3, 30, 0
  ])

  // Create edges array: 2 edges from Node 0
  const edges = new Uint32Array([
    // Edge 0: type=2(property), name_or_index=3, to_node=5 (Node 1)
    2, 3, 5,
    // Edge 1: type=2(property), name_or_index=4, to_node=10 (Node 2)
    2, 4, 10
  ])

  const strings = ['Object', 'hello', 'world', 'prop1', 'prop2']

  const snapshot = createTestSnapshot(
    nodes,
    edges,
    strings,
    nodeFields,
    edgeFields,
    nodeTypes,
    edgeTypes
  )

  // Examine Node 0
  const result = examineNodeByIndex(0, snapshot)

  expect(result).not.toBeNull()
  expect(result!.nodeIndex).toBe(0)
  expect(result!.nodeName).toBe('Object')
  expect(result!.nodeType).toBe('object')
  expect(result!.edges).toHaveLength(2)
  
  // Check first edge
  expect(result!.edges[0]).toEqual({
    type: 2,
    typeName: 'property',
    nameIndex: 3,
    edgeName: 'prop1',
    toNode: 5,
    targetNodeInfo: {
      name: 'hello',
      type: 'string'
    }
  })

  // Check second edge
  expect(result!.edges[1]).toEqual({
    type: 2,
    typeName: 'property',
    nameIndex: 4,
    edgeName: 'prop2',
    toNode: 10,
    targetNodeInfo: {
      name: 'world',
      type: 'string'
    }
  })

  // Check properties
  expect(result!.properties).toHaveLength(2)
  expect(result!.properties[0]).toEqual({
    name: 'prop1',
    value: 'hello',
    targetType: 'string'
  })
  expect(result!.properties[1]).toEqual({
    name: 'prop2',
    value: 'world',
    targetType: 'string'
  })
})

test('examineNode - should handle node with no edges', () => {
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const nodeTypes: [readonly string[]] = [['string']]
  const edgeTypes: [readonly string[]] = [['property']]

  const nodes = new Uint32Array([
    // Node 0: type=0(string), name=0, id=1, self_size=50, edge_count=0
    0, 0, 1, 50, 0
  ])

  const edges = new Uint32Array([])
  const strings = ['test']

  const snapshot = createTestSnapshot(
    nodes,
    edges,
    strings,
    nodeFields,
    edgeFields,
    nodeTypes,
    edgeTypes
  )

  const result = examineNodeByIndex(0, snapshot)

  expect(result).not.toBeNull()
  expect(result!.nodeIndex).toBe(0)
  expect(result!.nodeName).toBe('test')
  expect(result!.nodeType).toBe('string')
  expect(result!.edges).toHaveLength(0)
  expect(result!.properties).toHaveLength(0)
})

test('examineNode - should return null for invalid node index', () => {
  const snapshot = createTestSnapshot(
    new Uint32Array([]),
    new Uint32Array([]),
    [],
    ['type', 'name', 'id', 'self_size', 'edge_count'],
    ['type', 'name_or_index', 'to_node'],
    [[]],
    [[]]
  )

  const result = examineNodeByIndex(0, snapshot)
  expect(result).toBeNull()
})

test('examineNodeById - should find and examine node by ID 67', () => {
  // Create a test snapshot where we have a node with ID 67
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const edgeFields = ['type', 'name_or_index', 'to_node']
  const nodeTypes: [readonly string[]] = [
    ['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint', 'object shape']
  ]
  const edgeTypes: [readonly string[]] = [
    ['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']
  ]

  // Create some test nodes, including one with ID 67
  const nodes = new Uint32Array([
    // Node 0: type=2(string), name=0, id=1, self_size=50, edge_count=0
    2, 0, 1, 50, 0,
    // Node 1: type=2(string), name=1, id=2, self_size=50, edge_count=0  
    2, 1, 2, 50, 0,
    // Node 2: type=3(object), name=2, id=67, self_size=100, edge_count=2
    3, 2, 67, 100, 2,
    // Node 3: type=2(string), name=3, id=68, self_size=50, edge_count=0
    2, 3, 68, 50, 0
  ])

  // Create edges for the node with ID 67 (which is at index 2)
  const edges = new Uint32Array([
    // Edge 0: property edge from node 2 pointing to node 0
    2, 4, 0,
    // Edge 1: property edge from node 2 pointing to node 1  
    2, 5, 5
  ])

  const strings = ['node_0', 'node_1', 'Object', 'node_3', 'prop1', 'prop2']

  const snapshot = createTestSnapshot(
    nodes,
    edges,
    strings,
    nodeFields,
    edgeFields,
    nodeTypes,
    edgeTypes
  )

  // Examine Node with ID 67
  const result = examineNodeById(67, snapshot)

  expect(result).not.toBeNull()
  expect(result!.nodeIndex).toBe(2) // Should be at node index 2
  expect(result!.nodeId).toBe(67)   // Should have ID 67
  expect(result!.nodeName).toBe('Object')
  expect(result!.nodeType).toBe('object')
  expect(result!.edges).toHaveLength(2)
  
  console.log('Node ID 67 examination result:', JSON.stringify(result, null, 2))
})
