import * as MatchesFilterValue from '../MatchesFilterValue/MatchesFilterValue.js'

export const getMatchingFiles = (dirents, filterValue) => {
  const matchingFiles = []
  for (const dirent of dirents) {
    if (MatchesFilterValue.matchesFilterValue(dirent, filterValue)) {
      matchingFiles.push(dirent)
    }
  }
  return matchingFiles
}
