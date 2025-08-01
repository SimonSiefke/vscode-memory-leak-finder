import { expect, test } from '@jest/globals'
import { getNamedFunctionCountFromHeapSnapshot2 } from '../src/parts/GetNamedFunctionCountFromHeapSnapshot2/GetNamedFunctionCountFromHeapSnapshot2.js'

// Helper function to convert optimized function's Uint32Array output to original function's format
const convertOptimizedToOriginalFormat = (optimizedResult, locations, scriptMap) => {
  const ITEMS_PER_RESULT = 5
  const ITEMS_PER_LOCATION = 4
  const result = []

  for (let i = 0; i < optimizedResult.length; i += ITEMS_PER_RESULT) {
    const objectIndex = optimizedResult[i]
    const scriptIdIndex = optimizedResult[i + 1]
    const lineIndex = optimizedResult[i + 2]
    const columnIndex = optimizedResult[i + 3]
    const count = optimizedResult[i + 4]

    // Get the script info from scriptMap
    const script = scriptMap[scriptIdIndex] || {}
    const url = script.url || `script_${scriptIdIndex}`
    const sourceMapUrl = script.sourceMapUrl || ''

    // Create the same format as the original function
    result.push({
      name: `function_${objectIndex}`, // We don't have the actual name, so use a placeholder
      url: `${url}:${lineIndex}:${columnIndex}`,
      sourceMapUrl,
      count
    })
  }

  return result
}

// Helper function to analyze the optimized result
const analyzeOptimizedResult = (optimizedResult) => {
  const ITEMS_PER_RESULT = 5
  const uniqueLocations = new Map()

  for (let i = 0; i < optimizedResult.length; i += ITEMS_PER_RESULT) {
    const objectIndex = optimizedResult[i]
    const scriptIdIndex = optimizedResult[i + 1]
    const lineIndex = optimizedResult[i + 2]
    const columnIndex = optimizedResult[i + 3]
    const count = optimizedResult[i + 4]

    const locationKey = `${scriptIdIndex}:${lineIndex}:${columnIndex}`

    if (uniqueLocations.has(locationKey)) {
      console.log(`DUPLICATE LOCATION FOUND: ${locationKey}`)
      console.log(`  Existing: count=${uniqueLocations.get(locationKey).count}`)
      console.log(`  New: count=${count}`)
    } else {
      uniqueLocations.set(locationKey, { count, objectIndex })
    }
  }

  return {
    totalUniqueLocations: uniqueLocations.size,
    totalItems: optimizedResult.length / ITEMS_PER_RESULT,
    uniqueLocations: Array.from(uniqueLocations.entries())
  }
}

test('getNamedFunctionCountFromHeapSnapshot2 - merge duplicates', () => {
  const locations = new Uint32Array([1, 2, 3, 4, 1, 2, 3, 4])
  expect(getNamedFunctionCountFromHeapSnapshot2(locations)).toEqual(new Uint32Array([1, 2, 3, 4, 2]))
})

test('getNamedFunctionCountFromHeapSnapshot2 - basic functionality', () => {
  const locations = new Uint32Array([1, 2, 3, 4, 1, 2, 3, 4])
  expect(getNamedFunctionCountFromHeapSnapshot2(locations)).toEqual(new Uint32Array([1, 2, 3, 4, 2]))
})

test('getNamedFunctionCountFromHeapSnapshot2 - multiple unique locations', () => {
  const locations = new Uint32Array([
    // objectIndex, scriptIdIndex, lineIndex, columnIndex
    0, 0, 10, 5,  // Function at script 0, line 10, column 5
    1, 1, 20, 15, // Function at script 1, line 20, column 15
  ])

  const result = getNamedFunctionCountFromHeapSnapshot2(locations)
  expect(result.length).toBe(10) // 2 locations * 5 fields
  expect(result[4]).toBe(1) // first location count
  expect(result[9]).toBe(1) // second location count
})

test('compare logic by simulating original function behavior', () => {
  // Instead of running the full original function, let's simulate its behavior
  // and compare it with the optimized function's behavior

  const locations = new Uint32Array([
    // objectIndex, scriptIdIndex, lineIndex, columnIndex
    0, 0, 10, 5,  // First function at script 0, line 10, column 5
    1, 0, 10, 5,  // Second function at script 0, line 10, column 5 (same location!)
  ])

  const scriptMap = {
    0: { url: 'test.js', sourceMapUrl: '' }
  }

  // Simulate original function behavior:
  // 1. Get functions with locations
  const functionsWithLocations = []
  for (let i = 0; i < locations.length; i += 4) {
    const objectIndex = locations[i]
    const scriptIdIndex = locations[i + 1]
    const lineIndex = locations[i + 2]
    const columnIndex = locations[i + 3]

    const script = scriptMap[scriptIdIndex]
    const url = script?.url || ''
    const sourceMapUrl = script?.sourceMapUrl || ''

    functionsWithLocations.push({
      objectIndex,
      scriptIdIndex,
      lineIndex,
      columnIndex,
      url,
      sourceMapUrl,
      name: `function_${objectIndex}` // placeholder name
    })
  }

  // 2. Normalize function objects (like original function)
  const normalized = []
  for (const functionObject of functionsWithLocations) {
    const { url, lineIndex, columnIndex, name, sourceMapUrl } = functionObject
    const displayUrl = `${url}:${lineIndex}:${columnIndex}`
    normalized.push({
      url: displayUrl,
      name,
      sourceMapUrl,
    })
  }

  // 3. Aggregate function objects (like original function)
  const map = Object.create(null)
  for (const { url } of normalized) {
    map[url] ||= 0
    map[url]++
  }
  const seen = Object.create(null)
  const aggregated = []
  for (const { url, sourceMapUrl, name } of normalized) {
    if (url in seen) {
      continue
    }
    seen[url] = true
    aggregated.push({
      name,
      url,
      sourceMapUrl,
      count: map[url],
    })
  }

  console.log('Simulated original result:', aggregated)

  // Test optimized function
  const optimizedResult = getNamedFunctionCountFromHeapSnapshot2(locations)
  console.log('Optimized result (raw):', optimizedResult)

  // Convert optimized result to same format
  const convertedOptimizedResult = convertOptimizedToOriginalFormat(optimizedResult, locations, scriptMap)
  console.log('Optimized result (converted):', convertedOptimizedResult)

  // Compare the results
  console.log('=== COMPARISON ===')
  console.log('Simulated original count:', aggregated.length)
  console.log('Optimized count:', convertedOptimizedResult.length)

  // Sort both results by URL for comparison
  const sortedOriginal = aggregated.sort((a, b) => a.url.localeCompare(b.url))
  const sortedOptimized = convertedOptimizedResult.sort((a, b) => a.url.localeCompare(b.url))

  console.log('Sorted simulated original:', sortedOriginal)
  console.log('Sorted optimized:', sortedOptimized)

  // Check if they have the same number of unique locations
  expect(aggregated.length).toBe(convertedOptimizedResult.length)

  // Check if each location has the same count
  for (let i = 0; i < sortedOriginal.length; i++) {
    console.log(`Location ${i}: Original count=${sortedOriginal[i].count}, Optimized count=${sortedOptimized[i].count}`)
    expect(sortedOriginal[i].count).toBe(sortedOptimized[i].count)
  }
})

test('verify optimized function produces same results as original logic', () => {
  // Test with multiple functions at different locations
  const locations = new Uint32Array([
    // objectIndex, scriptIdIndex, lineIndex, columnIndex
    0, 0, 10, 5,  // Function at script 0, line 10, column 5
    1, 0, 10, 5,  // Another function at script 0, line 10, column 5 (same location)
    2, 1, 20, 15, // Function at script 1, line 20, column 15
    3, 0, 30, 25, // Function at script 0, line 30, column 25
  ])

  const scriptMap = {
    0: { url: 'script1.js', sourceMapUrl: '' },
    1: { url: 'script2.js', sourceMapUrl: '' }
  }

  // Simulate original function behavior
  const functionsWithLocations = []
  for (let i = 0; i < locations.length; i += 4) {
    const objectIndex = locations[i]
    const scriptIdIndex = locations[i + 1]
    const lineIndex = locations[i + 2]
    const columnIndex = locations[i + 3]

    const script = scriptMap[scriptIdIndex]
    const url = script?.url || ''
    const sourceMapUrl = script?.sourceMapUrl || ''

    functionsWithLocations.push({
      objectIndex,
      scriptIdIndex,
      lineIndex,
      columnIndex,
      url,
      sourceMapUrl,
      name: `function_${objectIndex}`
    })
  }

  // Normalize and aggregate (like original function)
  const normalized = []
  for (const functionObject of functionsWithLocations) {
    const { url, lineIndex, columnIndex, name, sourceMapUrl } = functionObject
    const displayUrl = `${url}:${lineIndex}:${columnIndex}`
    normalized.push({
      url: displayUrl,
      name,
      sourceMapUrl,
    })
  }

  const map = Object.create(null)
  for (const { url } of normalized) {
    map[url] ||= 0
    map[url]++
  }
  const seen = Object.create(null)
  const aggregated = []
  for (const { url, sourceMapUrl, name } of normalized) {
    if (url in seen) {
      continue
    }
    seen[url] = true
    aggregated.push({
      name,
      url,
      sourceMapUrl,
      count: map[url],
    })
  }

  // Test optimized function
  const optimizedResult = getNamedFunctionCountFromHeapSnapshot2(locations)

  // Convert optimized result to same format
  const convertedOptimizedResult = convertOptimizedToOriginalFormat(optimizedResult, locations, scriptMap)

  // Sort both results by URL for comparison
  const sortedOriginal = aggregated.sort((a, b) => a.url.localeCompare(b.url))
  const sortedOptimized = convertedOptimizedResult.sort((a, b) => a.url.localeCompare(b.url))

  // Check if they have the same number of unique locations
  expect(aggregated.length).toBe(convertedOptimizedResult.length)

  // Check if each location has the same count
  for (let i = 0; i < sortedOriginal.length; i++) {
    expect(sortedOriginal[i].count).toBe(sortedOptimized[i].count)
  }
})

test('debug aggregation issue with larger dataset', () => {
  // Create a larger dataset to test aggregation
  const locations = new Uint32Array([
    // Multiple functions at the same location
    0, 0, 10, 5,  // Function at script 0, line 10, column 5
    1, 0, 10, 5,  // Another function at script 0, line 10, column 5
    2, 0, 10, 5,  // Third function at script 0, line 10, column 5
    3, 0, 10, 5,  // Fourth function at script 0, line 10, column 5

    // Functions at different locations
    4, 1, 20, 15, // Function at script 1, line 20, column 15
    5, 1, 20, 15, // Another function at script 1, line 20, column 15

    6, 0, 30, 25, // Function at script 0, line 30, column 25
    7, 2, 40, 35, // Function at script 2, line 40, column 35
  ])

  const scriptMap = {
    0: { url: 'script1.js', sourceMapUrl: '' },
    1: { url: 'script2.js', sourceMapUrl: '' },
    2: { url: 'script3.js', sourceMapUrl: '' }
  }

  // Test optimized function
  const optimizedResult = getNamedFunctionCountFromHeapSnapshot2(locations)

  console.log('Raw optimized result:', optimizedResult)
  console.log('Result length:', optimizedResult.length)
  console.log('Expected unique locations: 4 (script1.js:10:5, script2.js:20:15, script1.js:30:25, script3.js:40:35)')
  console.log('Actual unique locations:', optimizedResult.length / 5)

  // Analyze the result
  const analysis = analyzeOptimizedResult(optimizedResult)
  console.log('Analysis:', analysis)

  // Convert to original format for comparison
  const convertedResult = convertOptimizedToOriginalFormat(optimizedResult, locations, scriptMap)
  console.log('Converted result:', convertedResult)

  // Expected: 4 unique locations with counts [4, 2, 1, 1]
  expect(convertedResult.length).toBe(4)

  const counts = convertedResult.map(item => item.count).sort((a, b) => b - a)
  expect(counts).toEqual([4, 2, 1, 1])
})

test('verify that optimized function should filter by function nodes', () => {
  // This test demonstrates the key issue:
  // The original function only processes locations for FUNCTION nodes
  // The optimized function processes ALL locations (including non-function nodes)

  // Simulate a heap snapshot with mixed node types
  const locations = new Uint32Array([
    // Function nodes (should be counted)
    0, 0, 10, 5,  // Function at script 0, line 10, column 5
    1, 0, 10, 5,  // Another function at script 0, line 10, column 5

    // Non-function nodes (should NOT be counted)
    2, 1, 20, 15, // String object at script 1, line 20, column 15
    3, 2, 30, 25, // Array object at script 2, line 30, column 25
    4, 0, 40, 35, // Object at script 0, line 40, column 35
  ])

  // In a real heap snapshot, we would need to filter locations based on node types
  // For now, let's simulate what the original function would do:
  // - Only process locations for function nodes (objectIndex 0 and 1)
  // - Ignore locations for non-function nodes (objectIndex 2, 3, 4)

  const functionNodeIndices = new Set([0, 1]) // Only these are function nodes

  // Filter locations to only include function nodes
  const functionLocations = []
  for (let i = 0; i < locations.length; i += 4) {
    const objectIndex = locations[i]
    if (functionNodeIndices.has(objectIndex)) {
      functionLocations.push(
        locations[i],     // objectIndex
        locations[i + 1], // scriptIdIndex
        locations[i + 2], // lineIndex
        locations[i + 3]  // columnIndex
      )
    }
  }

  const filteredLocations = new Uint32Array(functionLocations)

  console.log('All locations:', locations)
  console.log('Filtered locations (function nodes only):', filteredLocations)

  // Test optimized function with filtered locations
  const optimizedResult = getNamedFunctionCountFromHeapSnapshot2(filteredLocations)

  console.log('Optimized result (filtered):', optimizedResult)
  console.log('Unique function locations:', optimizedResult.length / 5)

  // Should only find 1 unique location (script0:10:5 with count 2)
  expect(optimizedResult.length / 5).toBe(1)
  expect(optimizedResult[4]).toBe(2) // count should be 2
})
