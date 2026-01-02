import * as Assert from '../Assert/Assert.ts'
import { isChromeInternalString } from '../IsChromeInternalString/IsChromeInternalString.ts'

export interface LeakedString {
  readonly string: string
  readonly delta: number
}

const compareCount = (a: LeakedString, b: LeakedString): number => {
  return b.delta - a.delta
}

const getLeakedStrings = (
  before: readonly string[],
  after: readonly string[],
  minCount: number,
  includeChromeInternalStrings: boolean,
): readonly LeakedString[] => {
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
    if (value < 0) {
      const delta = -value
      if (delta >= minCount) {
        if (includeChromeInternalStrings || !isChromeInternalString(key)) {
          leaked.push({
            string: key,
            delta: delta,
          })
        }
      }
    }
  }
  const sorted = leaked.toSorted(compareCount)
  return sorted
}

export const compareStrings2Internal = (
  before: readonly string[],
  after: readonly string[],
  minCount: number,
  includeChromeInternalStrings: boolean,
): readonly LeakedString[] => {
  Assert.array(before)
  Assert.array(after)
  Assert.number(minCount)
  Assert.boolean(includeChromeInternalStrings)
  const leaked = getLeakedStrings(before, after, minCount, includeChromeInternalStrings)
  return leaked
}
