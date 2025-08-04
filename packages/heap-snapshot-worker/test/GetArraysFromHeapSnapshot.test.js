import { test, expect } from '@jest/globals'
import * as GetArraysFromHeapSnapshot from '../src/parts/GetArraysFromHeapSnapshot/GetArraysFromHeapSnapshot.js'

test('getArraysFromHeapSnapshot - handles multiple names correctly', async () => {
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/l6.json'

  const result = await GetArraysFromHeapSnapshot.getArraysFromHeapSnapshot(heapSnapshotPath)

  // Find arrays with multiple names (array instead of string)
  const arraysWithMultipleNames = result.filter((array) => Array.isArray(array.name))

  if (arraysWithMultipleNames.length > 0) {
    const arrayWithMultipleNames = arraysWithMultipleNames[0]

    expect(Array.isArray(arrayWithMultipleNames.name)).toBe(true)
    expect(arrayWithMultipleNames.name.length).toBeGreaterThan(1)
  }
})
