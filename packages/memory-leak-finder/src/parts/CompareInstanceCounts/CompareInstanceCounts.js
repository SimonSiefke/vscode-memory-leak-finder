import * as PrettifyInstanceCounts from '../PrettifyInstanceCounts/PrettifyInstanceCounts.js'

export const compareInstanceCounts = async (before, after) => {
  const prettyBefore = await PrettifyInstanceCounts.prettifyInstanceCounts(before)
  const prettyAfter = await PrettifyInstanceCounts.prettifyInstanceCounts(after)
  return {
    before: prettyBefore,
    after: prettyAfter,
  }
}
