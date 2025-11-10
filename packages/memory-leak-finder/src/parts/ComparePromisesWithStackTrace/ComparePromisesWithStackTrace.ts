import * as Assert from '../Assert/Assert.ts'
import * as Hash from '../Hash/Hash.ts'

const hashPromise = (item) => {
  const { preview, stackTrace } = item
  const { properties } = preview
  return Hash.hash({
    properties,
    stackTrace,
  })
}

const getAdded = (before, after) => {
  const map = Object.create(null)
  for (const item of before) {
    const hash = hashPromise(item)
    map[hash] ||= 0
    map[hash]++
  }
  const leaked = []
  for (const item of after) {
    const hash = hashPromise(item)
    if (map[hash]) {
      map[hash]--
    } else {
      leaked.push(item)
    }
  }
  return leaked
}

const deduplicate = (leaked) => {
  const map = Object.create(null)
  const countMap = Object.create(null)
  for (const item of leaked) {
    const hash = hashPromise(item)
    map[hash] = item
    countMap[hash] ||= 0
    countMap[hash]++
  }
  const deduplicated: any[] = []
  for (const [key, value] of Object.entries(map)) {
    const count = countMap[key]
    deduplicated.push({
      ...(value as any),
      count,
    })
  }
  return deduplicated
}

const cleanItem = (item) => {
  const { preview, stackTrace, count } = item
  const { properties } = preview
  return {
    count,
    properties,
    stackTrace: stackTrace.split('\n'),
  }
}

const clean = (items) => {
  return items.map(cleanItem)
}

const compareItem = (a, b) => {
  return b.count - a.count
}

const sortItems = (items) => {
  return items.toSorted(compareItem)
}

export const comparePromisesWithStackTrace = (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const leaked = getAdded(before, after)
  const deduplicated = deduplicate(leaked)
  const sorted = sortItems(deduplicated)
  const cleanLeaked = clean(sorted)
  return cleanLeaked
}
