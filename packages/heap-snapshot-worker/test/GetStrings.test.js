import { test, expect } from '@jest/globals'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetStrings from '../src/parts/GetStrings/GetStrings.js'

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

test('getStrings - extracts strings array from heap snapshot file', async () => {
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [['hidden', 'array', 'string', 'object']],
        node_fields: ['type', 'name', 'id'],
      },
    },
    nodes: [0, 0, 0],
    edges: [],
    strings: ['first string', 'second string', '(heap number)'],
    locations: [],
  }

  const filePath = await createTestFile('test-strings.heapsnapshot', heapsnapshot)

  try {
    const strings = await GetStrings.getStrings(filePath)

    expect(strings).toEqual(['first string', 'second string', '(heap number)'])
    expect(Array.isArray(strings)).toBe(true)
    expect(strings).toHaveLength(3)
  } finally {
    await cleanupTestFile(filePath)
  }
})

test('getStrings - handles empty strings array', async () => {
  const heapsnapshot = {
    snapshot: {
      meta: {
        node_types: [['hidden']],
        node_fields: ['type', 'name', 'id'],
      },
    },
    nodes: [0, 0, 0],
    edges: [],
    strings: [],
    locations: [],
  }

  const filePath = await createTestFile('test-empty-strings.heapsnapshot', heapsnapshot)

  try {
    const strings = await GetStrings.getStrings(filePath)

    expect(strings).toEqual([])
    expect(Array.isArray(strings)).toBe(true)
    expect(strings).toHaveLength(0)
  } finally {
    await cleanupTestFile(filePath)
  }
})
