import * as Assert from '../Assert/Assert.js'
import * as Arrays from '../Arrays/Arrays.js'

const getDifference = (prettyBefore, prettyAfter) => {
  const beforeMap = Object.create(null)
  for (const element of prettyBefore) {
    beforeMap[element.description] = element.count
  }
  const result = []
  for (const element of prettyAfter) {
    const beforeCount = beforeMap[element.description] || 0
    if (element.count > beforeCount) {
      result.push({
        ...element,
        beforeCount,
      })
    }
  }
  return result
}

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
  const result = []
  for (const [key, value] of Object.entries(countMap)) {
    result.push({
      description: key,
      count: value,
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
    before: prettyBefore,
    after: prettyAfter,
  }
}
