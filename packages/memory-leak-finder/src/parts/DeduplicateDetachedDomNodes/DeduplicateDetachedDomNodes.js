import * as GetDomNodeHash from '../GetDomNodeHash/GetDomNodeHash.js'

const compareNode = (a, b) => {
  return b.count - a.count
}

export const deduplicatedDetachedDomNodes = (detachedDomNodes) => {
  const countMap = Object.create(null)
  const detachedDomNodeMap = Object.create(null)
  for (const domNode of detachedDomNodes) {
    const hash = GetDomNodeHash.getDomNodeHash(domNode)
    detachedDomNodeMap[hash] = domNode
    deduplicatedDetachedDomNodes[hash] = domNode
    countMap[hash] ||= 0
    countMap[hash]++
  }
  const deduplicated = []
  for (const [key, value] of Object.entries(detachedDomNodeMap)) {
    const count = countMap[key]
    const { objectId, type, subtype, ...rest } = value
    deduplicated.push({
      ...rest,
      count,
    })
  }
  deduplicated.sort(compareNode)
  return deduplicated
}
