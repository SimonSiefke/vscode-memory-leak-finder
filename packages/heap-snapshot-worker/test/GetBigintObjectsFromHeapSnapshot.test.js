import { test, expect } from '@jest/globals'
import { writeFileSync, unlinkSync } from 'node:fs'
import * as GetBigintObjectsFromHeapSnapshot from '../src/parts/GetBigintObjectsFromHeapSnapshot/GetBigintObjectsFromHeapSnapshot.js'

test('getBigintObjectsFromHeapSnapshot - no bigint objects', async () => {
  // prettier-ignore
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 1,
      edge_count: 0,
    },
    nodes: [
      // prettier-ignore
      0, 1, 100, 64, 0, 0,
    ],
    edges: [],
    locations: [],
    strings: ['', 'test'],
  }

  const testFile = 'test-no-bigint.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetBigintObjectsFromHeapSnapshot.getBigintObjectsFromHeapSnapshot(testFile)
    expect(result).toEqual([])
  } finally {
    unlinkSync(testFile)
  }
})

test('getBigintObjectsFromHeapSnapshot - single bigint object without variable name (filtered out)', async () => {
  // prettier-ignore
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'bigint']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 1,
      edge_count: 0,
    },
    nodes: [
      4, 1, 200, 32, 0, 0,
    ],
    edges: [],
    locations: [],
    strings: ['', 'bigint'],
  }

  const testFile = 'test-single-bigint.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetBigintObjectsFromHeapSnapshot.getBigintObjectsFromHeapSnapshot(testFile)
    // Should return empty array since bigint has no variable names (embedded constant)
    expect(result).toEqual([])
  } finally {
    unlinkSync(testFile)
  }
})

test('getBigintObjectsFromHeapSnapshot - multiple bigint objects (embedded constants filtered out)', async () => {
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'bigint']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 4,
      edge_count: 0,
    },
    nodes: [
      // prettier-ignore
      4,
      1,
      200,
      32,
      1,
      0, // first bigint (embedded constant)
      0,
      0,
      201,
      16,
      0,
      0, // hidden object
      4,
      1,
      202,
      28,
      0,
      0, // second bigint (embedded constant)
      4,
      1,
      203,
      24,
      2,
      0, // third bigint (embedded constant)
    ],
    edges: [],
    locations: [],
    strings: ['', 'bigint'],
  }

  const testFile = 'test-multiple-bigint.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetBigintObjectsFromHeapSnapshot.getBigintObjectsFromHeapSnapshot(testFile)
    // Should return empty array since all bigints have no variable names (embedded constants)
    expect(result).toEqual([])
  } finally {
    unlinkSync(testFile)
  }
})

test('getBigintObjectsFromHeapSnapshot - bigint with variable name', async () => {
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'bigint']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 2,
      edge_count: 1,
    },
    nodes: [
      // prettier-ignore
      3,
      1,
      100,
      64,
      1,
      0, // object (Window)
      4,
      2,
      200,
      32,
      0,
      0, // bigint
    ],
    edges: [
      2,
      3,
      6, // property:"abc" -> bigint (node data index 6)
    ],
    locations: [],
    strings: ['', 'Window', 'bigint', 'abc'],
  }

  const testFile = 'test-bigint-with-variable.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetBigintObjectsFromHeapSnapshot.getBigintObjectsFromHeapSnapshot(testFile)
    expect(result).toEqual([
      {
        id: 200,
        name: 'bigint',
        value: 'bigint',
        selfSize: 32,
        edgeCount: 0,
        detachedness: 0,
        variableNames: [
          {
            name: 'abc',
            sourceType: 'object',
            sourceName: 'Window',
          },
        ],
        note: 'Actual bigint numeric value not accessible via heap snapshot format',
      },
    ])
  } finally {
    unlinkSync(testFile)
  }
})
