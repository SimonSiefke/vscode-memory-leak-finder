import { test, expect } from '@jest/globals'
import { getNodeEdgesFast } from '../src/parts/GetNodeEdgesFast/GetNodeEdgesFast.ts'

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

  const ITEMS_PER_EDGE = edgeFields.length
  // Get edges for Node 0
  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const node0Edges = getNodeEdgesFast(0, edgeMap, nodes, edges, ITEMS_PER_NODE, ITEMS_PER_EDGE, edgeCountFieldIndex)
  expect(node0Edges.length / ITEMS_PER_EDGE).toBe(2)
  expect(Array.from(node0Edges.subarray(0, ITEMS_PER_EDGE))).toEqual([2, 1, 1])
  expect(Array.from(node0Edges.subarray(ITEMS_PER_EDGE, 2 * ITEMS_PER_EDGE))).toEqual([2, 2, 2])

  // Get edges for Node 1
  const node1Edges = getNodeEdgesFast(1, edgeMap, nodes, edges, ITEMS_PER_NODE, ITEMS_PER_EDGE, edgeCountFieldIndex)
  expect(node1Edges.length / ITEMS_PER_EDGE).toBe(1)
  expect(Array.from(node1Edges)).toEqual([2, 3, 0])
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

  const ITEMS_PER_NODE2 = nodeFields.length
  const ITEMS_PER_EDGE2 = edgeFields.length
  const edgeCountFieldIndex2 = nodeFields.indexOf('edge_count')
  const node0Edges = getNodeEdgesFast(0, edgeMap, nodes, edges, ITEMS_PER_NODE2, ITEMS_PER_EDGE2, edgeCountFieldIndex2)
  expect(node0Edges.length).toBe(0)
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

  const ITEMS_PER_NODE3 = nodeFields.length
  const ITEMS_PER_EDGE3 = edgeFields.length
  const edgeCountFieldIndex3 = nodeFields.indexOf('edge_count')
  const node0Edges = getNodeEdgesFast(0, edgeMap, nodes, edges, ITEMS_PER_NODE3, ITEMS_PER_EDGE3, edgeCountFieldIndex3)
  const ITEMS_PER_EDGE = edgeFields.length
  expect(node0Edges.length / ITEMS_PER_EDGE).toBe(3)
  expect(Array.from(node0Edges.subarray(0, ITEMS_PER_EDGE))).toEqual([2, 1, 1])
})
