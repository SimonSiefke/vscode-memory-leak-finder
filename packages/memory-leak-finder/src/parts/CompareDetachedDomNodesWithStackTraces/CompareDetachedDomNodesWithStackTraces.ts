import * as CompareDetachedDomNodes from '../CompareDetachedDomNodes/CompareDetachedDomNodes.js'

export const compareDetachedDomNodesWithStackTraces = (before, after) => {
  const result = CompareDetachedDomNodes.compareDetachedDomNodes(before, after)
  return {
    after: result.after,
    before: result.before,
  }
}
