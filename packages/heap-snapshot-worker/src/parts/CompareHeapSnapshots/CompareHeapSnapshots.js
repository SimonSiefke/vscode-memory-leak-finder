import { getNamedFunctionCountFromHeapSnapshot2 } from '../GetNamedFunctionCountFromHeapSnapshot2/GetNamedFunctionCountFromHeapSnapshot2.js'

const ITEMS_PER_RESULT = 5

/**
 * Compare two heap snapshots and find functions that have increased in count (potential leaks)
 * @param {Uint32Array} locations1 - Locations from first heap snapshot
 * @param {Uint32Array} locations2 - Locations from second heap snapshot
 * @param {Object} scriptMap - Map of scriptIdIndex to script info with url
 * @returns {Array<{count: number, delta: number, scriptId: number, line: number, column: number}>}
 */
export const compareHeapSnapshots = (locations1, locations2, scriptMap = {}) => {
  // Get unique locations for both snapshots
  const result1 = getNamedFunctionCountFromHeapSnapshot2(locations1, scriptMap)
  const result2 = getNamedFunctionCountFromHeapSnapshot2(locations2, scriptMap)

  // Create maps for easy lookup
  const map1 = new Map()
  const map2 = new Map()

  // Process first snapshot results
  for (let i = 0; i < result1.length; i += ITEMS_PER_RESULT) {
    const objectIndex = result1[i]
    const scriptId = result1[i + 1]
    const line = result1[i + 2]
    const column = result1[i + 3]
    const count = result1[i + 4]

    const key = `${scriptId}:${line}:${column}`
    map1.set(key, { count, scriptId, line, column })
  }

  // Process second snapshot results and compare
  const leakedFunctions = []

  for (let i = 0; i < result2.length; i += ITEMS_PER_RESULT) {
    const objectIndex = result2[i]
    const scriptId = result2[i + 1]
    const line = result2[i + 2]
    const column = result2[i + 3]
    const count = result2[i + 4]

    const key = `${scriptId}:${line}:${column}`
    const previous = map1.get(key)

    if (previous) {
      // Function exists in both snapshots
      const delta = count - previous.count
      if (delta > 0) {
        // Function count increased - potential leak
        leakedFunctions.push({
          count,
          delta,
          scriptId,
          line,
          column,
        })
      }
    } else {
      // Function is new in second snapshot - potential leak
      leakedFunctions.push({
        count,
        delta: count, // All instances are new
        scriptId,
        line,
        column,
      })
    }
  }

  // Sort by delta (highest increase first), then by count
  leakedFunctions.sort((a, b) => {
    if (b.delta !== a.delta) {
      return b.delta - a.delta
    }
    return b.count - a.count
  })

  return leakedFunctions
}
