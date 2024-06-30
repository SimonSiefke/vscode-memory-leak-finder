const mergeItems = (beforeMap, afterMap) => {
  const leaked = []
  for (const [name, afterCount] of Object.entries(afterMap)) {
    const beforeCount = beforeMap[name] || 0
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        name,
        count: afterCount,
        delta,
      })
    }
  }
  return leaked
}

export const compareNamedArrayCountDifference = (before, after) => {
  const leaked = mergeItems(before, after)
  return leaked
}
