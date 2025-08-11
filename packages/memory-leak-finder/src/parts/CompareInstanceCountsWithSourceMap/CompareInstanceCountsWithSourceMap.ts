import * as PrettifyInstanceCountsWithSourceMap from '../PrettifyInstanceCountsWithSourceMap/PrettifyInstanceCountsWithSourceMap.js'
import * as Assert from '../Assert/Assert.js'

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
