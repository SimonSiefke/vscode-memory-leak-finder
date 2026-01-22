import * as Hash from '../Hash/Hash.ts'

export const compare = (before: readonly any[], after: readonly any[]): readonly any[] => {
  const counts = Object.create(null)
  for (const item of before) {
    const hash = Hash.hash(item)
    if (!counts[hash]) {
      counts[hash] = 0
    }
    counts[hash]++
  }
  const afterCounts = Object.create(null)
  for (const item of after) {
    const hash = Hash.hash(item)
    if (!afterCounts[hash]) {
      afterCounts[hash] = 0
    }
    afterCounts[hash]++
  }

  const added: any[] = []

  for (const item of after) {
    const hash = Hash.hash(item)
    const beforeCount = counts[hash] ?? 0
    const afterCount = afterCounts[hash] ?? 0
    const diff = afterCount - beforeCount
    if (diff > 0) {
      added.push(item)
      afterCounts[hash]--
    }
  }

  return added
}
