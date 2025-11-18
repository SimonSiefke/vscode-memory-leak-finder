export const compareCssRules = (before: readonly string[], after: readonly string[]) => {
  const leaked: string[] = []
  const countMap: Record<string, number> = Object.create(null)
  for (const item of before) {
    countMap[item] ||= 0
    countMap[item]++
  }
  for (const item of after) {
    countMap[item]--
    if (countMap[item] < 0) {
      leaked.push(item)
    }
  }
  console.log('oldcount', before.length)
  console.log('newcount', after.length)
  return {
    leaked,
  }
}
