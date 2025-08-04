import { test, expect } from '@jest/globals'
import { writeFileSync, unlinkSync } from 'node:fs'
import * as GetMapObjectsFromHeapSnapshot from '../src/parts/GetMapObjectsFromHeapSnapshot/GetMapObjectsFromHeapSnapshot.js'

test('getMapObjectsFromHeapSnapshot - no map objects', async () => {
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
      },
      node_count: 1,
      edge_count: 0,
    },
    nodes: [0, 1, 100, 64, 0, 0],
    edges: [],
    strings: ['', 'test'],
  }

  const testFile = 'test-no-maps.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetMapObjectsFromHeapSnapshot.getMapObjectsFromHeapSnapshot(testFile)
    expect(result).toEqual([])
  } finally {
    unlinkSync(testFile)
  }
})

test('getMapObjectsFromHeapSnapshot - map without variable name (filtered out)', async () => {
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
      },
      node_count: 1,
      edge_count: 0,
    },
    nodes: [3, 1, 200, 28, 0, 0], // object type, Map
    edges: [],
    strings: ['', 'Map'],
  }

  const testFile = 'test-map-no-variable.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetMapObjectsFromHeapSnapshot.getMapObjectsFromHeapSnapshot(testFile)
    // Should return empty array since Map has no variable names (prototype or system object)
    expect(result).toEqual([])
  } finally {
    unlinkSync(testFile)
  }
})

test('getMapObjectsFromHeapSnapshot - map with variable name', async () => {
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
      },
      node_count: 2,
      edge_count: 1,
    },
    nodes: [
      3,
      1,
      100,
      64,
      1,
      0, // object (Window)
      3,
      2,
      200,
      28,
      0,
      0, // Map
    ],
    edges: [
      2,
      3,
      6, // property:"myMap" -> Map (node data index 6)
    ],
    strings: ['', 'Window', 'Map', 'myMap'],
  }

  const testFile = 'test-map-with-variable.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetMapObjectsFromHeapSnapshot.getMapObjectsFromHeapSnapshot(testFile)
    expect(result).toEqual([
      {
        id: 200,
        variableNames: ['myMap'],
        keys: [],
        note: 'Map object found in heap snapshot',
      },
    ])
  } finally {
    unlinkSync(testFile)
  }
})

test('getMapObjectsFromHeapSnapshot - multiple map objects with variables', async () => {
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
      },
      node_count: 4,
      edge_count: 2,
    },
    nodes: [
      3,
      1,
      100,
      64,
      2,
      0, // object (App) - has 2 edges
      3,
      2,
      200,
      28,
      0,
      0, // Map
      3,
      2,
      300,
      28,
      0,
      0, // Map (second one)
      3,
      3,
      400,
      28,
      0,
      0, // Set (will be ignored)
    ],
    edges: [
      2,
      5,
      6, // property:"cache" -> Map (node data index 6)
      2,
      6,
      12, // property:"userCache" -> Map (node data index 12)
    ],
    strings: ['', 'App', 'Map', 'Set', 'WeakMap', 'cache', 'userCache', 'refs'],
  }

  const testFile = 'test-multiple-maps.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetMapObjectsFromHeapSnapshot.getMapObjectsFromHeapSnapshot(testFile)
    expect(result).toEqual([
      {
        id: 200,
        variableNames: ['cache'],
        keys: [],
        note: 'Map object found in heap snapshot',
      },
      {
        id: 300,
        variableNames: ['userCache'],
        keys: [],
        note: 'Map object found in heap snapshot',
      },
    ])
  } finally {
    unlinkSync(testFile)
  }
})
