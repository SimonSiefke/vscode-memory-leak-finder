import type { Dynamic } from '../Types/Types.ts'
import * as Assert from '../Assert/Assert.ts'
import * as PrettifyInstanceCountsWithSourceMap from '../PrettifyInstanceCountsWithSourceMap/PrettifyInstanceCountsWithSourceMap.ts'
export const compareInstanceCountsWithSourceMap = async (before: Dynamic, after: Dynamic) => {
  Assert.array(before)
  Assert.array(after)
  const prettyBefore = await PrettifyInstanceCountsWithSourceMap.prettifyInstanceCountsWithSourceMap(before)
  const prettyAfter = await PrettifyInstanceCountsWithSourceMap.prettifyInstanceCountsWithSourceMap(after)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
