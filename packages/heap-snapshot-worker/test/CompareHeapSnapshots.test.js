import { test, expect } from '@jest/globals'
import { compareHeapSnapshots } from '../src/parts/CompareHeapSnapshots/CompareHeapSnapshots.js'

test('compareHeapSnapshots - no leaks', () => {
  // Create mock locations for two snapshots with same function counts
  const locations1 = new Uint32Array([
    // objectIndex, scriptId, line, column
    1,
    100,
    10,
    5, // Function A: 2 instances
    2,
    100,
    10,
    5,
    3,
    200,
    20,
    15, // Function B: 1 instance
  ])

  const locations2 = new Uint32Array([
    // objectIndex, scriptId, line, column
    4,
    100,
    10,
    5, // Function A: 2 instances (same)
    5,
    100,
    10,
    5,
    6,
    200,
    20,
    15, // Function B: 1 instance (same)
  ])

  const scriptMap = {
    100: { url: 'script1.js' },
    200: { url: 'script2.js' },
  }

  const result = compareHeapSnapshots(locations1, locations2, scriptMap)
  expect(result).toEqual([])
})

test('compareHeapSnapshots - function count increased', () => {
  // Create mock locations for two snapshots with increased function count
  const locations1 = new Uint32Array([
    // objectIndex, scriptId, line, column
    1,
    100,
    10,
    5, // Function A: 1 instance
    2,
    200,
    20,
    15, // Function B: 1 instance
  ])

  const locations2 = new Uint32Array([
    // objectIndex, scriptId, line, column
    3,
    100,
    10,
    5, // Function A: 3 instances (increased by 2)
    4,
    100,
    10,
    5,
    5,
    100,
    10,
    5,
    6,
    200,
    20,
    15, // Function B: 1 instance (same)
  ])

  const scriptMap = {
    100: { url: 'script1.js' },
    200: { url: 'script2.js' },
  }

  const result = compareHeapSnapshots(locations1, locations2, scriptMap)
  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    count: 3,
    delta: 2,
    scriptId: 100,
    line: 10,
    column: 5,
  })
})

test('compareHeapSnapshots - new function appeared', () => {
  // Create mock locations for two snapshots with new function
  const locations1 = new Uint32Array([
    // objectIndex, scriptId, line, column
    1,
    100,
    10,
    5, // Function A: 1 instance
  ])

  const locations2 = new Uint32Array([
    // objectIndex, scriptId, line, column
    2,
    100,
    10,
    5, // Function A: 1 instance (same)
    3,
    200,
    20,
    15, // Function B: 2 instances (new)
    4,
    200,
    20,
    15,
  ])

  const scriptMap = {
    100: { url: 'script1.js' },
    200: { url: 'script2.js' },
  }

  const result = compareHeapSnapshots(locations1, locations2, scriptMap)
  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    count: 2,
    delta: 2, // All instances are new
    scriptId: 200,
    line: 20,
    column: 15,
  })
})

test('compareHeapSnapshots - multiple leaks sorted by delta', () => {
  // Create mock locations for two snapshots with multiple leaks
  const locations1 = new Uint32Array([
    // objectIndex, scriptId, line, column
    1,
    100,
    10,
    5, // Function A: 1 instance
    2,
    200,
    20,
    15, // Function B: 1 instance
  ])

  const locations2 = new Uint32Array([
    // objectIndex, scriptId, line, column
    3,
    100,
    10,
    5, // Function A: 4 instances (increased by 3)
    4,
    100,
    10,
    5,
    5,
    100,
    10,
    5,
    6,
    100,
    10,
    5,
    7,
    200,
    20,
    15, // Function B: 2 instances (increased by 1)
    8,
    200,
    20,
    15,
    9,
    300,
    30,
    25, // Function C: 1 instance (new)
  ])

  const scriptMap = {
    100: { url: 'script1.js' },
    200: { url: 'script2.js' },
    300: { url: 'script3.js' },
  }

  const result = compareHeapSnapshots(locations1, locations2, scriptMap)
  expect(result).toHaveLength(3)

  // Should be sorted by delta (highest first), then by count (highest first)
  expect(result[0]).toEqual({
    count: 4,
    delta: 3,
    scriptId: 100,
    line: 10,
    column: 5,
  })

  // Both have delta=1, so sort by count (2 > 1)
  expect(result[1]).toEqual({
    count: 2,
    delta: 1,
    scriptId: 200,
    line: 20,
    column: 15,
  })

  expect(result[2]).toEqual({
    count: 1,
    delta: 1,
    scriptId: 300,
    line: 30,
    column: 25,
  })
})

test('compareHeapSnapshots - function count decreased (not a leak)', () => {
  // Create mock locations for two snapshots with decreased function count
  const locations1 = new Uint32Array([
    // objectIndex, scriptId, line, column
    1,
    100,
    10,
    5, // Function A: 3 instances
    2,
    100,
    10,
    5,
    3,
    100,
    10,
    5,
  ])

  const locations2 = new Uint32Array([
    // objectIndex, scriptId, line, column
    4,
    100,
    10,
    5, // Function A: 1 instance (decreased by 2)
  ])

  const scriptMap = {
    100: { url: 'script1.js' },
  }

  const result = compareHeapSnapshots(locations1, locations2, scriptMap)
  expect(result).toEqual([])
})
