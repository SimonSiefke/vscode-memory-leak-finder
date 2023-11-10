export const compareMapLeakCount = (before, after, getKey) => {
  const map = Object.create(null)
  for (const element of before) {
    const key = getKey(element)
    map[key] = element.count
  }
  const leaked = []
  for (const element of after) {
    const key = getKey(element)
    const old = map[key]
    const beforeCount = old || 0
    const afterCount = element.count
    if (afterCount > beforeCount) {
      const { name } = element
      leaked.push({
        beforeCount,
        afterCount,
        name,
      })
    }
  }
  return { before, after, leaked, map }
}
