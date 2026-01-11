import * as SortCountMap from '../SortCountMap/SortCountMap.ts'

export const compareNumbers = (before, after) => {
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
  const result: any[] = []
  const seen: any[] = []
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
