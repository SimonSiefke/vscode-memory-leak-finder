import * as CompareMapLeakCount from '../CompareMapLeakCount/CompareMapLeakCount.js'
import * as PrettifyInstanceCounts from '../PrettifyInstanceCounts/PrettifyInstanceCounts.js'

export const compareInstanceCounts = (before, after) => {
  // TODO use object id for comparison
  // but currently it seems objectIds for constructors are changing in before/after
  const leaked = CompareMapLeakCount.compareMapLeakCount(before, after, (object) => object.name)
  // const prettyLeaked = PrettifyInstanceCounts.prettifyInstanceCounts(leaked)
  return leaked
}
