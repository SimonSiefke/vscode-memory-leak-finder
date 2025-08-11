import * as FormatPath from '../FormatPath/FormatPath.ts'

export const formatPaths = (cwd, testsPath, dirents) => {
  const formattedPaths: any[] = []
  for (const dirent of dirents) {
    formattedPaths.push(FormatPath.formatPath(cwd, testsPath, dirent))
  }
  return formattedPaths
}
