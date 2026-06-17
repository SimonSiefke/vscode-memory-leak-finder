import type { Dynamic } from '../Types/Types.ts'
export const compareLargestArrayCount = (before: Dynamic, after: Dynamic) => {
  const beforeMap = Object.create(null)
  for (const item of before) {
    beforeMap[item.id] = item.count
  }
  const leaked: Dynamic[] = []
  for (const item of after) {
    const afterCount = item.count
    const beforeCount = beforeMap[item.id] || 0
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        delta,
        length: afterCount,
        name: item.name,
      })
    }
  }
  return leaked
}
