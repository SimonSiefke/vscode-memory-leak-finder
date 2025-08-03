import { test, expect } from '@jest/globals'
import { writeFileSync, unlinkSync } from 'node:fs'
import * as GetRegexpObjectsFromHeapSnapshot from '../src/parts/GetRegexpObjectsFromHeapSnapshot/GetRegexpObjectsFromHeapSnapshot.js'

test('getRegexpObjectsFromHeapSnapshot - no regexp objects', async () => {
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
      },
      node_count: 1,
      edge_count: 0,
    },
    nodes: [0, 1, 100, 64, 0, 0, 0],
    edges: [],
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
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'regexp']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
      },
      node_count: 1,
      edge_count: 0,
    },
    nodes: [4, 1, 200, 32, 0, 0, 0],
    edges: [],
    strings: ['', '/test/gi'],
  }

  const testFile = 'test-single-regexp.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetRegexpObjectsFromHeapSnapshot.getRegexpObjectsFromHeapSnapshot(testFile)
    expect(result).toEqual([
      {
        id: 200,
        name: '/test/gi',
        pattern: '/test/gi',
        selfSize: 32,
        edgeCount: 0,
        traceNodeId: 0,
        detachedness: 0,
      },
    ])
  } finally {
    unlinkSync(testFile)
  }
})

test('getRegexpObjectsFromHeapSnapshot - multiple regexp objects', async () => {
  const testData = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object', 'regexp']],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
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
    strings: ['', '/test/gi', '/hello/i', '/world/g'],
  }

  const testFile = 'test-multiple-regexp.heapsnapshot'
  writeFileSync(testFile, JSON.stringify(testData))

  try {
    const result = await GetRegexpObjectsFromHeapSnapshot.getRegexpObjectsFromHeapSnapshot(testFile)
    expect(result).toEqual([
      {
        id: 200,
        name: '/test/gi',
        pattern: '/test/gi',
        selfSize: 32,
        edgeCount: 1,
        traceNodeId: 0,
        detachedness: 0,
      },
      {
        id: 202,
        name: '/hello/i',
        pattern: '/hello/i',
        selfSize: 28,
        edgeCount: 0,
        traceNodeId: 0,
        detachedness: 0,
      },
      {
        id: 203,
        name: '/world/g',
        pattern: '/world/g',
        selfSize: 24,
        edgeCount: 2,
        traceNodeId: 0,
        detachedness: 0,
      },
    ])
  } finally {
    unlinkSync(testFile)
  }
})