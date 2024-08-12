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
  const result = []
  for (const element of after) {
    const beforeCount = beforeMap[element] || 0
    const afterCount = afterMap[element] || 0
    const delta = afterCount - beforeCount
    result.push({
      value: element,
      count: afterCount,
      delta,
    })
  }
  return result
}
