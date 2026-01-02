import * as Assert from '../Assert/Assert.ts'

export interface LeakedString {
  readonly string: string
  readonly delta: number
}

const compareCount = (a: LeakedString, b: LeakedString): number => {
  return b.delta - a.delta
}

const getLeakedStrings = (before: readonly string[], after: readonly string[], minCount: number): readonly LeakedString[] => {
  const countMap: Record<string, number> = Object.create(null)
  for (const item of before) {
    countMap[item] ||= 0
    countMap[item]++
  }
  for (const item of after) {
    countMap[item] ||= 0
    countMap[item]--
  }
  const leaked: LeakedString[] = []
  for (const [key, value] of Object.entries(countMap)) {
    if (value < 0 && -value >= minCount) {
      leaked.push({
        string: key,
        delta: -value,
      })
    }
  }
  const sorted = leaked.toSorted(compareCount)
  return sorted
}

export const compareStrings2Internal = (before: readonly string[], after: readonly string[], minCount: number): readonly LeakedString[] => {
  Assert.array(before)
  Assert.string(after)
  Assert.number(minCount)
  const leaked = getLeakedStrings(before, after, minCount)
  return leaked
}
