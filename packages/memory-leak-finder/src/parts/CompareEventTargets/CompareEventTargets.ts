import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'

const compareEventTarget = (a, b) => {
  return b.count - a.count || a.description.localeCompare(b.description)
}

const sort = (eventTargets) => {
  return Arrays.toSorted(eventTargets, compareEventTarget)
}

const prettifyEventTargets = (eventTargets) => {
  const countMap = Object.create(null)
  for (const eventTarget of eventTargets) {
    const { description } = eventTarget
    countMap[description] ||= 0
    countMap[description]++
  }
  const result: any[] = []
  for (const [key, value] of Object.entries(countMap)) {
    result.push({
      count: value,
      description: key,
    })
  }
  const sorted = sort(result)
  return sorted
}

export const compareEventTargets = (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const prettyBefore = prettifyEventTargets(before)
  const prettyAfter = prettifyEventTargets(after)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
