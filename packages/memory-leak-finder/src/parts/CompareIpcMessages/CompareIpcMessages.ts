export const compare = (before: any, after: any) => {
  const b = Array.isArray(before) ? before : []
  const a = Array.isArray(after) ? after : []

  const countMap = (arr: any[]) => {
    const m = new Map<string, number>()
    for (const item of arr) {
      try {
        const key = JSON.stringify(item)
        m.set(key, (m.get(key) || 0) + 1)
      } catch (e) {
        const key = String(item)
        m.set(key, (m.get(key) || 0) + 1)
      }
    }
    return m
  }

  const beforeMap = countMap(b)
  const afterMap = countMap(a)

  const added: any[] = []

  for (const [key, afterCount] of afterMap.entries()) {
    const beforeCount = beforeMap.get(key) || 0
    const diff = afterCount - beforeCount
    if (diff > 0) {
      try {
        added.push(...Array(diff).fill(JSON.parse(key)))
      } catch (e) {
        added.push(...Array(diff).fill(key))
      }
    }
  }

  return {
    before: b,
    after: a,
    added,
  }
}

export default { compare }
