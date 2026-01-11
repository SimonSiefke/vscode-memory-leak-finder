import { test, expect } from '@jest/globals'
import { createEdgeMap } from '../src/parts/CreateEdgeMap/CreateEdgeMap.ts'

test('should create edge map correctly', () => {
  // Create a simple test case with 3 nodes
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
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
    3,
    3,
    3,
    75,
    0, // Node 2: 0 edges
  ])

  const edgeMap = createEdgeMap(nodes, nodeFields)

  expect(edgeMap).toBeInstanceOf(Uint32Array)
  expect(edgeMap.length).toBe(3)

  // Node 0 starts at edge 0
  expect(edgeMap[0]).toBe(0)
  // Node 1 starts at edge 2 (after Node 0's 2 edges)
  expect(edgeMap[1]).toBe(2)
  // Node 2 starts at edge 3 (after Node 0's 2 edges + Node 1's 1 edge)
  expect(edgeMap[2]).toBe(3)
})

test('should handle empty nodes array', () => {
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count']
  const nodes = new Uint32Array([])

  const edgeMap = createEdgeMap(nodes, nodeFields)
  expect(edgeMap).toBeInstanceOf(Uint32Array)
  expect(edgeMap.length).toBe(0)
})
