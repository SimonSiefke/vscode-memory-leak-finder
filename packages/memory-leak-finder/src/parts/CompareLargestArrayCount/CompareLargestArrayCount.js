export const compareLargestArrayCount = (before, after) => {
  const beforeMap = Object.create(null)
  for (const item of before) {
    beforeMap[item.id] = item.count
  }
  const leaked = []
  for (const item of after) {
    const afterCount = item.count
    const beforeCount = beforeMap[item.id] || 0
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        name: after.name,
        length: afterCount,
        delta,
      })
    }
  }
  return leaked
}
