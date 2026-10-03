import type { Dynamic } from '../Types/Types.ts'
import * as PrettifyInstanceCounts from '../PrettifyInstanceCounts/PrettifyInstanceCounts.ts'
export const compareInstanceCounts = (before: Dynamic, after: Dynamic) => {
  const prettyBefore = PrettifyInstanceCounts.prettifyInstanceCounts(before)
  const prettyAfter = PrettifyInstanceCounts.prettifyInstanceCounts(after)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
