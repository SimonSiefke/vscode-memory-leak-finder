export const getMatchingFiles = (dirents, filterValue) => {
  const matchingFiles = []
  for (const dirent of dirents) {
    if (dirent.includes(filterValue)) {
      matchingFiles.push(dirent)
    }
  }
  return matchingFiles
}
