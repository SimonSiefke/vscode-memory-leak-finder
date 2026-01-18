import * as MatchesFilterValue from '../MatchesFilterValue/MatchesFilterValue.ts'

export const getMatchingFiles = (dirents: string[], filterValue: string) => {
  const matchingFiles: any[] = []
  for (const dirent of dirents) {
    if (MatchesFilterValue.matchesFilterValue(dirent, filterValue)) {
      matchingFiles.push(dirent)
    }
  }
  return matchingFiles
}
