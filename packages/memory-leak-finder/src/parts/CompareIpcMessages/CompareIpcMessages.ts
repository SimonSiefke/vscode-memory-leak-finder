import * as Hash from '../Hash/Hash.ts'

export const compare = (before: any, after: any) => {
  const b = Array.isArray(before) ? before : []
  const a = Array.isArray(after) ? after : []

  // Map from stable key -> count
  const countMap = (arr: any[]) => {
    const m = new Map<string, number>()
    const sample = new Map<string, string>()
    for (const item of arr) {
      const key = Hash.objectHash(item)
      m.set(key, (m.get(key) || 0) + 1)
      if (!sample.has(key)) {
        try {
          sample.set(key, JSON.stringify(item))
        } catch (e) {
          sample.set(key, String(item))
        }
      }
    }
    return { m, sample }
  }

  const { m: beforeMap, sample: beforeSample } = countMap(b)
  const { m: afterMap, sample: afterSample } = countMap(a)

  const added: any[] = []

  for (const [key, afterCount] of afterMap.entries()) {
    const beforeCount = beforeMap.get(key) || 0
    const diff = afterCount - beforeCount
    if (diff > 0) {
      const sampleStr = afterSample.get(key) || beforeSample.get(key) || key
      try {
        const parsed = JSON.parse(sampleStr)
        added.push(...Array(diff).fill(parsed))
      } catch (e) {
        added.push(...Array(diff).fill(sampleStr))
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
