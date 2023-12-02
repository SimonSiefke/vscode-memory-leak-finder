import * as CompareDetachedDomNodes from '../CompareDetachedDomNodes/CompareDetachedDomNodes.js'

export const compareDetachedDomNodesWithStackTraces = (before, after) => {
  return CompareDetachedDomNodes.compareDetachedDomNodes(before, after.descriptors)
}
