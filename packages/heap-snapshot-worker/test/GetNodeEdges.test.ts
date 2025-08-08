import { test, expect } from '@jest/globals'
import { getNodeEdges } from '../src/parts/GetNodeEdges/GetNodeEdges.ts'

test('should get node edges correctly', () => {
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const edgeFields = ['type', 'name_or_index', 'to_node']

  const nodes = new Uint32Array([
    // type, name, id, self_size, edge_count
    3,
    1,
    1,
    100,
    2, // Node 0: 2 edges
    3,
    2,
    2,
    50,
    1, // Node 1: 1 edge
  ])

  const edges = new Uint32Array([
    // type, name_or_index, to_node
    2,
    1,
    1, // Edge 0: property edge from Node 0 to Node 1
    2,
    2,
    2, // Edge 1: property edge from Node 0 to Node 2
    2,
    3,
    0, // Edge 2: property edge from Node 1 to Node 0
  ])

  // Create edge map manually for testing
  const edgeMap = new Uint32Array([0, 2]) // Node 0 starts at edge 0, Node 1 starts at edge 2

  // Get edges for Node 0
  const node0Edges = getNodeEdges(0, edgeMap, nodes, edges, nodeFields, edgeFields)
  expect(node0Edges).toHaveLength(2)
  expect(node0Edges[0]).toEqual({ type: 2, nameIndex: 1, toNode: 1 })
  expect(node0Edges[1]).toEqual({ type: 2, nameIndex: 2, toNode: 2 })

  // Get edges for Node 1
  const node1Edges = getNodeEdges(1, edgeMap, nodes, edges, nodeFields, edgeFields)
  expect(node1Edges).toHaveLength(1)
  expect(node1Edges[0]).toEqual({ type: 2, nameIndex: 3, toNode: 0 })
})

test('should handle nodes with no edges', () => {
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const edgeFields = ['type', 'name_or_index', 'to_node']

  const nodes = new Uint32Array([
    // type, name, id, self_size, edge_count
    3,
    1,
    1,
    100,
    0, // Node 0: 0 edges
  ])

  const edges = new Uint32Array([]) // No edges
  const edgeMap = new Uint32Array([0]) // Node 0 starts at edge 0

  const node0Edges = getNodeEdges(0, edgeMap, nodes, edges, nodeFields, edgeFields)
  expect(node0Edges).toHaveLength(0)
})

test('should handle different edge types', () => {
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const edgeFields = ['type', 'name_or_index', 'to_node']

  const nodes = new Uint32Array([
    // type, name, id, self_size, edge_count
    3,
    1,
    1,
    100,
    3, // Node 0: 3 edges
  ])

  const edges = new Uint32Array([
    // type, name_or_index, to_node
    2,
    1,
    1, // Edge 0: property edge (type 2)
    3,
    0,
    2, // Edge 1: internal edge (type 3)
    1,
    5,
    3, // Edge 2: element edge (type 1)
  ])

  const edgeMap = new Uint32Array([0]) // Node 0 starts at edge 0

  const node0Edges = getNodeEdges(0, edgeMap, nodes, edges, nodeFields, edgeFields)
  expect(node0Edges).toHaveLength(3)
  expect(node0Edges[0]).toEqual({ type: 2, nameIndex: 1, toNode: 1 })
  expect(node0Edges[1]).toEqual({ type: 3, nameIndex: 0, toNode: 2 })
  expect(node0Edges[2]).toEqual({ type: 1, nameIndex: 5, toNode: 3 })
})
