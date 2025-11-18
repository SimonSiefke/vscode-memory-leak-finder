export const compareCssRules = (before: readonly string[], after: readonly string[]) => {
  const leaked: string[] = []
  const countMap: Record<string, number> = Object.create(null)
  for (const item of before) {
    countMap[item] ||= 0
    countMap[item]++
  }
  for (const item of after) {
    if (!(item in countMap)) {
      leaked.push(item)
      continue
    }
    countMap[item]--
    if (countMap[item] < 0) {
      leaked.push(item)
    }
  }
  return {
    leaked,
  }
}
