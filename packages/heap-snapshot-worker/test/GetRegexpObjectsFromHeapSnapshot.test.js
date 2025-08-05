import { test, expect } from '@jest/globals'
import { writeFileSync, unlinkSync } from 'node:fs'
import * as GetRegexpObjectsFromHeapSnapshot from '../src/parts/GetRegexpObjectsFromHeapSnapshot/GetRegexpObjectsFromHeapSnapshot.js'

test('getRegexpObjectsFromHeapSnapshot - no regexp objects', async () => {
  // prettier-ignore
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 1,
      edge_count: 0,
    },
    nodes: [
      0, 1, 100, 64, 0, 0, 0, // hidden object
    ],
    edges: [],
    locations: [],
    strings: ['', 'test'],
  }

  const testFile = 'test-no-regexp.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetRegexpObjectsFromHeapSnapshot.getRegexpObjectsFromHeapSnapshot(testFile)
    expect(result).toEqual([])
  } finally {
    unlinkSync(testFile)
  }
})

test('getRegexpObjectsFromHeapSnapshot - single regexp object', async () => {
  // prettier-ignore
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'regexp']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 1,
      edge_count: 0,
    },
    nodes: [
      4, 1, 200, 32, 0, 0, 0, // regexp object
    ],
    edges: [],
    locations: [],
    strings: ['', '/test/gi'],
  }

  const testFile = 'test-single-regexp.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetRegexpObjectsFromHeapSnapshot.getRegexpObjectsFromHeapSnapshot(testFile)
    expect(result).toEqual([
      {
        id: 200,
        pattern: '/test/gi',
      },
    ])
  } finally {
    unlinkSync(testFile)
  }
})

test('getRegexpObjectsFromHeapSnapshot - multiple regexp objects', async () => {
  // prettier-ignore
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'regexp']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 4,
      edge_count: 0,
    },
    nodes: [
      4, 1, 200, 32, 1, 0, 0, // first regexp
      0, 0, 201, 16, 0, 0, 0, // hidden object
      4, 2, 202, 28, 0, 0, 0, // second regexp
      4, 3, 203, 24, 2, 0, 0, // third regexp
    ],
    edges: [],
    locations: [],
    strings: ['', '/test/gi', '/hello/i', '/world/g'],
  }

  const testFile = 'test-multiple-regexp.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetRegexpObjectsFromHeapSnapshot.getRegexpObjectsFromHeapSnapshot(testFile)
    expect(result).toEqual([
      {
        id: 200,
        pattern: '/test/gi',
      },
      {
        id: 202,
        pattern: '/hello/i',
      },
      {
        id: 203,
        pattern: '/world/g',
      },
    ])
  } finally {
    unlinkSync(testFile)
  }
})
