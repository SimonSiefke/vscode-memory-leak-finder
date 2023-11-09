import * as FormatPath from '../FormatPath/FormatPath.js'

export const formatPaths = (cwd, testsPath, dirents) => {
  const formattedPaths = []
  for (const dirent of dirents) {
    formattedPaths.push(FormatPath.formatPath(cwd, testsPath, dirent))
  }
  return formattedPaths
}
