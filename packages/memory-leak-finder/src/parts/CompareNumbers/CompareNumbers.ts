import * as SortCountMap from '../SortCountMap/SortCountMap.ts'

export const compareNumbers = (before: unknown, after: unknown): readonly { count: number; delta: number; value: number }[] => {
  const beforeMap: { [key: number]: number } = Object.create(null)
  for (const element of before as readonly number[]) {
    beforeMap[element] ||= 0
    beforeMap[element]++
  }
  const afterMap: { [key: number]: number } = Object.create(null)
  for (const element of after as readonly number[]) {
    afterMap[element] ||= 0
    afterMap[element]++
  }
  const result: { count: number; delta: number; value: number }[] = []
  const seen: number[] = []
  for (const element of after as readonly number[]) {
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
