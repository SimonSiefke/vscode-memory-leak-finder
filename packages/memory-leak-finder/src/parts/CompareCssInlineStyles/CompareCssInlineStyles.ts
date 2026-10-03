import type { Dynamic } from '../Types/Types.ts'
import * as Assert from '../Assert/Assert.ts'
const sortEntries = (entries: Dynamic) => {
  return entries.sort((a: Dynamic, b: Dynamic) => {
    return b[1] - a[1]
  })
}
const prettifyMap = (map: Dynamic) => {
  const entries = Object.entries(map)
  const sortedEntries = sortEntries(entries)
  const sortedMap = Object.create(null)
  for (const entry of sortedEntries) {
    sortedMap[entry[0]] = entry[1]
  }
  return sortedMap
}
export const compareCssInlineStyles = (before: Dynamic, after: Dynamic) => {
  Assert.object(before)
  Assert.object(after)
  const prettyBefore = prettifyMap(before)
  const prettyAfter = prettifyMap(after)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
