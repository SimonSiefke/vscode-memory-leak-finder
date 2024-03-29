export const compareMapLeak = (before, after, getKey) => {
  const map = Object.create(null)
  for (const element of before) {
    const key = getKey(element)
    map[key] ||= 0
    map[key]++
  }
  const leaked = []
  for (const element of after) {
    const key = getKey(element)
    if (map[key]) {
      map[key]--
    } else {
      const { objectId, ...rest } = element
      leaked.push(rest)
    }
  }
  return leaked
}
