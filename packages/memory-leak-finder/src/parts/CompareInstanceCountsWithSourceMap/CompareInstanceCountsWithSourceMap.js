import * as PrettifyInstanceCountsWithSourceMap from '../PrettifyInstanceCountsWithSourceMap/PrettifyInstanceCountsWithSourceMap.js'

export const compareInstanceCountsWithSourceMap = async (before, after) => {
  const prettyBefore = await PrettifyInstanceCountsWithSourceMap.prettifyInstanceCountsWithSourceMap(before)
  const prettyAfter = await PrettifyInstanceCountsWithSourceMap.prettifyInstanceCountsWithSourceMap(after)
  return {
    before: prettyBefore,
    after: prettyAfter,
  }
}
