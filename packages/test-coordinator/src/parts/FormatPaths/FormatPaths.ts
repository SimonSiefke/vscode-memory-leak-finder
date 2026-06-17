import * as FormatPath from '../FormatPath/FormatPath.ts'

export const formatPaths = (cwd, testsPath, dirents) => {
  const formattedPaths: any[] = Array.from(dirents, (dirent) => FormatPath.formatPath(cwd, testsPath, dirent))
  return formattedPaths
}
