import type { Dynamic } from '../Types/Types.ts'
import * as Arrays from '../Arrays/Arrays.ts'
import * as GetDomNodeHash from '../GetDomNodeHash/GetDomNodeHash.ts'
const compareNode = (a: Dynamic, b: Dynamic) => {
  return b.count - a.count
}
export const deduplicatedDetachedDomNodes = (detachedDomNodes: Dynamic) => {
  const countMap = Object.create(null)
  const detachedDomNodeMap = Object.create(null)
  for (const domNode of detachedDomNodes) {
    const hash = GetDomNodeHash.getDomNodeHash(domNode)
    detachedDomNodeMap[hash] = domNode
    countMap[hash] ||= 0
    countMap[hash]++
  }
  const deduplicated: Dynamic[] = []
  for (const [key, value] of Object.entries(detachedDomNodeMap)) {
    const count = countMap[key]
    // @ts-ignore
    const { objectId, subtype, type, ...rest } = /** @type {unknown} */ value
    deduplicated.push({
      ...rest,
      count,
    })
  }
  const sorted = Arrays.toSorted(deduplicated, compareNode)
  return sorted
}
