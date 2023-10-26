import * as GetDomNodeKey from '../GetDomNodeKey/GetDomNodeKey.js'

const compareDetachedDomNode = (a, b) => {
  if (!a.description) {
    return b
  }
  if (!b.description) {
    return a
  }
  return a.description.localeCompare(b.description)
}

export const compareDetachedDomNodes = (before, after) => {
  const map = Object.create(null)
  for (const domNode of before) {
    const key = GetDomNodeKey.getDomNodeKey(domNode)
    map[key] ||= 0
    map[key]++
  }
  const leaked = []
  for (const domNode of after) {
    const key = GetDomNodeKey.getDomNodeKey(domNode)
    if (!map[key]) {
      const { objectId, ...rest } = domNode
      leaked.push(rest)
    } else {
      map[key]--
    }
  }
  leaked.sort(compareDetachedDomNode)
  return leaked
}
