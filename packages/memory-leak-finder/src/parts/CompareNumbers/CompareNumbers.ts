import type { Dynamic } from '../Types/Types.ts'
import * as SortCountMap from '../SortCountMap/SortCountMap.ts'
export const compareNumbers = (before: Dynamic, after: Dynamic) => {
  const beforeMap = Object.create(null)
  for (const element of before) {
    beforeMap[element] ||= 0
    beforeMap[element]++
  }
  const afterMap = Object.create(null)
  for (const element of after) {
    afterMap[element] ||= 0
    afterMap[element]++
  }
  const result: Dynamic[] = []
  const seen: Dynamic[] = []
  for (const element of after) {
    if (seen.includes(element)) {
      continue
    }
    seen.push(element)
    const beforeCount = beforeMap[element] || 0
    const afterCount = afterMap[element] || 0
    const delta = afterCount - beforeCount
    result.push({
      count: afterCount,
      delta,
      value: element,
    })
  }
  const sortedResult = SortCountMap.sortCountMap(result)
  return sortedResult
}
