import * as Arrays from '../Arrays/Arrays.js'

const getHash = (node) => {
  return `${node.type}:${node.disposed}:${node.handlerName}:${node.nodeDescription}`
}

const getUnique = (nodes) => {
  const seen = Object.create(null)
  const unique = []
  for (const node of nodes) {
    const hash = getHash(node)
    if (hash in seen) {
      continue
    }
    seen[hash] = true
    unique.push(node)
  }
  return unique
}

const compareCount = (a, b) => {
  return b.count - a.count
}

const sortByCount = (items) => {
  return Arrays.toSorted(items, compareCount)
}

export const compareDomListeners = (before, after) => {
  const oldCountMap = Object.create(null)
  for (const item of before) {
    const hash = getHash(item)
    oldCountMap[hash] ||= 0
    oldCountMap[hash]++
  }
  const newCountMap = Object.create(null)
  for (const item of after) {
    const hash = getHash(item)
    newCountMap[hash] ||= 0
    newCountMap[hash]++
  }
  const unique = getUnique(after)
  const leaked = []
  for (const item of unique) {
    const hash = getHash(item)
    const oldCount = oldCountMap[hash] || 0
    const newCount = newCountMap[hash] || 0
    const delta = newCount - oldCount
    if (delta > 0) {
      leaked.push({
        type: item.type,
        handlerName: item.handlerName,
        nodeDescription: item.nodeDescription,
        disposed: item.disposed,
        count: newCount,
        delta,
      })
    }
  }
  const sorted = sortByCount(leaked)
  return sorted
}
