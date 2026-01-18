import * as Arrays from '../Arrays/Arrays.ts'
import * as GetDomNodeHash from '../GetDomNodeHash/GetDomNodeHash.ts'

type DetachedDomNode = {
  readonly count: number
  readonly [key: string]: unknown
}

const compareNode = (a: DetachedDomNode, b: DetachedDomNode): number => {
  return b.count - a.count
}

export const deduplicatedDetachedDomNodes = (detachedDomNodes: readonly Record<string, unknown>[]): readonly DetachedDomNode[] => {
  const countMap: { readonly [hash: string]: number } = Object.create(null)
  const detachedDomNodeMap: { readonly [hash: string]: Record<string, unknown> } = Object.create(null)
  for (const domNode of detachedDomNodes) {
    const hash = GetDomNodeHash.getDomNodeHash(domNode)
    detachedDomNodeMap[hash] = domNode
    countMap[hash] ||= 0
    countMap[hash]++
  }
  const deduplicated: DetachedDomNode[] = []
  for (const [key, value] of Object.entries(detachedDomNodeMap)) {
    const count = countMap[key]
    // @ts-ignore
    const { objectId, subtype, type, ...rest } = /** @type {any} */ value
    deduplicated.push({
      ...rest,
      count,
    })
  }
  const sorted = Arrays.toSorted(deduplicated, compareNode)
  return sorted
}
