import * as Assert from '../Assert/Assert.ts'

const sortEntries = (entries: readonly [string, number][]): readonly [string, number][] => {
  return [...entries].sort((a: [string, number], b: [string, number]) => {
    return b[1] - a[1]
  })
}

const prettifyMap = (map) => {
  const entries = Object.entries(map)
  const sortedEntries = sortEntries(entries)
  const sortedMap = Object.create(null)
  for (const entry of sortedEntries) {
    sortedMap[entry[0]] = entry[1]
  }
  return sortedMap
}

export const compareCssInlineStyles = (before: { readonly [key: string]: number }, after: { readonly [key: string]: number }): { after: { readonly [key: string]: number }; before: { readonly [key: string]: number } } => {
  Assert.object(before)
  Assert.object(after)
  const prettyBefore = prettifyMap(before)
  const prettyAfter = prettifyMap(after)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
