import { test, expect } from '@jest/globals'
import * as GetArraysFromHeapSnapshot from '../src/parts/GetArraysFromHeapSnapshot/GetArraysFromHeapSnapshot.js'

test('getArraysFromHeapSnapshot - extracts arrays with names and lengths sorted by length', async () => {
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/l6.json'

  const result = await GetArraysFromHeapSnapshot.getArraysFromHeapSnapshot(heapSnapshotPath)

  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBeGreaterThan(0)

  // Check that results are sorted by length (longest first)
  for (let i = 0; i < result.length - 1; i++) {
    expect(result[i].length).toBeGreaterThanOrEqual(result[i + 1].length)
  }

  // Check structure of array objects
  const firstArray = result[0]
  expect(typeof firstArray.id).toBe('number')
  expect(['string', 'object']).toContain(typeof firstArray.name) // Can be string or array
  expect(typeof firstArray.length).toBe('number')
  expect(firstArray.type).toBe('array')

  // Should not have these properties anymore
  // @ts-ignore
  expect(firstArray.selfSize).toBeUndefined()
  // @ts-ignore
  expect(firstArray.edgeCount).toBeUndefined()
  // @ts-ignore
  expect(firstArray.detachedness).toBeUndefined()
  // @ts-ignore
  expect(firstArray.variableNames).toBeUndefined()

  // Log first few results for verification
  console.log('Top 5 largest arrays:')
  result.slice(0, 5).forEach((array, index) => {
    const nameDisplay = Array.isArray(array.name) ? `[${array.name.join(', ')}]` : array.name
    console.log(`${index + 1}. Length: ${array.length}, ID: ${array.id}, Name: ${nameDisplay}`)
  })
})

test('getArraysFromHeapSnapshot - handles multiple names correctly', async () => {
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/l6.json'

  const result = await GetArraysFromHeapSnapshot.getArraysFromHeapSnapshot(heapSnapshotPath)

  // Find arrays with multiple names (array instead of string)
  const arraysWithMultipleNames = result.filter(array => Array.isArray(array.name))

  console.log(`Found ${arraysWithMultipleNames.length} arrays with multiple names`)

  if (arraysWithMultipleNames.length > 0) {
    const arrayWithMultipleNames = arraysWithMultipleNames[0]
    console.log('Sample array with multiple names:', {
      id: arrayWithMultipleNames.id,
      name: arrayWithMultipleNames.name,
      length: arrayWithMultipleNames.length
    })

    expect(Array.isArray(arrayWithMultipleNames.name)).toBe(true)
    expect(arrayWithMultipleNames.name.length).toBeGreaterThan(1)
  }
})