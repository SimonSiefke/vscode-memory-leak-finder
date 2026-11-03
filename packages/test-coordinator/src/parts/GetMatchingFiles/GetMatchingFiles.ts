import * as MatchesFilterValue from '../MatchesFilterValue/MatchesFilterValue.ts'

export const getMatchingFiles = (dirents, filterValue) => {
  const probeNames = process.env.PR3443_PROBE_TESTS ? new Set(JSON.parse(process.env.PR3443_PROBE_TESTS)) : null
  const matchingFiles: any[] = []
  for (const dirent of dirents) {
    if (probeNames && !probeNames.has(dirent)) continue
    if (MatchesFilterValue.matchesFilterValue(dirent, filterValue)) {
      matchingFiles.push(dirent)
    }
  }
  return matchingFiles
}
