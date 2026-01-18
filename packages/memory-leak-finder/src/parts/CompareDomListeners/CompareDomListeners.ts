import * as Arrays from '../Arrays/Arrays.ts'

type DomListenerNode = {
  readonly type: string
  readonly disposed: boolean
  readonly handlerName: string
  readonly nodeDescription: string
  readonly [key: string]: unknown
}

const getHash = (node: DomListenerNode): string => {
  return `${node.type}:${node.disposed}:${node.handlerName}:${node.nodeDescription}`
}

type LeakedDomListener = {
  readonly count: number
  readonly delta: number
  readonly disposed: boolean
  readonly handlerName: string
  readonly nodeDescription: string
  readonly type: string
}

const getUnique = (nodes: readonly DomListenerNode[]): readonly DomListenerNode[] => {
  const seen: { [hash: string]: boolean } = Object.create(null)
  const unique: DomListenerNode[] = []
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

const compareCount = (a: { readonly count: number }, b: { readonly count: number }): number => {
  return b.count - a.count
}

const sortByCount = (items: readonly LeakedDomListener[]): readonly LeakedDomListener[] => {
  return Arrays.toSorted(items, compareCount)
}

export const compareDomListeners = (before: readonly DomListenerNode[], after: readonly DomListenerNode[]): readonly LeakedDomListener[] => {
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
  const leaked: LeakedDomListener[] = []
  for (const item of unique) {
    const hash = getHash(item)
    const oldCount = oldCountMap[hash] || 0
    const newCount = newCountMap[hash] || 0
    const delta = newCount - oldCount
    if (delta > 0) {
      leaked.push({
        count: newCount,
        delta,
        disposed: item.disposed,
        handlerName: item.handlerName,
        nodeDescription: item.nodeDescription,
        type: item.type,
      })
    }
  }
  const sorted = sortByCount(leaked)
  return sorted
}
