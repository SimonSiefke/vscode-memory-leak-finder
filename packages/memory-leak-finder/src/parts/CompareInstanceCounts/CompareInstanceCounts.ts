import * as PrettifyInstanceCounts from '../PrettifyInstanceCounts/PrettifyInstanceCounts.ts'

export const compareInstanceCounts = (before: unknown, after: unknown) => {
  const prettyBefore = PrettifyInstanceCounts.prettifyInstanceCounts(before)
  const prettyAfter = PrettifyInstanceCounts.prettifyInstanceCounts(after)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
