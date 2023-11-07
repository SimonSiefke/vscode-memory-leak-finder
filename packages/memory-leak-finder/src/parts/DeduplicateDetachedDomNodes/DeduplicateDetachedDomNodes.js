const getDomNodeHash = (domNode) => {
  return `${domNode.className}-${domNode.description}`
}

export const deduplicatedDetachedDomNodes = (detachedDomNodes) => {
  const countMap = Object.create(null)
  const detachedDomNodeMap = Object.create(null)
  for (const domNode of detachedDomNodes) {
    const hash = getDomNodeHash(domNode)
    detachedDomNodeMap[hash] = domNode
    deduplicatedDetachedDomNodes[hash] = domNode
    countMap[hash] ||= 0
    countMap[hash]++
  }
  const deduplicated = []
  for (const [key, value] of Object.entries(detachedDomNodeMap)) {
    const count = countMap[key]
    deduplicated.push({
      ...value,
      count,
    })
  }
  return deduplicated
}
