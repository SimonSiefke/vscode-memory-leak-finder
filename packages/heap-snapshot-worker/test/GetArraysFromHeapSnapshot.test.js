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
  expect(typeof firstArray.name).toBe('string')
  expect(typeof firstArray.length).toBe('number')
  expect(firstArray.type).toBe('array')
  expect(typeof firstArray.selfSize).toBe('number')
  expect(typeof firstArray.edgeCount).toBe('number')
  expect(typeof firstArray.detachedness).toBe('number')
  expect(Array.isArray(firstArray.variableNames)).toBe(true)

  // Log first few results for verification
  console.log('Top 5 largest arrays:')
  result.slice(0, 5).forEach((array, index) => {
    console.log(`${index + 1}. Length: ${array.length}, ID: ${array.id}, Variables: [${array.variableNames.map(v => v.name).join(', ')}]`)
  })
})

test('getArraysFromHeapSnapshot - handles variable names correctly', async () => {
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/l6.json'

  const result = await GetArraysFromHeapSnapshot.getArraysFromHeapSnapshot(heapSnapshotPath)

  // Find arrays with variable names
  const arraysWithVariables = result.filter(array => array.variableNames.length > 0)

  expect(arraysWithVariables.length).toBeGreaterThan(0)

  // Check variable name structure
  const arrayWithVariable = arraysWithVariables[0]
  expect(typeof arrayWithVariable.variableNames[0].name).toBe('string')
  expect(typeof arrayWithVariable.variableNames[0].sourceType).toBe('string')
  expect(typeof arrayWithVariable.variableNames[0].sourceName).toBe('string')

  console.log('Sample array with variables:', {
    id: arrayWithVariable.id,
    length: arrayWithVariable.length,
    variableNames: arrayWithVariable.variableNames.slice(0, 3) // Show first 3 variable names
  })
})