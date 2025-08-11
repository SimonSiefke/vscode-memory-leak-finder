import * as PrettifyInstanceCounts from '../PrettifyInstanceCounts/PrettifyInstanceCounts.ts'

export const compareInstanceCounts = (before, after) => {
  const prettyBefore = PrettifyInstanceCounts.prettifyInstanceCounts(before)
  const prettyAfter = PrettifyInstanceCounts.prettifyInstanceCounts(after)
  return {
    before: prettyBefore,
    after: prettyAfter,
  }
}
