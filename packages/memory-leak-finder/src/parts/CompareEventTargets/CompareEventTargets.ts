import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'

const compareEventTarget = (a: { count: number; description: string }, b: { count: number; description: string }): number => {
  return b.count - a.count || a.description.localeCompare(b.description)
}

const sort = (eventTargets: readonly { count: number; description: string }[]): readonly { count: number; description: string }[] => {
  return Arrays.toSorted(eventTargets, compareEventTarget)
}

const prettifyEventTargets = (eventTargets: readonly { description: string }[]): readonly { count: number; description: string }[] => {
  const countMap = Object.create(null)
  for (const eventTarget of eventTargets) {
    const { description } = eventTarget
    countMap[description] ||= 0
    countMap[description]++
  }
  const result: { count: number; description: string }[] = []
  for (const [key, value] of Object.entries(countMap)) {
    result.push({
      count: value,
      description: key,
    })
  }
  const sorted = sort(result)
  return sorted
}

export const compareEventTargets = (before: unknown, after: unknown): { after: readonly { count: number; description: string }[]; before: readonly { count: number; description: string }[] } => {
  Assert.array(before)
  Assert.array(after)
  const prettyBefore = prettifyEventTargets(before)
  const prettyAfter = prettifyEventTargets(after)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
