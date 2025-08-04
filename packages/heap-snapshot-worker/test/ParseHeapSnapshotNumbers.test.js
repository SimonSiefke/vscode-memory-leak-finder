import { test, expect } from '@jest/globals'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import * as ParseHeapSnapshotNumbers from '../src/parts/ParseHeapSnapshotNumbers/ParseHeapSnapshotNumbers.js'

const createTestFile = async (fileName, content) => {
  const filePath = join('./test-temp', fileName)
  await mkdir('./test-temp', { recursive: true })
  await writeFile(filePath, JSON.stringify(content))
  return filePath
}

const cleanupTestFile = async (filePath) => {
  try {
    await unlink(filePath)
  } catch (error) {
    // Ignore cleanup errors
  }
}

test.skip('parseHeapSnapshotNumbers - no heap numbers', async () => {
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [
          [
            'hidden',
            'array',
            'string',
            'object',
            'code',
            'closure',
            'regexp',
            'number',
            'native',
            'synthetic',
            'concatenated string',
            'sliced string',
            'symbol',
            'bigint',
            'object shape',
          ],
        ],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 1,
      edge_count: 0,
    },
    nodes: [0, 0, 0, 0, 0, 0, 0], // hidden type node
    edges: [],
    strings: ['test'],
    locations: [],
  }

  const filePath = await createTestFile('test-no-heap-numbers.heapsnapshot', heapsnapshot)

  try {
    const result = await ParseHeapSnapshotNumbers.parseHeapSnapshotNumbers(filePath)

    expect(result).toEqual({
      count: 0,
      heapNumbers: [],
    })
  } finally {
    await cleanupTestFile(filePath)
  }
})

test.skip('parseHeapSnapshotNumbers - with heap numbers', async () => {
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [
          [
            'hidden',
            'array',
            'string',
            'object',
            'code',
            'closure',
            'regexp',
            'number',
            'native',
            'synthetic',
            'concatenated string',
            'sliced string',
            'symbol',
            'bigint',
            'object shape',
          ],
        ],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 3,
      edge_count: 0,
    },
    nodes: [
      7,
      0,
      1,
      8,
      0,
      0,
      0, // number type node with id 1, size 8
      7,
      0,
      2,
      16,
      0,
      0,
      0, // number type node with id 2, size 16
      3,
      1,
      3,
      32,
      0,
      0,
      0, // object type node with id 3, size 32
    ],
    edges: [],
    strings: ['(heap number)', 'normalObject'],
    locations: [],
  }

  const filePath = await createTestFile('test-with-heap-numbers.heapsnapshot', heapsnapshot)

  try {
    const result = await ParseHeapSnapshotNumbers.parseHeapSnapshotNumbers(filePath)

    expect(result.count).toBe(2)
    expect(result.heapNumbers).toHaveLength(2)
    expect(result.heapNumbers[0]).toEqual({
      id: 1,
      name: '(heap number)',
      type: 'number',
      selfSize: 8,
      edgeCount: 0,
    })
    expect(result.heapNumbers[1]).toEqual({
      id: 2,
      name: '(heap number)',
      type: 'number',
      selfSize: 16,
      edgeCount: 0,
    })
  } finally {
    await cleanupTestFile(filePath)
  }
})

test.skip('parseHeapSnapshotNumbers - number nodes with different names', async () => {
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [
          [
            'hidden',
            'array',
            'string',
            'object',
            'code',
            'closure',
            'regexp',
            'number',
            'native',
            'synthetic',
            'concatenated string',
            'sliced string',
            'symbol',
            'bigint',
            'object shape',
          ],
        ],
        node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
        edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
        edge_fields: ['type', 'name_or_index', 'to_node'],
        location_fields: ['object_index', 'script_id', 'line', 'column'],
      },
      node_count: 2,
      edge_count: 0,
    },
    nodes: [
      7,
      0,
      1,
      8,
      0,
      0,
      0, // number type with "(heap number)" name
      7,
      1,
      2,
      16,
      0,
      0,
      0, // number type with "123" name
    ],
    edges: [],
    strings: ['(heap number)', '123'],
    locations: [],
  }

  const filePath = await createTestFile('test-different-names.heapsnapshot', heapsnapshot)

  try {
    const result = await ParseHeapSnapshotNumbers.parseHeapSnapshotNumbers(filePath)

    expect(result.count).toBe(1)
    expect(result.heapNumbers).toHaveLength(1)
    expect(result.heapNumbers[0]).toEqual({
      id: 1,
      name: '(heap number)',
      type: 'number',
      selfSize: 8,
      edgeCount: 0,
    })
  } finally {
    await cleanupTestFile(filePath)
  }
})
