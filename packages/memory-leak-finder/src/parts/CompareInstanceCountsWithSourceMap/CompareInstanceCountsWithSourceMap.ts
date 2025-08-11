import * as PrettifyInstanceCountsWithSourceMap from '../PrettifyInstanceCountsWithSourceMap/PrettifyInstanceCountsWithSourceMap.ts'
import * as Assert from '../Assert/Assert.ts'

export const compareInstanceCountsWithSourceMap = async (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const prettyBefore = await PrettifyInstanceCountsWithSourceMap.prettifyInstanceCountsWithSourceMap(before)
  const prettyAfter = await PrettifyInstanceCountsWithSourceMap.prettifyInstanceCountsWithSourceMap(after)
  return {
    before: prettyBefore,
    after: prettyAfter,
  }
}
